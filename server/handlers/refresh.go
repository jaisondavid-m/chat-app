package handlers

import (
	"net/http"

	"server/config"
	"server/utils"
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

	claims, err := utils.VerifyRefreshToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Invalid refresh Token",
		})
		return
	}

	email := claims["email"].(string)

	var user models.User
	err = config.DB.Where("email = ?",email).First(&user).Error
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"User Not Found",
		})
		return
	}

	newAccessToken, _ := utils.GenerateAccessToken(user.Name,user.Email,user.Avatar)

	setAuthCookie(c, "access_token",newAccessToken,60*60*24)

	c.JSON(http.StatusOK,gin.H{
		"message":"Token Refreshed",
	})
}