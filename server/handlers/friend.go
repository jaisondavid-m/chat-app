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
		return models.User{}, false
	}

	claims, err := utils.VerifyAccessToken(token)
	if err != nil {
		return models.User{}, false
	}

	email := claims["email"].(string)

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return models.User{}, false
	}
	return user, true
}

func hasBlockRelation(user1ID, user2ID uint) (bool, error) {
	var count int64
	err := config.DB.Model(&models.Block{}).
		Where(
			"(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
			user1ID, user2ID,
			user2ID, user1ID,
		).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func SendFriendRequest(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	var req struct {
		Email string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Email is required"})
		return
	}

	var friend models.User
	if err := config.DB.Where("email = ?", req.Email).First(&friend).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User Not Found"})
		return
	}
	if me.ID == friend.ID {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Cannot add Yourself"})
		return
	}
	blocked, err := hasBlockRelation(me.ID, friend.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to process request"})
		return
	}
	if blocked {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Cannot Send Friend request",
		})
		return
	}
	var pending models.FriendRequest
	if err := config.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		me.ID, friend.ID, friend.ID, me.ID,
	).Where("status = ?", "pending").First(&pending).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Request Already Exists",
		})
		return
	}

	if err := config.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		me.ID, friend.ID, friend.ID, me.ID,
	).Where("status = ?", "rejected").Delete(&models.FriendRequest{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create request"})
		return
	}

	var existing models.Friend
	if err := config.DB.Where(
		"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		me.ID, friend.ID, friend.ID, me.ID,
	).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Already Friends",
		})
		return
	}
	// var block models.Block
	// err := config.DB.Where(
	// 	"(user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)",
	// 	me.ID, friend.ID, friend.ID, me.ID,
	// ).First(&block).Error
	// if err == nil {
	// 	c.JSON(http.StatusForbidden,gin.H{
	// 		"message":"Cannot send request",
	// 	})
	// 	return
	// }

	request := models.FriendRequest{
		SenderID:   me.ID,
		ReceiverID: friend.ID,
		Status:     "pending",
	}
	if err := config.DB.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to send request"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Friend Request Send"})
}

func GetFriendRequests(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	var requests []models.FriendRequest
	blockSubQuery := config.DB.Model(&models.Block{}).
		Select("1").
		Where(
			"(user_id = ? AND blocked_id = friend_requests.sender_id) OR (user_id = friend_requests.sender_id AND blocked_id = ?)",
			me.ID,
			me.ID,
		)

	if err := config.DB.Where("receiver_id = ? AND status = ?", me.ID, "pending").
		Where("NOT EXISTS (?)", blockSubQuery).
		Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load requests"})
		return
	}

	if len(requests) == 0 {
		c.JSON(http.StatusOK, gin.H{"requests": []gin.H{}})
		return
	}

	senderIDs := make([]uint, 0, len(requests))
	for _, req := range requests {
		senderIDs = append(senderIDs, req.SenderID)
	}

	var senders []models.User
	if err := config.DB.Select("id", "name", "email", "avatar").Where("id IN ?", senderIDs).Find(&senders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load sender data"})
		return
	}

	senderByID := make(map[uint]models.User, len(senders))
	for _, sender := range senders {
		senderByID[sender.ID] = sender
	}

	response := make([]gin.H, 0, len(requests))
	for _, req := range requests {
		response = append(response, gin.H{
			"ID":         req.ID,
			"SenderID":   req.SenderID,
			"ReceiverID": req.ReceiverID,
			"Status":     req.Status,
			"CreatedAt":  req.CreatedAt,
			"sender":     senderByID[req.SenderID],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": response,
	})
}

