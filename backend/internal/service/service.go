package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"kunzong/backend/internal/ai"
	"kunzong/backend/internal/auth"
	"kunzong/backend/internal/hotspot"
	"kunzong/backend/internal/model"
	"kunzong/backend/internal/moderation"
	"kunzong/backend/internal/repository"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Services struct {
	Auth       *AuthService
	Posts      *PostService
	Comments   *CommentService
	Reports    *ReportService
	Moderation *ModerationService
	AI         *AIService
	Hotspot    *HotspotService
	Repo       *repository.Repository
}

func New(repo *repository.Repository, jwt *auth.JWTManager, checker *moderation.Checker, provider ai.Provider, hotspotWorker *hotspot.Worker) *Services {
	return &Services{Auth: &AuthService{repo: repo, jwt: jwt}, Posts: &PostService{repo: repo, checker: checker}, Comments: &CommentService{repo: repo, checker: checker}, Reports: &ReportService{repo: repo}, Moderation: &ModerationService{repo: repo}, AI: &AIService{repo: repo, provider: provider}, Hotspot: &HotspotService{worker: hotspotWorker}, Repo: repo}
}

type AuthService struct {
	repo *repository.Repository
	jwt  *auth.JWTManager
}
type AuthResult struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

func (s *AuthService) Register(username, email, password string) (*AuthResult, error) {
	if username == "" || email == "" || len(password) < 8 {
		return nil, errors.New("username, email and password>=8 required")
	}
	if _, err := s.repo.FindUserByEmail(email); !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("email already exists")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &model.User{Username: username, Email: email, PasswordHash: string(hash), Role: model.RoleUser, Status: "active"}
	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}
	token, err := s.jwt.Generate(user.ID, user.Role)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user}, nil
}
func (s *AuthService) Login(email, password string) (*AuthResult, error) {
	user, err := s.repo.FindUserByEmail(email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return nil, errors.New("invalid credentials")
	}
	if user.Status != "active" {
		return nil, errors.New("user is not active")
	}
	token, err := s.jwt.Generate(user.ID, user.Role)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user}, nil
}
func (s *AuthService) Me(userID uint64) (*model.User, error) { return s.repo.FindUserByID(userID) }

type PostService struct {
	repo    *repository.Repository
	checker *moderation.Checker
}
type CreatePostInput struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	PostType string   `json:"post_type"`
	MediaIDs []uint64 `json:"media_ids"`
}

