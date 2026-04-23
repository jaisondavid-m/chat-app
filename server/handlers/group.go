package handlers

import (
	"net/http"
	"server/config"
	"server/models"
	"time"

	"github.com/gin-gonic/gin"
)

func isMember(groupID, userID uint) (*models.GroupMember, bool) {
	var gm models.GroupMember
	err := config.DB.Where("group_id = ? AND user_id = ? AND is_active = ?", groupID, userID, true).First(&gm).Error
	return &gm, err == nil
}

func isAdmin(groupID, userID uint) bool {
	gm, ok := isMember(groupID, userID)
	return ok && gm.Role == "admin"
}

func CreateGroup(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	var req models.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	group := models.Group{
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   me.ID,
	}
	if err := config.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create group",
		})
		return
	}

	config.DB.Create(&models.GroupMember{
		GroupID:  group.ID,
		UserID:   me.ID,
		Role:     "admin",
		IsActive: true,
	})

	for _, email := range req.MemberEmails {
		var u models.User
		if err := config.DB.Where("email = ?", email).First(&u).Error; err == nil && u.ID != me.ID {
			config.DB.Create(&models.GroupMember{
				GroupID:  group.ID,
				UserID:   u.ID,
				Role:     "member",
				IsActive: true,
			})
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"group": group,
	})
}

func GetMyGroups(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	var memberships []models.GroupMember
	config.DB.Where("user_id = ? AND is_active = ?", me.ID, true).Find(&memberships)

	groupIDs := make([]uint, 0, len(memberships))
	for _, m := range memberships {
		groupIDs = append(groupIDs, m.GroupID)
	}

	var groups []models.Group
	config.DB.Where("id IN ? AND is_active = ?", groupIDs, true).Find(&groups)

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"group":  groups,
	})
}

func GetGroup(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}
	if _, member := isMember(group.ID, me.ID); !member {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	type MemberInfo struct {
		UserID uint   `json:"user_id"`
		Name   string `json:"name"`
		Email  string `json:"email"`
		Avatar string `json:"avatar"`
		Role   string `json:"role"`
	}

	var memberInfos []MemberInfo
	config.DB.
		Table("group_members").
		Select("group_members.user_id, users.name, users.email, users.avatar, group_members.role").
		Joins("JOIN users ON users.id = group_members.user_id").
		Where("group_members.group_id = ? AND group_members.is_active = ?", group.ID, true).
		Scan(&memberInfos)

	c.JSON(http.StatusOK, gin.H{
		"group":   group,
		"members": memberInfos,
	})
}

func UpdateGroup(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if !isAdmin(group.ID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden - Admin Only",
		})
		return
	}

	var req models.UpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalide Data",
		})
		return
	}
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}
	config.DB.Model(&group).Updates(updates)
	c.JSON(http.StatusOK, gin.H{
		"message": "Group Updated",
		"group":   group,
	})
}

func DeleteGroup(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}
	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"messasge": "Group Not Found",
		})
		return
	}

	if !isAdmin(group.ID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden - Admin Only",
		})
		return
	}

	config.DB.Model(&group).Update("is_active", false)

	c.JSON(http.StatusOK, gin.H{
		"message": "Group Deleted Successfully",
	})

}

func AddMember(c *gin.Context) {

	me, ok := getCurrentUser(c)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")
	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if !isAdmin(group.ID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden - Admin Only",
		})
		return
	}

	var req struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	var existing models.GroupMember
	err := config.DB.Where("group_id = ? AND user_id = ?", group.ID, user.ID).First(&existing).Error

	if err == nil {
		if existing.IsActive {
			c.JSON(http.StatusConflict, gin.H{
				"message": "User is Already in the group",
			})
			return
		}
		config.DB.Model(&existing).Update("is_active", true)
	} else {
		config.DB.Create(&models.GroupMember{
			GroupID:  group.ID,
			UserID:   user.ID,
			Role:     "member",
			IsActive: true,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Member Added Successfully",
	})

}

func RemoveMember(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")
	targetUserID := c.Param("userId")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	var target models.User
	if err := config.DB.First(&target, targetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "User Not Found",
		})
		return
	}

	if target.ID != me.ID && !isAdmin(group.ID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	var gm models.GroupMember
	if err := config.DB.Where("group_id = ? AND user_id = ? AND is_active = ?", group.ID, target.ID, true).First(&gm).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Member Not Found",
		})
		return
	}

	config.DB.Model(&gm).Update("is_active", false)
	c.JSON(http.StatusOK, gin.H{
		"message": "Member Removed Successfully",
	})
}

