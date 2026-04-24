package handlers

import (
	"path/filepath"
	"fmt"
	"time"
	"net/http"
	"server/utils"

	"github.com/gin-gonic/gin"
)

func UploadImage(c *gin.Context) {
	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}
	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"unauthorized",
		})
		return
	}
	myEmail, ok := claims["email"].(string)
	if !ok || myEmail == "" {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"No Image",
		})
		return
	}
	filename := fmt.Sprintf("%d_%s",time.Now().UnixNano(),filepath.Base(file.Filename))
	path := "uploads/" + filename
	if err := c.SaveUploadedFile(file,path); err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{
			"message":"Upload failed",
		})
		return
	}
	c.JSON(http.StatusOK,gin.H{
		"url":"https://chat-app-1-wl5y.onrender.com/" + path,
	})
}