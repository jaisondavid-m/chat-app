package handlers

import (
	"errors"
	"net/http"
	"server/config"
	"server/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func LockChat(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	friendID := c.Param("friendId")
	var req struct {
		Pin string `json:"pin"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || len(req.Pin) < 4 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "PIN must be at least 4 digits",
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Pin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to process PIN",
		})
		return
	}

	var existing models.LockedChat
	err = config.DB.Unscoped().Where("user_id = ? AND friend_id = ?", me.ID, friendID).First(&existing).Error
	if err == nil {
		updates := map[string]interface{}{
			"pin_hash":   string(hash),
			"deleted_at": nil,
		}
		if err := config.DB.Unscoped().Model(&existing).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to lock chat",
			})
			return
		}
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := config.DB.Create(&models.LockedChat{
			UserID:   me.ID,
			FriendID: parseUint(friendID),
			PinHash:  string(hash),
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to lock chat",
			})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to lock chat",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Chat Locked",
	})
}

func UnblockChat(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	friendID := c.Param("friendId")
	var req struct {
		Pin string `json:"pin"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	var lock models.LockedChat
	if err := config.DB.Where("user_id = ? AND friend_id = ?", me.ID, friendID).First(&lock).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Chat not locked",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(lock.PinHash), []byte(req.Pin)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Wrong PIN",
		})
		return
	}

	config.DB.Delete(&lock)
	c.JSON(http.StatusOK, gin.H{
		"message": "Chat Unlocked",
	})
}

func GetLockedChats(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	var locks []models.LockedChat
	config.DB.Where("user_id = ?", me.ID).Find(&locks)

	ids := make([]uint, 0)
	for _, l := range locks {
		ids = append(ids, l.FriendID)
	}

	c.JSON(http.StatusOK, gin.H{"lockedFriendIds": ids})
}

func VerifyPin(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	friendID := c.Param("friendId")
	var req struct {
		Pin string `json:"pin"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	var lock models.LockedChat
	if err := config.DB.Where("user_id = ? AND friend_id = ?", me.ID, friendID).First(&lock).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Not Locked",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(lock.PinHash), []byte(req.Pin)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Wrong PIN",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verfied",
	})
}

func parseUint(s string) uint {
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0
	}
	return uint(n)
}
