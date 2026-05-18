package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"kunzong/backend/internal/middleware"
	"kunzong/backend/internal/response"
	"kunzong/backend/internal/service"
)

type Handler struct{ svc *service.Services }

func New(svc *service.Services) *Handler { return &Handler{svc: svc} }

func (h *Handler) Register(c *gin.Context) {
	var req struct{ Username, Email, Password string }
	if bind(c, &req) {
		return
	}
	out, err := h.svc.Auth.Register(req.Username, req.Email, req.Password)
	render(c, out, err)
}
func (h *Handler) Login(c *gin.Context) {
	var req struct{ Email, Password string }
	if bind(c, &req) {
		return
	}
	out, err := h.svc.Auth.Login(req.Email, req.Password)
	render(c, out, err)
}
func (h *Handler) Refresh(c *gin.Context) {
	response.Success(c, gin.H{"message": "refresh token flow can be extended with persisted refresh tokens"})
}
func (h *Handler) Logout(c *gin.Context) { response.Success(c, gin.H{"message": "ok"}) }
func (h *Handler) Me(c *gin.Context) {
	user, err := h.svc.Auth.Me(middleware.CurrentUserID(c))
	render(c, user, err)
}
func (h *Handler) UserByID(c *gin.Context) {
	id := idParam(c, "id")
	user, err := h.svc.Repo.FindUserByID(id)
	render(c, user, err)
}

func (h *Handler) ListPosts(c *gin.Context) {
	limit, offset := page(c)
	posts, err := h.svc.Posts.List(limit, offset)
	render(c, posts, err)
}
func (h *Handler) MyPosts(c *gin.Context) {
	posts, err := h.svc.Posts.Mine(middleware.CurrentUserID(c))
	render(c, posts, err)
}
func (h *Handler) MyFavorites(c *gin.Context) {
	posts, err := h.svc.Posts.Favorites(middleware.CurrentUserID(c))
	render(c, posts, err)
}
func (h *Handler) GetPost(c *gin.Context) {
	post, err := h.svc.Posts.Get(idParam(c, "id"))
	render(c, post, err)
}
func (h *Handler) CreatePost(c *gin.Context) {
	var req service.CreatePostInput
	if bind(c, &req) {
		return
	}
	post, err := h.svc.Posts.Create(middleware.CurrentUserID(c), req)
	render(c, post, err)
}
func (h *Handler) UpdatePost(c *gin.Context) {
	var req service.CreatePostInput
	if bind(c, &req) {
		return
	}
	post, err := h.svc.Posts.Update(middleware.CurrentUserID(c), idParam(c, "id"), req)
	render(c, post, err)
}
func (h *Handler) DeletePost(c *gin.Context) {
	render(c, gin.H{"deleted": true}, h.svc.Posts.Delete(middleware.CurrentUserID(c), idParam(c, "id")))
}
func (h *Handler) LikePost(c *gin.Context) {
	render(c, gin.H{"liked": true}, h.svc.Posts.Like(middleware.CurrentUserID(c), idParam(c, "id")))
}
func (h *Handler) UnlikePost(c *gin.Context) {
	render(c, gin.H{"liked": false}, h.svc.Posts.Unlike(middleware.CurrentUserID(c), idParam(c, "id")))
}
func (h *Handler) FavoritePost(c *gin.Context) {
	render(c, gin.H{"favorited": true}, h.svc.Posts.Favorite(middleware.CurrentUserID(c), idParam(c, "id")))
}
func (h *Handler) UnfavoritePost(c *gin.Context) {
	render(c, gin.H{"favorited": false}, h.svc.Posts.Unfavorite(middleware.CurrentUserID(c), idParam(c, "id")))
}

func (h *Handler) UploadMedia(c *gin.Context) {
	var req struct {
		MediaType, URL, MimeType string
		FileSize                 int64
	}
	if bind(c, &req) {
		return
	}
	media, err := h.svc.Posts.CreateMedia(middleware.CurrentUserID(c), req.MediaType, req.URL, req.MimeType, req.FileSize)
	render(c, media, err)
}
func (h *Handler) GetMedia(c *gin.Context) {
	media, err := h.svc.Repo.FindMedia(idParam(c, "id"))
	render(c, media, err)
}