func (s *PostService) List(limit, offset int) ([]model.Post, error) {
	return s.repo.ListPublishedPosts(limit, offset)
}
func (s *PostService) Mine(userID uint64) ([]model.Post, error) { return s.repo.ListMyPosts(userID) }
func (s *PostService) Favorites(userID uint64) ([]model.Post, error) {
	return s.repo.ListFavorites(userID)
}
func (s *PostService) Get(id uint64) (*model.Post, error) { return s.repo.FindPost(id) }
func (s *PostService) Create(userID uint64, in CreatePostInput) (*model.Post, error) {
	if in.Title == "" {
		return nil, errors.New("title required")
	}
	if in.PostType == "" {
		in.PostType = "text"
	}
	result := s.checker.CheckText(in.Title + "\n" + in.Content)
	status := model.StatusPendingReview
	if !result.Allowed {
		status = model.StatusRejected
	}
	post := &model.Post{AuthorID: userID, Title: in.Title, Content: in.Content, PostType: in.PostType, Status: status, Visibility: "public"}
	if err := s.repo.CreatePost(post); err != nil {
		return nil, err
	}
	if len(in.MediaIDs) > 0 {
		_ = s.repo.AttachMedia(in.MediaIDs, post.ID, userID)
	}
	b, _ := json.Marshal(result)
	_ = s.repo.CreateModerationJob(&model.ModerationJob{TargetType: "post", TargetID: post.ID, Status: "queued", RiskLevel: result.Risk, ResultJSON: string(b)})
	return post, nil
}
func (s *PostService) Update(userID, id uint64, in CreatePostInput) (*model.Post, error) {
	post, err := s.repo.FindPost(id)
	if err != nil {
		return nil, err
	}
	if post.AuthorID != userID {
		return nil, errors.New("permission denied")
	}
	if in.Title != "" {
		post.Title = in.Title
	}
	post.Content = in.Content
	post.Status = model.StatusPendingReview
	return post, s.repo.UpdatePost(post)
}
func (s *PostService) Delete(userID, id uint64) error     { return s.repo.DeletePost(id, userID) }
func (s *PostService) Like(userID, postID uint64) error   { return s.repo.LikePost(userID, postID) }
func (s *PostService) Unlike(userID, postID uint64) error { return s.repo.UnlikePost(userID, postID) }
func (s *PostService) Favorite(userID, postID uint64) error {
	return s.repo.FavoritePost(userID, postID)
}
func (s *PostService) Unfavorite(userID, postID uint64) error {
	return s.repo.UnfavoritePost(userID, postID)
}
func (s *PostService) CreateMedia(userID uint64, mediaType, url, mime string, size int64) (*model.MediaAsset, error) {
	if mediaType != "image" && mediaType != "video" {
		return nil, errors.New("unsupported media type")
	}
	m := &model.MediaAsset{OwnerID: userID, MediaType: mediaType, ObjectKey: url, URL: url, MimeType: mime, FileSize: size, Status: model.StatusPendingReview}
	return m, s.repo.CreateMedia(m)
}

type CommentService struct {
	repo    *repository.Repository
	checker *moderation.Checker
}
type CreateCommentInput struct {
	Content  string  `json:"content"`
	ParentID *uint64 `json:"parent_id"`
}

func (s *CommentService) List(postID uint64, limit, offset int) ([]model.Comment, error) {
	return s.repo.ListComments(postID, limit, offset)
}
func (s *CommentService) Create(userID, postID uint64, in CreateCommentInput) (*model.Comment, error) {
	if strings.TrimSpace(in.Content) == "" {
		return nil, errors.New("content required")
	}
	result := s.checker.CheckText(in.Content)
	status := model.StatusPendingReview
	if !result.Allowed {
		status = model.StatusRejected
	}
	c := &model.Comment{AuthorID: userID, PostID: postID, ParentID: in.ParentID, Content: in.Content, Status: status}
	if err := s.repo.CreateComment(c); err != nil {
		return nil, err
	}
	b, _ := json.Marshal(result)
	_ = s.repo.CreateModerationJob(&model.ModerationJob{TargetType: "comment", TargetID: c.ID, Status: "queued", RiskLevel: result.Risk, ResultJSON: string(b)})
	return c, nil
}
func (s *CommentService) Update(userID, id uint64, content string) (*model.Comment, error) {
	c, err := s.repo.FindComment(id)
	if err != nil {
		return nil, err
	}
	if c.AuthorID != userID {
		return nil, errors.New("permission denied")
	}
	c.Content = content
	c.Status = model.StatusPendingReview
	return c, s.repo.UpdateComment(c)
}
func (s *CommentService) Delete(userID, id uint64) error { return s.repo.DeleteComment(id, userID) }

type ReportService struct{ repo *repository.Repository }
type CreateReportInput struct {
	TargetType string `json:"target_type"`
	TargetID   uint64 `json:"target_id"`
	ReasonCode string `json:"reason_code"`
	ReasonText string `json:"reason_text"`
}

