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
	}

	api.GET("/health",func(c *gin.Context) {
		c.JSON(http.StatusOK,gin.H{
			"message":"Server is very healthy",
		})
	})

}