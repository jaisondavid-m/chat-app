package handlers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var clients = make(map[string]*websocket.Conn)
var mu sync.Mutex
var onlineUsers = make(map[string]bool)
var lastSeen = make(map[string]time.Time)
var activeConnections = make(map[string]int)
var presenceMu sync.Mutex

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ChatSocket(c *gin.Context) {

	email := c.Query("email")

	conn, err := upgrader.Upgrade(c.Writer,c.Request,nil)
	if err != nil {
		return
	}

	mu.Lock()
	clients[email] = conn
	mu.Unlock()

	presenceMu.Lock()
	activeConnections[email]++
	onlineUsers[email] = true
	lastSeen[email] = time.Now()
	presenceMu.Unlock()

	defer func() {
		mu.Lock()
		delete(clients,email)
		mu.Unlock()

		presenceMu.Lock()
		activeConnections[email]--
		if activeConnections[email] <= 0 {
			delete(activeConnections, email)
			onlineUsers[email] = false
			lastSeen[email] = time.Now()
		} else {
			onlineUsers[email] = true
		}
		presenceMu.Unlock()

		conn.Close()
	}()

	for {
		var msg map[string]interface{}

		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}

		target := msg["to"].(string)
		
		mu.Lock()
		targetConn, ok := clients[target]
		mu.Unlock()

		if ok {
			targetConn.WriteJSON(msg)
		}
	}
}

func GetPresence(c *gin.Context) {
	email := c.Param("email")

	presenceMu.Lock()
	isOnline := onlineUsers[email]
	last := lastSeen[email]
	presenceMu.Unlock()

	if last.IsZero() {
		last = time.Now()
	}
	c.JSON(http.StatusOK,gin.H{
		"online":isOnline,
		"last_seen":last,
	})
}