func (s *ReportService) Create(userID uint64, in CreateReportInput) (*model.Report, error) {
	if in.TargetType != "post" && in.TargetType != "comment" {
		return nil, errors.New("invalid target_type")
	}
	r := &model.Report{ReporterID: userID, TargetType: in.TargetType, TargetID: in.TargetID, ReasonCode: in.ReasonCode, ReasonText: in.ReasonText, Status: "open"}
	return r, s.repo.CreateReport(r)
}
func (s *ReportService) Mine(userID uint64) ([]model.Report, error) {
	return s.repo.ListMyReports(userID)
}
func (s *ReportService) AdminList(status string) ([]model.Report, error) {
	return s.repo.ListReports(status)
}
func (s *ReportService) Resolve(id, reviewerID uint64, status, note string) error {
	return s.repo.ResolveReport(id, reviewerID, status, note)
}

type ModerationService struct{ repo *repository.Repository }

func (s *ModerationService) List(status string) ([]model.ModerationJob, error) {
	return s.repo.ListModerationJobs(status)
}
func (s *ModerationService) Review(jobID uint64, decision string) error {
	if decision != "approved" && decision != "rejected" {
		return errors.New("decision must be approved or rejected")
	}
	return s.repo.ReviewModerationJob(jobID, decision)
}

type AIService struct {
	repo     *repository.Repository
	provider ai.Provider
}

type HotspotService struct {
	worker *hotspot.Worker
}

func (s *HotspotService) GenerateDraft(ctx context.Context) (*model.Post, error) {
	if s.worker == nil {
		return nil, errors.New("hotspot worker not configured")
	}
	return s.worker.RunOnce(ctx)
}

func (s *AIService) CreateConversation(userID uint64) (*model.AIConversation, error) {
	c := &model.AIConversation{UserID: userID, Title: "每日热点草稿", PersonaCode: "ikun_hotspot_radar"}
	return c, s.repo.CreateConversation(c)
}
func (s *AIService) ListConversations(userID uint64) ([]model.AIConversation, error) {
	return s.repo.ListConversations(userID)
}
func (s *AIService) Messages(userID, conversationID uint64) ([]model.AIMessage, error) {
	if _, err := s.repo.FindConversation(conversationID, userID); err != nil {
		return nil, err
	}
	return s.repo.ListAIMessages(conversationID)
}
func (s *AIService) Send(ctx context.Context, userID, conversationID uint64, content string) (map[string]string, error) {
	if moderation.IsAIUnsafe(content) {
		return nil, errors.New("AI_REQUEST_BLOCKED")
	}
	if _, err := s.repo.FindConversation(conversationID, userID); err != nil {
		return nil, err
	}
	_ = s.repo.CreateAIMessage(&model.AIMessage{ConversationID: conversationID, Role: "user", Content: content, SafetyLabel: "normal"})
	messages, _ := s.repo.ListAIMessages(conversationID)
	prompt := []ai.Message{{Role: "system", Content: systemPrompt()}}
	for _, m := range messages {
		prompt = append(prompt, ai.Message{Role: m.Role, Content: m.Content})
	}
	reply, err := s.provider.Generate(ctx, prompt)
	if err != nil {
		return nil, err
	}
	if !strings.Contains(reply, "AI生成/角色演绎") {
		reply = fmt.Sprintf("%s\n\n标识：AI生成/角色演绎", reply)
	}
	_ = s.repo.CreateAIMessage(&model.AIMessage{ConversationID: conversationID, Role: "assistant", Content: reply, SafetyLabel: "AI生成/角色演绎"})
	return map[string]string{"reply": reply, "label": "AI生成/角色演绎"}, nil
}
func systemPrompt() string {
	return "你是 ikun 社区的公开热点整理助手。你的任务是把用户提供或公开来源中可核验的信息整理成待审核帖子草稿，默认加上 AI热点 标签建议。你不能编造爆料、不能确认未证实传闻、不能输出隐私信息、不能生成冒充本人或机构的声明、伪聊天记录、伪证据。涉及蔡徐坤等公众人物时，只能基于公开可核验信息做中性总结，避免造谣、攻击和引战。输出应包含标题、摘要、来源提示、审核注意事项，并标注 AI生成/角色演绎。"
}