func (h *Handler) ListComments(c *gin.Context) {
	limit, offset := page(c)
	comments, err := h.svc.Comments.List(idParam(c, "id"), limit, offset)
	render(c, comments, err)
}
func (h *Handler) CreateComment(c *gin.Context) {
	var req service.CreateCommentInput
	if bind(c, &req) {
		return
	}
	comment, err := h.svc.Comments.Create(middleware.CurrentUserID(c), idParam(c, "id"), req)
	render(c, comment, err)
}
func (h *Handler) UpdateComment(c *gin.Context) {
	var req struct {
		Content string `json:"content"`
	}
	if bind(c, &req) {
		return
	}
	comment, err := h.svc.Comments.Update(middleware.CurrentUserID(c), idParam(c, "id"), req.Content)
	render(c, comment, err)
}
func (h *Handler) DeleteComment(c *gin.Context) {
	render(c, gin.H{"deleted": true}, h.svc.Comments.Delete(middleware.CurrentUserID(c), idParam(c, "id")))
}

func (h *Handler) CreateReport(c *gin.Context) {
	var req service.CreateReportInput
	if bind(c, &req) {
		return
	}
	report, err := h.svc.Reports.Create(middleware.CurrentUserID(c), req)
	render(c, report, err)
}
func (h *Handler) MyReports(c *gin.Context) {
	reports, err := h.svc.Reports.Mine(middleware.CurrentUserID(c))
	render(c, reports, err)
}
func (h *Handler) AdminReports(c *gin.Context) {
	reports, err := h.svc.Reports.AdminList(c.Query("status"))
	render(c, reports, err)
}
func (h *Handler) ResolveReport(c *gin.Context) {
	var req struct{ Status, Note string }
	if bind(c, &req) {
		return
	}
	render(c, gin.H{"resolved": true}, h.svc.Reports.Resolve(idParam(c, "id"), middleware.CurrentUserID(c), req.Status, req.Note))
}

func (h *Handler) ModerationJobs(c *gin.Context) {
	jobs, err := h.svc.Moderation.List(c.Query("status"))
	render(c, jobs, err)
}
func (h *Handler) ReviewModerationJob(c *gin.Context) {
	var req struct {
		Decision string `json:"decision"`
	}
	if bind(c, &req) {
		return
	}
	render(c, gin.H{"reviewed": true}, h.svc.Moderation.Review(idParam(c, "id"), req.Decision))
}

func (h *Handler) CreateAIConversation(c *gin.Context) {
	conv, err := h.svc.AI.CreateConversation(middleware.CurrentUserID(c))
	render(c, conv, err)
}
func (h *Handler) GenerateHotspotDraft(c *gin.Context) {
	post, err := h.svc.Hotspot.GenerateDraft(c.Request.Context())
	if err != nil {
		render(c, nil, err)
		return
	}
	if post == nil {
		response.Success(c, gin.H{"message": "latest hotspot draft already exists"})
		return
	}
	response.Success(c, post)
}
func (h *Handler) ListAIConversations(c *gin.Context) {
	convs, err := h.svc.AI.ListConversations(middleware.CurrentUserID(c))
	render(c, convs, err)
}
func (h *Handler) AIMessages(c *gin.Context) {
	messages, err := h.svc.AI.Messages(middleware.CurrentUserID(c), idParam(c, "id"))
	render(c, messages, err)
}
func (h *Handler) SendAIMessage(c *gin.Context) {
	var req struct {
		Content string `json:"content"`
	}
	if bind(c, &req) {
		return
	}
	out, err := h.svc.AI.Send(c.Request.Context(), middleware.CurrentUserID(c), idParam(c, "id"), req.Content)
	if err != nil && err.Error() == "AI_REQUEST_BLOCKED" {
		response.Error(c, http.StatusBadRequest, response.AIRequestBlocked, "AI request blocked by safety policy")
		return
	}
	render(c, out, err)
}

func bind(c *gin.Context, dst interface{}) bool {
	if err := c.ShouldBindJSON(dst); err != nil {
		response.Error(c, http.StatusBadRequest, response.InvalidParams, err.Error())
		return true
	}
	return false
}
func render(c *gin.Context, data interface{}, err error) {
	if err != nil {
		response.Error(c, http.StatusBadRequest, response.InvalidParams, err.Error())
		return
	}
	response.Success(c, data)
}
func idParam(c *gin.Context, name string) uint64 {
	id, _ := strconv.ParseUint(c.Param(name), 10, 64)
	return id
}
func page(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}
