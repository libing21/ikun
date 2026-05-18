package hotspot

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type SearchResult struct {
	Title   string `json:"title"`
	URL     string `json:"url"`
	Snippet string `json:"snippet"`
	Source  string `json:"source"`
}

type SearchClient struct {
	endpoint string
	apiKey   string
	client   *http.Client
}

func NewSearchClient(endpoint, apiKey string, insecureSkipVerify bool) *SearchClient {
	return &SearchClient{
		endpoint: endpoint,
		apiKey:   apiKey,
		client: &http.Client{
			Timeout: 20 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: insecureSkipVerify},
			},
		},
	}
}

func (c *SearchClient) Search(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	if c.endpoint == "" {
		return nil, fmt.Errorf("websearch endpoint is empty")
	}
	payload := map[string]interface{}{"query": query, "q": query, "limit": limit, "search_type": "web", "searchType": "web", "type": "web"}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
		req.Header.Set("X-API-Key", c.apiKey)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusMethodNotAllowed || resp.StatusCode == http.StatusUnsupportedMediaType {
		return c.searchGET(ctx, query, limit)
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("websearch status %d: %s", resp.StatusCode, string(data))
	}
	if apiErr := parseAPIError(data); apiErr != "" {
		return nil, fmt.Errorf("websearch api error: %s", apiErr)
	}
	return parseResults(data, limit), nil
}

func (c *SearchClient) searchGET(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	u, err := url.Parse(c.endpoint)
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("query", query)
	q.Set("q", query)
	q.Set("limit", fmt.Sprintf("%d", limit))
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
		req.Header.Set("X-API-Key", c.apiKey)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("websearch status %d: %s", resp.StatusCode, string(data))
	}
	if apiErr := parseAPIError(data); apiErr != "" {
		return nil, fmt.Errorf("websearch api error: %s", apiErr)
	}
	return parseResults(data, limit), nil
}

func parseResults(data []byte, limit int) []SearchResult {
	var raw interface{}
	if json.Unmarshal(data, &raw) != nil {
		return nil
	}
	items := findResultItems(raw)
	results := make([]SearchResult, 0, len(items))
	seen := map[string]bool{}
	for _, item := range items {
		result := mapToResult(item)
		if result.Title == "" && result.URL == "" {
			continue
		}
		key := result.URL
		if key == "" {
			key = result.Title
		}
		if seen[key] {
			continue
		}
		seen[key] = true
		results = append(results, result)
		if limit > 0 && len(results) >= limit {
			break
		}
	}
	return results
}

func parseAPIError(data []byte) string {
	var raw map[string]interface{}
	if json.Unmarshal(data, &raw) != nil {
		return ""
	}
	meta, _ := raw["ResponseMetadata"].(map[string]interface{})
	errMap, _ := meta["Error"].(map[string]interface{})
	code, _ := errMap["Code"].(string)
	message, _ := errMap["Message"].(string)
	if code == "" && message == "" {
		return ""
	}
	if message == "" {
		return code
	}
	if code == "" {
		return message
	}
	return code + ": " + message
}

func findResultItems(value interface{}) []map[string]interface{} {
	switch typed := value.(type) {
	case []interface{}:
		return toMapSlice(typed)
	case map[string]interface{}:
		for _, key := range []string{"results", "data", "items", "documents", "web_pages"} {
			if nested, ok := typed[key]; ok {
				if list := findResultItems(nested); len(list) > 0 {
					return list
				}
			}
		}
		if nested, ok := typed["value"]; ok {
			if list := findResultItems(nested); len(list) > 0 {
				return list
			}
		}
		return []map[string]interface{}{typed}
	default:
		return nil
	}
}

func toMapSlice(values []interface{}) []map[string]interface{} {
	items := make([]map[string]interface{}, 0, len(values))
	for _, value := range values {
		if item, ok := value.(map[string]interface{}); ok {
			items = append(items, item)
		}
	}
	return items
}

func mapToResult(item map[string]interface{}) SearchResult {
	title := firstString(item, "title", "name", "headline")
	link := firstString(item, "url", "link", "href")
	snippet := firstString(item, "snippet", "summary", "description", "content")
	source := firstString(item, "source", "site", "site_name", "display_url")
	return SearchResult{Title: strings.TrimSpace(title), URL: strings.TrimSpace(link), Snippet: strings.TrimSpace(snippet), Source: strings.TrimSpace(source)}
}

func firstString(item map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if value, ok := item[key]; ok {
			if text, ok := value.(string); ok {
				return text
			}
		}
	}
	return ""
}
