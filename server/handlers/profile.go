package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"server/config"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
)

func UpdateProfile(c *gin.Context) {
	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid Token",
		})
		return
	}

	email := claims["email"].(string)

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User Not Found"})
		return
	}

	name := c.PostForm("name")
	if name != "" {
		user.Name = name
	}

	file, err := c.FormFile("avatar")
	if err == nil {
		os.MkdirAll("uploads", os.ModePerm)
		filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
		path := "uploads/" + filename

		if err := c.SaveUploadedFile(file, path); err == nil {
			user.Avatar = "/" + path
		}

	}
	config.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile Updated",
		"user":    user,
	})
}
