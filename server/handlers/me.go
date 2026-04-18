package handlers

import (
	"net/http"
	"server/models"
	"server/utils"
	"server/config"
	"github.com/gin-gonic/gin"
)

func Me(c *gin.Context) {

	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Not Authenticated",
		})
		return
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Invalid Token",
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

	c.JSON(http.StatusOK,gin.H{
		"user":user,
	})

}