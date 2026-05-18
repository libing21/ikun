package repository

import (
	"kunzong/backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type Repository struct{ DB *gorm.DB }

func New(db *gorm.DB) *Repository                    { return &Repository{DB: db} }
func (r *Repository) CreateUser(u *model.User) error { return r.DB.Create(u).Error }
func (r *Repository) FindUserByEmail(email string) (*model.User, error) {
	var u model.User
	err := r.DB.Where("email = ?", email).First(&u).Error
	return &u, err
}
func (r *Repository) FindUserByUsername(username string) (*model.User, error) {
	var u model.User
	err := r.DB.Where("username = ?", username).First(&u).Error
	return &u, err
}
func (r *Repository) FindUserByID(id uint64) (*model.User, error) {
	var u model.User
	err := r.DB.First(&u, id).Error
	return &u, err
}
func (r *Repository) ListPublishedPosts(limit, offset int) ([]model.Post, error) {
	var posts []model.Post
	err := r.DB.Preload("Author").Preload("Media").Where("status = ?", model.StatusPublished).Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, err
}
func (r *Repository) ListMyPosts(userID uint64) ([]model.Post, error) {
	var posts []model.Post
	err := r.DB.Where("author_id = ?", userID).Order("created_at DESC").Find(&posts).Error
	return posts, err
}
func (r *Repository) CreatePost(p *model.Post) error { return r.DB.Create(p).Error }
func (r *Repository) FindRecentPostByTitle(title string, since time.Time) (*model.Post, error) {
	var p model.Post
	err := r.DB.Where("title = ? AND created_at >= ?", title, since).First(&p).Error
	return &p, err
}
func (r *Repository) FindPost(id uint64) (*model.Post, error) {
	var p model.Post
	err := r.DB.Preload("Author").Preload("Media").First(&p, id).Error
	return &p, err
}
func (r *Repository) UpdatePost(p *model.Post) error { return r.DB.Save(p).Error }
func (r *Repository) DeletePost(id, userID uint64) error {
	return r.DB.Where("id = ? AND author_id = ?", id, userID).Delete(&model.Post{}).Error
}
func (r *Repository) AttachMedia(ids []uint64, postID, ownerID uint64) error {
	return r.DB.Model(&model.MediaAsset{}).Where("id IN ? AND owner_id = ?", ids, ownerID).Update("post_id", postID).Error
}
func (r *Repository) CreateMedia(m *model.MediaAsset) error { return r.DB.Create(m).Error }
func (r *Repository) FindMedia(id uint64) (*model.MediaAsset, error) {
	var m model.MediaAsset
	err := r.DB.First(&m, id).Error
	return &m, err
}
func (r *Repository) ListComments(postID uint64, limit, offset int) ([]model.Comment, error) {
	var cs []model.Comment
	err := r.DB.Preload("Author").Where("post_id = ? AND status = ?", postID, model.StatusApproved).Order("created_at ASC").Limit(limit).Offset(offset).Find(&cs).Error
	return cs, err
}
func (r *Repository) CreateComment(c *model.Comment) error { return r.DB.Create(c).Error }
func (r *Repository) FindComment(id uint64) (*model.Comment, error) {
	var c model.Comment
	err := r.DB.First(&c, id).Error
	return &c, err
}
func (r *Repository) UpdateComment(c *model.Comment) error { return r.DB.Save(c).Error }
func (r *Repository) DeleteComment(id, userID uint64) error {
	return r.DB.Where("id = ? AND author_id = ?", id, userID).Delete(&model.Comment{}).Error
}
func (r *Repository) LikePost(userID, postID uint64) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		res := tx.FirstOrCreate(&model.PostLike{UserID: userID, PostID: postID})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			return tx.Model(&model.Post{}).Where("id = ?", postID).UpdateColumn("like_count", gorm.Expr("like_count + 1")).Error
		}
		return nil
	})
}
func (r *Repository) UnlikePost(userID, postID uint64) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		res := tx.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&model.PostLike{})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			return tx.Model(&model.Post{}).Where("id = ? AND like_count > 0", postID).UpdateColumn("like_count", gorm.Expr("like_count - 1")).Error
		}
		return nil
	})
}
func (r *Repository) FavoritePost(userID, postID uint64) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		res := tx.FirstOrCreate(&model.Favorite{UserID: userID, PostID: postID})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			return tx.Model(&model.Post{}).Where("id = ?", postID).UpdateColumn("favorite_count", gorm.Expr("favorite_count + 1")).Error
		}
		return nil
	})
}
func (r *Repository) UnfavoritePost(userID, postID uint64) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		res := tx.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&model.Favorite{})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			return tx.Model(&model.Post{}).Where("id = ? AND favorite_count > 0", postID).UpdateColumn("favorite_count", gorm.Expr("favorite_count - 1")).Error
		}
		return nil
	})
}
func (r *Repository) ListFavorites(userID uint64) ([]model.Post, error) {
	var posts []model.Post
	err := r.DB.Joins("JOIN favorites ON favorites.post_id = posts.id").Where("favorites.user_id = ?", userID).Order("favorites.created_at DESC").Find(&posts).Error
	return posts, err
}
func (r *Repository) CreateReport(rep *model.Report) error { return r.DB.Create(rep).Error }
func (r *Repository) ListReports(status string) ([]model.Report, error) {
	var reps []model.Report
	q := r.DB.Order("created_at DESC")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	err := q.Find(&reps).Error
	return reps, err
}
func (r *Repository) ListMyReports(userID uint64) ([]model.Report, error) {
	var reps []model.Report
	err := r.DB.Where("reporter_id = ?", userID).Order("created_at DESC").Find(&reps).Error
	return reps, err
}
func (r *Repository) ResolveReport(id, reviewerID uint64, status, note string) error {
	now := time.Now()
	return r.DB.Model(&model.Report{}).Where("id = ?", id).Updates(map[string]interface{}{"status": status, "resolution_note": note, "reviewed_by": reviewerID, "reviewed_at": now}).Error
}
func (r *Repository) CreateModerationJob(j *model.ModerationJob) error { return r.DB.Create(j).Error }
func (r *Repository) ListModerationJobs(status string) ([]model.ModerationJob, error) {
	var jobs []model.ModerationJob
	q := r.DB.Order("created_at DESC")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	err := q.Find(&jobs).Error
	return jobs, err
}
func (r *Repository) ReviewModerationJob(jobID uint64, decision string) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		var job model.ModerationJob
		if err := tx.First(&job, jobID).Error; err != nil {
			return err
		}
		if err := tx.Model(&job).Updates(map[string]interface{}{"status": "reviewed", "risk_level": decision}).Error; err != nil {
			return err
		}
		now := time.Now()
		switch job.TargetType {
		case "post":
			updates := map[string]interface{}{"status": model.StatusRejected}
			if decision == "approved" {
				updates["status"] = model.StatusPublished
				updates["published_at"] = now
			}
			return tx.Model(&model.Post{}).Where("id = ?", job.TargetID).Updates(updates).Error
		case "comment":
			final := model.StatusRejected
			if decision == "approved" {
				final = model.StatusApproved
			}
			return tx.Model(&model.Comment{}).Where("id = ?", job.TargetID).Update("status", final).Error
		case "media":
			final := model.StatusRejected
			if decision == "approved" {
				final = model.StatusApproved
			}
			return tx.Model(&model.MediaAsset{}).Where("id = ?", job.TargetID).Update("status", final).Error
		}
		return nil
	})
}
func (r *Repository) CreateConversation(c *model.AIConversation) error { return r.DB.Create(c).Error }
func (r *Repository) ListConversations(userID uint64) ([]model.AIConversation, error) {
	var cs []model.AIConversation
	err := r.DB.Where("user_id = ?", userID).Order("updated_at DESC").Find(&cs).Error
	return cs, err
}
func (r *Repository) FindConversation(id, userID uint64) (*model.AIConversation, error) {
	var c model.AIConversation
	err := r.DB.Where("id = ? AND user_id = ?", id, userID).First(&c).Error
	return &c, err
}
func (r *Repository) CreateAIMessage(m *model.AIMessage) error { return r.DB.Create(m).Error }
func (r *Repository) ListAIMessages(conversationID uint64) ([]model.AIMessage, error) {
	var ms []model.AIMessage
	err := r.DB.Where("conversation_id = ?", conversationID).Order("created_at ASC").Find(&ms).Error
	return ms, err
}
