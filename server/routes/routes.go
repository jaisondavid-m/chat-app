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
		auth.POST("/google",handlers.GoogleLogin)
		auth.POST("/logout",handlers.Logout)
		auth.POST("/refresh",handlers.RefreshToken)
		auth.GET("/me",handlers.Me)
		auth.PUT("/user/profile",handlers.UpdateProfile)
		auth.POST("/chat/send",handlers.SendMessage)
		auth.GET("/chat/message/:email",handlers.GetMessages)
		auth.PUT("/messages/seen/:email",handlers.MarkSeen)
		auth.GET("/ws",handlers.ChatSocket)
		auth.POST("/friend/request",handlers.SendFriendRequest)
		auth.GET("/friend/requests",handlers.GetFriendRequests)
		auth.POST("/friend/accept/:id",handlers.AcceptFriendRequest)
		auth.POST("/friend/reject/:id",handlers.RejectFriendRequest)
		auth.DELETE("/friend/:id",handlers.DeleteFriend)
		auth.GET("/friends",handlers.GetFriends)
	}

	api.GET("/health",func(c *gin.Context) {
		c.JSON(http.StatusOK,gin.H{
			"message":"Server is very healthy",
		})
	})

}