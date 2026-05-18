package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Provider interface {
	Generate(ctx context.Context, messages []Message) (string, error)
}
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
type ArkProvider struct {
	apiKey, baseURL, model string
	client                 *http.Client
}

func NewArkProvider(apiKey, baseURL, model string) *ArkProvider {
	return &ArkProvider{apiKey: apiKey, baseURL: strings.TrimRight(baseURL, "/"), model: model, client: &http.Client{Timeout: 45 * time.Second}}
}
func (p *ArkProvider) Generate(ctx context.Context, messages []Message) (string, error) {
	if p.apiKey == "" {
		return fallbackReply(messages), nil
	}
	payload := map[string]interface{}{"model": p.model, "input": messages, "store": false}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/responses", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := p.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("ark response status %d: %s", resp.StatusCode, string(data))
	}
	text := extractText(data)
	if text == "" {
		return "", errors.New("empty ark response")
	}
	return text, nil
}
func extractText(data []byte) string {
	var raw map[string]interface{}
	if json.Unmarshal(data, &raw) != nil {
		return ""
	}
	if text, ok := raw["output_text"].(string); ok {
		return text
	}
	if output, ok := raw["output"].([]interface{}); ok {
		parts := []string{}
		for _, item := range output {
			m, _ := item.(map[string]interface{})
			content, _ := m["content"].([]interface{})
			for _, c := range content {
				cm, _ := c.(map[string]interface{})
				if s, ok := cm["text"].(string); ok {
					parts = append(parts, s)
				}
			}
		}
		return strings.TrimSpace(strings.Join(parts, "\n"))
	}
	return ""
}
func fallbackReply(messages []Message) string {
	last := ""
	if len(messages) > 0 {
		last = messages[len(messages)-1].Content
	}
	return "热点雷达收到：" + last + "。这里先用本地演绎生成待审核草稿，配置 ARK_API_KEY 后将接入方舟模型。\n\n标识：AI生成/角色演绎"
}
