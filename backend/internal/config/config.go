package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv                      string
	HTTPAddr                    string
	DBDriver                    string
	DatabaseDSN                 string
	JWTSecret                   string
	JWTTTL                      time.Duration
	CORSOrigins                 []string
	ArkAPIKey                   string
	ArkBaseURL                  string
	ArkModel                    string
	HotspotEnabled              bool
	HotspotRunOnStart           bool
	HotspotInterval             time.Duration
	HotspotQueries              []string
	HotspotResultLimit          int
	HotspotAuthorUsername       string
	WebSearchDefaultEndpoint    string
	WebSearchEndpoints          []string
	WebSearchAPIKey             string
	WebSearchInsecureSkipVerify bool
}

func Load() Config {
	ttlHours, _ := strconv.Atoi(env("JWT_TTL_HOURS", "24"))
	origins := strings.Split(env("CORS_ORIGINS", "http://localhost:3000"), ",")
	hotspotInterval, _ := time.ParseDuration(env("HOTSPOT_INTERVAL", "24h"))
	hotspotLimit, _ := strconv.Atoi(env("HOTSPOT_RESULT_LIMIT", "8"))
	defaultEndpoint := env("WEBSEARCH_DEFAULT_ENDPOINT", "https://open.feedcoopapi.com/search_api/web_search")
	return Config{AppEnv: env("APP_ENV", "local"), HTTPAddr: httpAddr(), DBDriver: env("DB_DRIVER", "postgres"), DatabaseDSN: env("DATABASE_DSN", "host=localhost user=kunzong password=kunzong dbname=kunzong port=5432 sslmode=disable TimeZone=Asia/Shanghai"), JWTSecret: env("JWT_SECRET", "change-me"), JWTTTL: time.Duration(ttlHours) * time.Hour, CORSOrigins: origins, ArkAPIKey: os.Getenv("ARK_API_KEY"), ArkBaseURL: env("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3"), ArkModel: env("ARK_MODEL", "doubao-seed-2-0-lite-260215"), HotspotEnabled: envBool("HOTSPOT_ENABLED", false), HotspotRunOnStart: envBool("HOTSPOT_RUN_ON_START", true), HotspotInterval: hotspotInterval, HotspotQueries: envList("HOTSPOT_QUERIES", "蔡徐坤,蔡徐坤 热点,蔡徐坤 舞台,蔡徐坤 ikun"), HotspotResultLimit: hotspotLimit, HotspotAuthorUsername: env("HOTSPOT_AUTHOR_USERNAME", "ikun_hotspot_bot"), WebSearchDefaultEndpoint: defaultEndpoint, WebSearchEndpoints: envList("WEBSEARCH_ENDPOINTS", defaultEndpoint), WebSearchAPIKey: os.Getenv("WEBSEARCH_API_KEY"), WebSearchInsecureSkipVerify: envBool("WEBSEARCH_INSECURE_SKIP_VERIFY", false)}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "1" || value == "true" || value == "yes" || value == "on"
}

func envList(key, fallback string) []string {
	raw := env(key, fallback)
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		if value := strings.TrimSpace(part); value != "" {
			values = append(values, value)
		}
	}
	return values
}

func httpAddr() string {
	if value := strings.TrimSpace(os.Getenv("HTTP_ADDR")); value != "" {
		return value
	}
	if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
		return ":" + port
	}
	return ":8080"
}