func AcceptFriendRequest(c *gin.Context) {

	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	id := c.Param("id")

	var req models.FriendRequest
	if err := config.DB.First(&req, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Request Not Found",
		})
		return
	}
	if req.ReceiverID != me.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}
	if req.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Request already processed"})
		return
	}
	if isBlocked(me.ID, req.SenderID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Cannot Accept Request",
		})
		return
	}
	req.Status = "accepted"

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		ensureFriend := func(userID, friendID uint) error {
			var relation models.Friend
			err := tx.Unscoped().Where("user_id = ? AND friend_id = ?", userID, friendID).First(&relation).Error
			if err == nil {
				if relation.DeletedAt.Valid {
					return tx.Unscoped().Model(&relation).Update("deleted_at", nil).Error
				}
				return nil
			}
			if err != gorm.ErrRecordNotFound {
				return err
			}

			return tx.Create(&models.Friend{
				UserID:   userID,
				FriendID: friendID,
			}).Error
		}

		if err := ensureFriend(me.ID, req.SenderID); err != nil {
			return err
		}

		if err := ensureFriend(req.SenderID, me.ID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to accept request"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Friend Added"})
}

func RejectFriendRequest(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	id := c.Param("id")
	var req models.FriendRequest
	if err := config.DB.First(&req, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Request Not Found",
		})
		return
	}
	if req.ReceiverID != me.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}
	if req.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Request already processed"})
		return
	}
	req.Status = "rejected"
	if err := config.DB.Save(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to reject request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Request Rejected",
	})
}

func GetFriends(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	var relations []models.Friend
	if err := config.DB.Where("user_id = ?", me.ID).Find(&relations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load friends"})
		return
	}

	if len(relations) == 0 {
		c.JSON(http.StatusOK, gin.H{"friends": []models.User{}})
		return
	}

	var ids []uint
	for _, f := range relations {
		ids = append(ids, f.FriendID)
	}

	var users []models.User
	if err := config.DB.Where("id IN ?", ids).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load friend users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"friends": users,
	})
}

func DeleteFriend(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var friend models.User
	if err := config.DB.First(&friend, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Friend Not Found",
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

			friend.ID, me.ID,
		).Delete(&models.Friend{}).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to remove Friend",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Friend Removed",
	})

}

func BlockUser(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User not found",
		})
		return
	}
	if me.ID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Cannot block yourself",
		})
		return
	}
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var block models.Block
		err := tx.Unscoped().Where("user_id = ? AND blocked_id = ?", me.ID, user.ID).First(&block).Error
		if err == nil {
			if block.DeletedAt.Valid {
				if err := tx.Unscoped().Model(&block).Update("deleted_at", nil).Error; err != nil {
					return err
				}
			}
		} else if err == gorm.ErrRecordNotFound {
			if err := tx.Create(&models.Block{
				UserID:    me.ID,
				BlockedID: user.ID,
			}).Error; err != nil {
				return err
			}
		} else {
			return err
		}
		if err := tx.Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			me.ID, user.ID, user.ID, me.ID,
		).Delete(&models.FriendRequest{}).Error; err != nil {
			return err
		}
		if err := tx.Where(
			"(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
			me.ID, user.ID, user.ID, me.ID,
		).Delete(&models.Friend{}).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to block user",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "User Blocked",
	})
}

func UnblockUser(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	id := c.Param("id")
	if err := config.DB.Unscoped().Where(
		"user_id = ? AND blocked_id = ?",
		me.ID, id,
	).Delete(&models.Block{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to Unblock",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "User Unblocked",
	})
}

func GetBlockedUsers(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	var blocks []models.Block
	if err := config.DB.Where("user_id = ?", me.ID).Find(&blocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Process Failed to proceed",
		})
		return
	}
	if len(blocks) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"users": []models.User{},
		})
		return
	}
	var ids []uint
	for _, b := range blocks {
		ids = append(ids, b.BlockedID)
	}
	var users []models.User
	if err := config.DB.Where("id IN ?", ids).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Server Error",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

func isBlocked(user1ID, user2ID uint) bool {
	blocked, err := hasBlockRelation(user1ID, user2ID)
	if err != nil {
		return true
	}

	return blocked
}
