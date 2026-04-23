package routes

import (
	"net/http"
	"server/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {

	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/google", handlers.GoogleLogin)
		auth.POST("/logout", handlers.Logout)
		auth.POST("/refresh", handlers.RefreshToken)
		auth.GET("/me", handlers.Me)
		auth.GET("/presence/:email", handlers.GetPresence)
		auth.PUT("/user/profile", handlers.UpdateProfile)
		auth.POST("/chat/send", handlers.SendMessage)
		auth.POST("/chat/upload", handlers.UploadImage)
		auth.GET("/chat/message/:email", handlers.GetMessages)
		auth.PUT("/chat/message/:id", handlers.EditMessage)
		auth.PUT("/chat/message/delete/:id", handlers.DeleteMessage)
		auth.PUT("/chat/message/react/:id", handlers.ReactMessage)
		auth.PUT("/chat/message/view/:id", handlers.MarkImageViewed)
		auth.GET("/messages/unread-counts", handlers.GetUnReadCounts)
		auth.PUT("/messages/seen/:email", handlers.MarkSeen)
		auth.GET("/ws", handlers.ChatSocket)
		auth.POST("/friend/request", handlers.SendFriendRequest)
		auth.GET("/friend/requests", handlers.GetFriendRequests)
		auth.POST("/friend/accept/:id", handlers.AcceptFriendRequest)
		auth.POST("/friend/reject/:id", handlers.RejectFriendRequest)
		auth.DELETE("/friend/:id", handlers.DeleteFriend)
		auth.GET("/friends", handlers.GetFriends)
		auth.POST("/block/:id", handlers.BlockUser)
		auth.DELETE("/unblock/:id", handlers.UnblockUser)
		auth.GET("/blocks", handlers.GetBlockedUsers)
		auth.POST("/chat/lock/:friendId", handlers.LockChat)
		auth.POST("/chat/lock/verify/:friendId", handlers.VerifyPin)
		auth.DELETE("/chat/lock/:friendId", handlers.UnblockChat)
		auth.GET("/chat/locks", handlers.GetLockedChats)
		auth.POST("/group", handlers.CreateGroup)
		auth.GET("/groups", handlers.GetMyGroups)
		auth.GET("/group/:id", handlers.GetGroup)
		auth.PUT("/group/:id", handlers.UpdateGroup)
		auth.DELETE("/group/:id", handlers.DeleteGroup)
		auth.POST("/group/:id/member", handlers.AddMember)
		auth.DELETE("/group/:id/member/:userId", handlers.RemoveMember)
		auth.PUT("/group/:id/member/:userId/role", handlers.ChangeRole)
		auth.POST("/group/:id/messages", handlers.SendGroupMessage)
		auth.GET("/group/:id/messages", handlers.GetGroupMessages)
		auth.PUT("/group/message/:id", handlers.EditGroupMessage)
		auth.DELETE("/group/message/:id", handlers.DeleteGroupMessage)
		auth.PUT("/group/message/:id/react", handlers.ReactGroupMessage)
		auth.PUT("/group/:id/seen", handlers.MarkGroupSeen)
		auth.GET("/group/:id/unread", handlers.GetGroupUnreadCount)
	}

	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Server is very healthy",
		})
	})

}
