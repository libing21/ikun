package model

import "time"

const (
	RoleUser            = "user"
	RoleModerator       = "moderator"
	RoleAdmin           = "admin"
	StatusPendingReview = "pending_review"
	StatusApproved      = "approved"
	StatusRejected      = "rejected"
	StatusPublished     = "published"
	StatusOffline       = "offline"
)

type User struct {
	ID           uint64    `json:"id" gorm:"primaryKey"`
	Username     string    `json:"username" gorm:"size:32;uniqueIndex;not null"`
	Email        string    `json:"email" gorm:"size:128;uniqueIndex"`
	PasswordHash string    `json:"-" gorm:"size:255;not null"`
	AvatarURL    string    `json:"avatar_url"`
	Bio          string    `json:"bio" gorm:"size:255"`
	Role         string    `json:"role" gorm:"size:20;not null;default:user"`
	Status       string    `json:"status" gorm:"size:20;not null;default:active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
type Post struct {
	ID            uint64       `json:"id" gorm:"primaryKey"`
	AuthorID      uint64       `json:"author_id" gorm:"not null;index"`
	Author        *User        `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Title         string       `json:"title" gorm:"size:120;not null"`
	Content       string       `json:"content"`
	PostType      string       `json:"post_type" gorm:"size:20;not null;default:text"`
	Status        string       `json:"status" gorm:"size:20;not null;default:pending_review;index"`
	Visibility    string       `json:"visibility" gorm:"size:20;not null;default:public"`
	LikeCount     int          `json:"like_count" gorm:"not null;default:0"`
	FavoriteCount int          `json:"favorite_count" gorm:"not null;default:0"`
	CommentCount  int          `json:"comment_count" gorm:"not null;default:0"`
	ViewCount     int          `json:"view_count" gorm:"not null;default:0"`
	Media         []MediaAsset `json:"media,omitempty"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	PublishedAt   *time.Time   `json:"published_at"`
}
type MediaAsset struct {
	ID          uint64    `json:"id" gorm:"primaryKey"`
	OwnerID     uint64    `json:"owner_id" gorm:"not null;index"`
	PostID      *uint64   `json:"post_id" gorm:"index"`
	MediaType   string    `json:"media_type" gorm:"size:20;not null"`
	ObjectKey   string    `json:"object_key" gorm:"not null"`
	URL         string    `json:"url" gorm:"not null"`
	MimeType    string    `json:"mime_type" gorm:"size:120"`
	FileSize    int64     `json:"file_size" gorm:"not null"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	DurationSec int       `json:"duration_sec"`
	SHA256      string    `json:"sha256" gorm:"size:64"`
	Status      string    `json:"status" gorm:"size:20;not null;default:pending_review"`
	CreatedAt   time.Time `json:"created_at"`
}
type Comment struct {
	ID        uint64    `json:"id" gorm:"primaryKey"`
	PostID    uint64    `json:"post_id" gorm:"not null;index"`
	AuthorID  uint64    `json:"author_id" gorm:"not null;index"`
	Author    *User     `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	ParentID  *uint64   `json:"parent_id" gorm:"index"`
	Content   string    `json:"content" gorm:"not null"`
	Status    string    `json:"status" gorm:"size:20;not null;default:pending_review"`
	LikeCount int       `json:"like_count" gorm:"not null;default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
type PostLike struct {
	UserID    uint64    `json:"user_id" gorm:"primaryKey"`
	PostID    uint64    `json:"post_id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
}
type Favorite struct {
	UserID    uint64    `json:"user_id" gorm:"primaryKey"`
	PostID    uint64    `json:"post_id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
}
type Report struct {
	ID             uint64     `json:"id" gorm:"primaryKey"`
	ReporterID     uint64     `json:"reporter_id" gorm:"not null;index"`
	TargetType     string     `json:"target_type" gorm:"size:20;not null;index"`
	TargetID       uint64     `json:"target_id" gorm:"not null;index"`
	ReasonCode     string     `json:"reason_code" gorm:"size:32;not null"`
	ReasonText     string     `json:"reason_text"`
	Status         string     `json:"status" gorm:"size:20;not null;default:open;index"`
	ResolutionNote string     `json:"resolution_note"`
	ReviewedBy     *uint64    `json:"reviewed_by"`
	ReviewedAt     *time.Time `json:"reviewed_at"`
	CreatedAt      time.Time  `json:"created_at"`
}
type ModerationJob struct {
	ID         uint64    `json:"id" gorm:"primaryKey"`
	TargetType string    `json:"target_type" gorm:"size:20;not null;index"`
	TargetID   uint64    `json:"target_id" gorm:"not null;index"`
	Status     string    `json:"status" gorm:"size:20;not null;default:queued;index"`
	RiskLevel  string    `json:"risk_level" gorm:"size:20;not null;default:unknown"`
	ResultJSON string    `json:"result_json" gorm:"type:jsonb;default:'{}'"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
type AIConversation struct {
	ID          uint64    `json:"id" gorm:"primaryKey"`
	UserID      uint64    `json:"user_id" gorm:"not null;index"`
	Title       string    `json:"title" gorm:"size:120"`
	PersonaCode string    `json:"persona_code" gorm:"size:32;not null;default:jizong_master"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
type AIMessage struct {
	ID             uint64    `json:"id" gorm:"primaryKey"`
	ConversationID uint64    `json:"conversation_id" gorm:"not null;index"`
	Role           string    `json:"role" gorm:"size:20;not null"`
	Content        string    `json:"content" gorm:"not null"`
	SafetyLabel    string    `json:"safety_label" gorm:"size:32;not null;default:normal"`
	CreatedAt      time.Time `json:"created_at"`
}
