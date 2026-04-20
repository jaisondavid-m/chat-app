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
		ImageURL: req.ImageURL,
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

func EditMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var req struct {
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Invalid Data",
		})
		return
	}

	// var msg models.Message
	// if err := c.ShouldBindJSON(&req); err != nil {
	// 	c.JSON(http.StatusBadRequest,gin.H{
	// 		"message":"Invalid Data",
	// 	})
	// 	return
	// }

	var msg models.Message
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{
			"message":"Message Not Found",
		})
		return
	}

	if msg.SenderID != me.ID {
		c.JSON(http.StatusForbidden,gin.H{
			"message":"Forbidden",
		})
		return
	}

	if msg.IsDeleted {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Cannot edit deleted message",
		})
	}

	now := time.Now()

	if err := config.DB.Model(&msg).Updates(map[string]interface{}{
		"content": req.Content,
		"is_edited": true,
		"edited_at": &now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{
			"message":"Failed to Edit",
		})
		return
	}

	c.JSON(http.StatusOK,gin.H{
		"message":"Message Updated",
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

func DeleteMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var msg models.Message
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{
			"message":"Message Not Found",
		})
		return
	}

	if msg.SenderID != me.ID {
		c.JSON(http.StatusForbidden,gin.H{
			"message":"Forbidden",
		})
		return
	}

	if msg.IsDeleted {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Alreay Deleted",
		})
		return
	}

	err := config.DB.Model(&msg).Updates(map[string]interface{}{
		"content": "",
		"image_url": "",
		"is_deleted": true,
		"is_edited": false,
		"edited_at":nil,
	}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{
			"message":"Failed to delete",
		})
		return
	}
	c.JSON(http.StatusOK,gin.H{
		"message":"Message Deleted Successfully",
	})
}