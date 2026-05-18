package moderation

import "strings"

type Result struct {
	Allowed  bool     `json:"allowed"`
	Risk     string   `json:"risk"`
	Matches  []string `json:"matches"`
	Decision string   `json:"decision"`
}
type Checker struct{ blockedWords []string }

func NewChecker() *Checker {
	return &Checker{blockedWords: []string{"身份证", "手机号", "私人住址", "伪造声明", "伪聊天记录", "偷拍视频", "深度伪造", "开盒"}}
}
func (c *Checker) CheckText(text string) Result {
	lower := strings.ToLower(text)
	matches := []string{}
	for _, word := range c.blockedWords {
		if strings.Contains(lower, strings.ToLower(word)) {
			matches = append(matches, word)
		}
	}
	if len(matches) > 0 {
		return Result{Allowed: false, Risk: "high", Matches: matches, Decision: "rejected"}
	}
	return Result{Allowed: true, Risk: "low", Decision: "queued"}
}
func IsAIUnsafe(text string) bool {
	bad := []string{"冒充", "本人声明", "官方授权", "伪聊天记录", "伪证据", "私人住址", "手机号", "身份证", "开盒"}
	lower := strings.ToLower(text)
	for _, word := range bad {
		if strings.Contains(lower, strings.ToLower(word)) {
			return true
		}
	}
	return false
}