func ChangeRole(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")
	targetUserID := c.Param("userId")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if !isAdmin(group.ID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden - admins only",
		})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || (req.Role != "admin" && req.Role != "member") {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Role must be 'admin' or 'member'",
		})
		return
	}

	var gm models.GroupMember
	if err := config.DB.Where("group_id = ? AND user_id = ? AND is_active = ?", group.ID, targetUserID, true).First(&gm).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Member Not Found",
		})
		return
	}

	config.DB.Model(&gm).Update("role", req.Role)

	c.JSON(http.StatusOK, gin.H{
		"message": "Role Updated",
	})
}

func SendGroupMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if _, member := isMember(group.ID, me.ID); !member {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	var req models.SendGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	msg := models.GroupMessage{
		GroupID:    group.ID,
		SenderID:   me.ID,
		Content:    req.Content,
		ImageURL:   req.ImageURL,
		Latitude:   req.Latitude,
		Longitude:  req.Longitude,
		IsLocation: req.IsLocation,
	}

	config.DB.Create(&msg)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sent",
		"msg":     msg,
	})

}

func GetGroupMessages(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if _, member := isMember(group.ID, me.ID); !member {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	var messages []models.GroupMessage
	config.DB.Where("group_id = ?", group.ID).Order("created_at asc").Find(&messages)

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
	})
}

func EditGroupMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	var msg models.GroupMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Message Not Found",
		})
		return
	}

	if msg.SenderID != me.ID {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}
	if msg.IsDeleted {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Cannot Edit Deleted Message",
		})
		return
	}
	now := time.Now()
	config.DB.Model(&msg).Updates(map[string]interface{}{
		"content":   req.Content,
		"is_edited": true,
		"edited_at": &now,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Message Updaetd",
	})

}

func DeleteGroupMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var msg models.GroupMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Message Not Found",
		})
		return
	}

	if msg.IsDeleted {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Already Deleted",
		})
		return
	}

	if msg.SenderID != me.ID && !isAdmin(msg.GroupID, me.ID) {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	config.DB.Model(&msg).Updates(map[string]interface{}{
		"content":    "",
		"image_url":  "",
		"is_deleted": true,
		"is_edited":  false,
		"edited_at":  nil,
		"reaction":   nil,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Message Deleted",
	})

}

func ReactGroupMessage(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	id := c.Param("id")

	var req struct {
		Emoji string `json:"emoji"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid Data",
		})
		return
	}

	var msg models.GroupMessage
	if err := config.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Message Not Found",
		})
		return
	}

	if _, member := isMember(msg.GroupID, me.ID); !member {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	config.DB.Model(&msg).Update("reaction", req.Emoji)

	c.JSON(http.StatusOK, gin.H{
		"message": "Reaction Added",
	})

}

func MarkGroupSeen(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")

	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Group Not Found",
		})
		return
	}

	if _, member := isMember(group.ID, me.ID); !member {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Forbidden",
		})
		return
	}

	var msgIDs []uint
	config.DB.Model(&models.GroupMessage{}).Where("group_id = ?", group.ID).Pluck("id", &msgIDs)

	if len(msgIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "Seen Updated",
		})
		return
	}

	now := time.Now()

	for _, msgID := range msgIDs {
		var existing models.GroupMessageRead
		err := config.DB.Where("message_id = ? AND user_id = ?", msgID, me.ID).First(&existing).Error
		if err != nil {
			config.DB.Create(&models.GroupMessageRead{
				MessageID: msgID,
				UserID:    me.ID,
				ReadAt:    &now,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Seen Updated",
	})

}

func GetGroupUnreadCount(c *gin.Context) {
	me, ok := getCurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	groupID := c.Param("id")

	var msgIDs []uint
	config.DB.Model(&models.GroupMessage{}).Where("group_id = ?", groupID).Pluck("id", &msgIDs)

	if len(msgIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"count": 0,
		})
		return
	}

	var readIDs []uint
	config.DB.Model(&models.GroupMessageRead{}).Where("message_id IN ? AND user_id = ?", msgIDs, me.ID).Pluck("message_id", &readIDs)

	c.JSON(http.StatusOK, gin.H{
		"count": len(msgIDs) - len(readIDs),
	})

}
