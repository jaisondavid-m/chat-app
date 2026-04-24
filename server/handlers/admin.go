package handlers

import (
	"net/http"
	"server/config"
	"server/models"

	"github.com/gin-gonic/gin"
)

func GetAllUsers(c *gin.Context) {

	var users []models.User

	if err := config.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})

}

func GetAdminStats(c *gin.Context) {

	var users, activeUsers, groups, activeGroups int64

	config.DB.Model(&models.User{}).Count(&users)
	config.DB.Model(&models.User{}).Where("is_active = ?", true).Count(&activeUsers)
	config.DB.Model(&models.Group{}).Count(&groups)
	config.DB.Model(&models.Group{}).Where("is_active = ?", true).Count(&activeGroups)

	c.JSON(http.StatusOK, gin.H{
		"total_users":   users,
		"active_users":  activeUsers,
		"total_groups":  groups,
		"active_groups": activeGroups,
	})

}

type SwitchRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

func SwitchUserRole(c *gin.Context) {

	targetID := c.Param("id")

	userVal, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	currentUser, ok := userVal.(models.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	if currentUser.Role != "admin" && currentUser.Role != "superadmin" {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Access Denied",
		})
		return
	}

	var targetUser models.User
	if err := config.DB.First(&targetUser, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not found",
		})
		return
	}

	if targetUser.Role == "superadmin" {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Cannot modify superadmin",
		})
		return
	}

	if currentUser.Role == "admin" && targetUser.Role == "admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Admins cannot modify other admins",
		})
		return
	}

	var req SwitchRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid role",
		})
		return
	}

	if req.Role != "admin" && req.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Role Must be 'admin' or 'user'",
		})
		return
	}

	targetUser.Role = req.Role

	if err := config.DB.Save(&targetUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to update role",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role Updated Successfully",
		"user":    targetUser,
	})

}
