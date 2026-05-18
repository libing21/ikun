package hotspot

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"kunzong/backend/internal/ai"
	"kunzong/backend/internal/config"
	"kunzong/backend/internal/model"
	"kunzong/backend/internal/moderation"
	"kunzong/backend/internal/repository"
)

type Worker struct {
	cfg      config.Config
	repo     *repository.Repository
	searches []*SearchClient
	provider ai.Provider
	checker  *moderation.Checker
}

func NewWorker(cfg config.Config, repo *repository.Repository, provider ai.Provider, checker *moderation.Checker) *Worker {
	searches := make([]*SearchClient, 0, len(cfg.WebSearchEndpoints))
	for _, endpoint := range cfg.WebSearchEndpoints {
		if strings.TrimSpace(endpoint) != "" {
			searches = append(searches, NewSearchClient(endpoint, cfg.WebSearchAPIKey, cfg.WebSearchInsecureSkipVerify))
		}
	}
	if len(searches) == 0 {
		searches = append(searches, NewSearchClient(cfg.WebSearchDefaultEndpoint, cfg.WebSearchAPIKey, cfg.WebSearchInsecureSkipVerify))
	}
	return &Worker{
		cfg:      cfg,
		repo:     repo,
		searches: searches,
		provider: provider,
		checker:  checker,
	}
}

func (w *Worker) Start(ctx context.Context) {
	if !w.cfg.HotspotEnabled {
		log.Println("hotspot worker disabled")
		return
	}
	if w.cfg.HotspotInterval <= 0 {
		w.cfg.HotspotInterval = 24 * time.Hour
	}
	log.Printf("hotspot worker enabled, interval=%s, queries=%d", w.cfg.HotspotInterval, len(w.cfg.HotspotQueries))
	if w.cfg.HotspotRunOnStart {
		go w.safeRun(ctx)
	}
	go func() {
		ticker := time.NewTicker(w.cfg.HotspotInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				log.Println("hotspot worker stopped")
				return
			case <-ticker.C:
				w.safeRun(ctx)
			}
		}
	}()
}

func (w *Worker) safeRun(ctx context.Context) {
	if _, err := w.RunOnce(ctx); err != nil {
		log.Printf("hotspot run failed: %v", err)
	}
}

func (w *Worker) RunOnce(ctx context.Context) (*model.Post, error) {
	author, err := w.ensureBotUser()
	if err != nil {
		return nil, err
	}
	results, err := w.collectResults(ctx)
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, errors.New("no hotspot results found")
	}
	title := fmt.Sprintf("AI热点｜%s 公开热点速览", time.Now().Format("01-02 15:04"))
	if _, err := w.repo.FindRecentPostByTitle(title, time.Now().Add(-2*w.cfg.HotspotInterval)); err == nil {
		log.Printf("hotspot post already exists: %s", title)
		return nil, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	content, err := w.generatePost(ctx, results)
	if err != nil {
		return nil, err
	}
	result := w.checker.CheckText(title + "\n" + content)
	status := model.StatusPendingReview
	if !result.Allowed {
		status = model.StatusRejected
	}
	post := &model.Post{
		AuthorID:   author.ID,
		Title:      title,
		Content:    content,
		PostType:   "text",
		Status:     status,
		Visibility: "public",
	}
	if err := w.repo.CreatePost(post); err != nil {
		return nil, err
	}
	resultJSON, _ := json.Marshal(map[string]interface{}{
		"moderation": result,
		"source":     "hotspot_worker",
		"queries":    w.cfg.HotspotQueries,
	})
	if err := w.repo.CreateModerationJob(&model.ModerationJob{TargetType: "post", TargetID: post.ID, Status: "queued", RiskLevel: result.Risk, ResultJSON: string(resultJSON)}); err != nil {
		return nil, err
	}
	log.Printf("hotspot draft post created: id=%d status=%s", post.ID, post.Status)
	return post, nil
}

