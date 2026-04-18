package utils

import (
	"net/http"

	"server/config"
	"server/handlers"
	"server/models"

	"github.com/gin-gonic/gin"
)

func RefreshToken( c *gin.Context ) {
	token, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"No refresh token found",
		})
		return
	}

	claims, err := VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Invalid refresh Token",
		})
		return
	}

	email := claims[]
}