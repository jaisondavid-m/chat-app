package handlers

import (
	"net/http"
	"server/config"
	"server/models"
	"server/utils"
	"time"

	"github.com/gin-gonic/gin"
)

func SendMessage(c *gin.Context) {

	var req models.SendMessageRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	myEmail, ok := claims["email"].(string)
	if !ok || myEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	var sender models.User
	var receiver models.User

	if err := config.DB.Where("email = ?", myEmail).First(&sender).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	if err := config.DB.Where("email = ?", req.Email).First(&receiver).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	msg := models.Message{
		SenderID:   sender.ID,
		ReceiverID: receiver.ID,
		Content:    req.Content,
	}

	config.DB.Create(&msg)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sent",
	})

}

func GetMessages(c *gin.Context) {

	friendEmail := c.Param("email")

	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	myEmail, ok := claims["email"].(string)
	if !ok || myEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	var me models.User
	var friend models.User

	config.DB.Where("email = ?", myEmail).First(&me)
	config.DB.Where("email = ?", friendEmail).First(&friend)

	var messages []models.Message

	config.DB.Where(
		"((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))",
		me.ID, friend.ID,
		friend.ID, me.ID,
	).
		Order("created_at asc").
		Find(&messages)

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
	})

}

func MarkSeen(c *gin.Context) {
	friendEmail := c.Param("email")

	token, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	myEmail, ok := claims["email"].(string)
	if !ok || myEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	var me models.User
	var friend models.User

	if err := config.DB.Where("email = ?", myEmail).First(&me).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	if err := config.DB.Where("email = ?", friendEmail).First(&friend).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	now := time.Now()

	config.DB.Model(&models.Message{}).
		Where("sender_id = ? AND receiver_id = ? AND is_read = ?", friend.ID, me.ID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		})

	c.JSON(http.StatusOK, gin.H{
		"message": "Seen Updated",
	})
}