func (w *Worker) ensureBotUser() (*model.User, error) {
	username := strings.TrimSpace(w.cfg.HotspotAuthorUsername)
	if username == "" {
		username = "ikun_hotspot_bot"
	}
	user, err := w.repo.FindUserByUsername(username)
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("hotspot-bot-login-disabled"), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user = &model.User{
		Username:     username,
		Email:        username + "@local.ikun",
		PasswordHash: string(hash),
		Bio:          "AI热点自动整理账号，发布内容需审核后公开。",
		Role:         model.RoleUser,
		Status:       "active",
	}
	if err := w.repo.CreateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (w *Worker) collectResults(ctx context.Context) ([]SearchResult, error) {
	limit := w.cfg.HotspotResultLimit
	if limit <= 0 {
		limit = 8
	}
	seen := map[string]bool{}
	merged := make([]SearchResult, 0, limit*len(w.cfg.HotspotQueries))
	var errorsSeen []string
	for _, search := range w.searches {
		for _, query := range w.cfg.HotspotQueries {
			results, err := search.Search(ctx, query, limit)
			// #region debug-point C:hotspot-search-result
			func() {
				body, _ := json.Marshal(map[string]interface{}{"sessionId": "auth-hotspot-bugs", "runId": "pre-fix", "hypothesisId": "C", "location": "backend/internal/hotspot/worker.go:collectResults", "msg": "[DEBUG] hotspot search result", "data": map[string]interface{}{"query": query, "resultCount": len(results), "error": fmt.Sprint(err)}, "ts": time.Now().UnixMilli()})
				_, _ = http.Post("http://127.0.0.1:7777/event", "application/json", bytes.NewReader(body))
			}()
			// #endregion
			if err != nil {
				log.Printf("hotspot query failed: query=%q err=%v", query, err)
				errorsSeen = append(errorsSeen, fmt.Sprintf("%s: %v", query, err))
				continue
			}
			for _, result := range results {
				key := result.URL
				if key == "" {
					key = result.Title
				}
				if key == "" || seen[key] {
					continue
				}
				seen[key] = true
				merged = append(merged, result)
			}
		}
	}
	if len(merged) == 0 && len(errorsSeen) > 0 {
		return nil, fmt.Errorf("websearch unavailable: %s", strings.Join(errorsSeen, " | "))
	}
	return merged, nil
}

func (w *Worker) generatePost(ctx context.Context, results []SearchResult) (string, error) {
	sourceText := formatSources(results, 10)
	summary := "根据公开搜索结果整理如下，请审核后发布。"
	messages := []ai.Message{
		{Role: "system", Content: "你是 ikun 社区的 AI热点编辑。你只能基于输入结果写 2 到 3 句中文摘要，不得编造事实，不得使用占位符年份日期，不得确认未证实传闻。"},
		{Role: "user", Content: "请根据以下公开搜索结果，提炼一个简短摘要，必须引用输入中真实存在的信息，不要泛泛而谈，不要使用“202X年X月X日”这类占位符。\n\n" + sourceText},
	}
	if reply, err := w.provider.Generate(ctx, messages); err == nil {
		cleaned := strings.TrimSpace(reply)
		if cleaned != "" && !strings.Contains(cleaned, "202X") {
			summary = cleaned
		}
	}

	lines := []string{
		"标签：AI热点",
		"",
		"摘要：",
		summary,
		"",
		"公开来源结果：",
		sourceText,
		"",
		"审核注意事项：",
		"1. 请核对链接内容是否仍然可访问，避免失效来源。",
		"2. 请删除含传闻、猜测或引战表述的条目，仅保留公开可核验信息。",
		"3. 如需首页展示，请补充更准确的标题和导语。",
		"",
		"标识：AI生成/角色演绎",
	}
	return strings.Join(lines, "\n"), nil
}

func formatSources(results []SearchResult, limit int) string {
	if limit <= 0 || limit > len(results) {
		limit = len(results)
	}
	lines := make([]string, 0, limit)
	for i := 0; i < limit; i++ {
		result := results[i]
		lines = append(lines, fmt.Sprintf("%d. 标题：%s\n   链接：%s\n   摘要：%s\n   来源：%s", i+1, result.Title, result.URL, result.Snippet, result.Source))
	}
	return strings.Join(lines, "\n")
}
