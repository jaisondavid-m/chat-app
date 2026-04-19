package handlers

import (

	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

)

var clients = make(map[string]*websocket.Conn)
var mu sync.Mutex

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

	defer func() {
		mu.Lock()
		delete(clients,email)
		mu.Unlock()
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