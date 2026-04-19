package handlers

import (
	"net/http"
	"server/config"
	"server/models"
	"server/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func getCurrentUser(c *gin.Context) (models.User, bool) {
	token, err := c.Cookie("access_token")
	if err != nil {
		return models.User{},false
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		return models.User{},false
	}

	email := claims["email"].(string)

	var user models.User
	if err := config.DB.Where("email = ?",email).First(&user).Error; err != nil {
		return models.User{},false
	}
	return user,true
}

func SendFriendRequest(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}
	var req struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Invalid Data",
		})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		c.JSON(http.StatusBadRequest,gin.H{"message":"Email is required"})
		return
	}

	var friend models.User
	if err := config.DB.Where("email = ?",req.Email).First(&friend).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{"message":"User Not Found"})
		return
	}
	if me.ID == friend.ID {
		c.JSON(http.StatusBadRequest,gin.H{"message":"Cannot add Yourself"})
		return
	}
	var pending models.FriendRequest
	if err := config.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		me.ID,friend.ID,friend.ID,me.ID,
	).Where("status = ?", "pending").First(&pending).Error; err == nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Request Already Exists",
		})
		return
	}

	if err := config.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		me.ID,friend.ID,friend.ID,me.ID,
	).Where("status = ?", "rejected").Delete(&models.FriendRequest{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to create request"})
		return
	}

	var existing models.Friend
	if err := config.DB.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		me.ID,friend.ID,friend.ID,me.ID,
	).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Already Friends",
		})
		return
	}

	request := models.FriendRequest{
		SenderID: me.ID,
		ReceiverID: friend.ID,
		Status: "pending",
	}
	if err := config.DB.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to send request"})
		return
	}
	c.JSON(http.StatusOK,gin.H{"message":"Friend Request Send"})
}

func GetFriendRequests(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}
	var requests []models.FriendRequest

	if err := config.DB.Where("receiver_id = ? AND status = ?",me.ID,"pending").
		Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to load requests"})
		return
	}

	if len(requests) == 0 {
		c.JSON(http.StatusOK,gin.H{"requests": []gin.H{}})
		return
	}

	senderIDs := make([]uint, 0, len(requests))
	for _, req := range requests {
		senderIDs = append(senderIDs, req.SenderID)
	}

	var senders []models.User
	if err := config.DB.Select("id", "name", "email", "avatar").Where("id IN ?", senderIDs).Find(&senders).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to load sender data"})
		return
	}

	senderByID := make(map[uint]models.User, len(senders))
	for _, sender := range senders {
		senderByID[sender.ID] = sender
	}

	response := make([]gin.H, 0, len(requests))
	for _, req := range requests {
		response = append(response, gin.H{
			"ID": req.ID,
			"SenderID": req.SenderID,
			"ReceiverID": req.ReceiverID,
			"Status": req.Status,
			"CreatedAt": req.CreatedAt,
			"sender": senderByID[req.SenderID],
		})
	}

	c.JSON(http.StatusOK,gin.H{
		"requests":response,
	})
}

func AcceptFriendRequest(c *gin.Context) {

	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}
	id := c.Param("id")

	var req models.FriendRequest
	if err := config.DB.First(&req,id).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{
			"message":"Request Not Found",
		})
		return
	}
	if req.ReceiverID != me.ID {
		c.JSON(http.StatusForbidden,gin.H{
			"message":"Forbidden",
		})
		return
	}
	if req.Status != "pending" {
		c.JSON(http.StatusBadRequest,gin.H{"message":"Request already processed"})
		return
	}
	req.Status = "accepted"

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		if err := tx.FirstOrCreate(&models.Friend{}, models.Friend{
			UserID: me.ID,
			FriendID: req.SenderID,
		}).Error; err != nil {
			return err
		}

		if err := tx.FirstOrCreate(&models.Friend{}, models.Friend{
			UserID: req.SenderID,
			FriendID: me.ID,
		}).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to accept request"})
		return
	}
	c.JSON(http.StatusOK,gin.H{"message":"Friend Added"})
}

func RejectFriendRequest(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}
	id := c.Param("id")
	var req models.FriendRequest
	if err := config.DB.First(&req,id).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{
			"message":"Request Not Found",
		})
		return
	}
	if req.ReceiverID != me.ID {
		c.JSON(http.StatusForbidden,gin.H{
			"message":"Forbidden",
		})
		return
	}
	if req.Status != "pending" {
		c.JSON(http.StatusBadRequest,gin.H{"message":"Request already processed"})
		return
	}
	req.Status = "rejected"
	if err := config.DB.Save(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to reject request"})
		return
	}

	c.JSON(http.StatusOK,gin.H{
		"message":"Request Rejected",
	})
}

func GetFriends(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}
	var relations []models.Friend
	if err := config.DB.Where("user_id = ?",me.ID).Find(&relations).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to load friends"})
		return
	}

	if len(relations) == 0 {
		c.JSON(http.StatusOK,gin.H{"friends": []models.User{}})
		return
	}

	var ids []uint
	for _, f := range relations {
		ids = append(ids, f.FriendID)
	}

	var users []models.User
	if err := config.DB.Where("id IN ?",ids).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Failed to load friend users"})
		return
	}

	c.JSON(http.StatusOK,gin.H{
		"friends":users,
	})
}

func DeleteFriend(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Unauthorized",
		})
		return
	}
	
	id := c.Param("id")

	var friend models.User
	if err := config.DB.First(&friend, id).Error; err != nil {
		c.JSON(http.StatusNotFound,gin.H{
			"message":"Friend Not Found",
		})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(
			"user_id = ? AND friend_id = ?",
			me.ID, friend.ID,
		).Delete(&models.Friend{}).Error; err != nil {
			return err
		}
		if err := tx.Where(
			"user_id = ? AND friend_id = ?",

			friend.ID,me.ID,
		).Delete(&models.Friend{}).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{
			"message":"Failed to remove Friend",
		})
		return
	}

	c.JSON(http.StatusOK,gin.H{
		"message":"Friend Removed",
	})

}