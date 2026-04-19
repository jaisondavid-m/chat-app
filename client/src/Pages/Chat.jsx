import React, { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"
import Loading from "../Components/Loading"

function Chat() {

    const { user } = useAuth()
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatStarted, setChatStarted] = useState(false)
    const [typing, setTyping] = useState(false)
    const [seen, setSeen] = useState(false)
    const socket = useRef(null)
    const bottomRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    const loadMessages = async (targetEmail) => {
        try {
            const res = await api.get(`/auth/chat/message/${targetEmail}`)
            setMessages(res.data.messages || [])
            socket.current?.send(
                JSON.stringify({
                    type: "seen",
                    from: user?.Email,
                    to: targetEmail
                })
            )
        } catch (err) {
            setMessages([])
        }
    }

    const startChat = async () => {
        if (!email.trim()) return
        setChatStarted(true)
        setLoading(true)
        // await loadMessages(email)
        socket.current = new WebSocket(
            `ws://localhost:8000/api/auth/ws?email=${user?.Email}`
        )
        socket.current.onopen = async () => {
            await loadMessages(email)
            setLoading(false)
        }
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "message") {
                // setMessages((prev) => [...prev, data])
                loadMessages(email)
            }
            if (data.type === "typing") {
                setTyping(true)
                if (typingTimeoutRef.current) {
                    clearInterval(typingTimeoutRef.current)
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false)
                }, 3000);
            }
            if (data.type === "seen") {
                setSeen(true)
            }
        }
        // setLoading(false)
    }

    const sendMessage = async () => {
        if (!message.trim()) return
        try {
            await api.post("/auth/chat/send", {
                email,
                content: message
            })
            socket.current?.send(
                JSON.stringify({
                    type: "message",
                    from: user?.Email,
                    to: email,
                    content: message
                })
            )
            setMessage("")
            setSeen(false)
            await loadMessages(email)
        } catch (err) {
            console.error(err)
        }
    }

    // useEffect(() => {
    //     let interval
    //     if (chatStarted) {
    //         interval = setInterval(() => {
    //             loadMessages(email)
    //         }, 2000);
    //     }
    //     return () => clearInterval(interval)
    // },[chatStarted,email])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    },[messages])

    useEffect(() => {
        return () => {
            socket.current?.close()
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    },[])

    return (
        <MobileLayout>
            <div className="flex flex-col h-[calc(100vh-120px)]">
                <div className="p-4 border-b bg-white space-y-3">
                    <p className="text-sm text-gray-500">
                        Logged in as <span>{user?.Name}</span>
                    </p>
                    <div className="flex gap-2">
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter Email to chat"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <button
                            onClick={startChat}
                            className="bg-purple-600 text-white px-4 rounded-xl"
                        >
                            Open
                        </button>

                    </div>
                    {typing && (
                        <p className="text-xs text-purple-500 animate-pulse">
                            Typing...
                        </p>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                    {!chatStarted ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Start Chat by entering email
                        </div>
                    ) : loading ? (
                        <Loading text="Loading Chat ..." />
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm">
                            No Messages Yet
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.SenderID === user?.ID || msg.from === user?.Email
                            return (
                                <div
                                    key={msg.ID}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${isMe
                                                ? "bg-purple-600 text-white rounded-br-md"
                                                : "bg-white text-gray-800 rounded-bl-md"
                                            }`}
                                    >
                                        {msg.Content || msg.content}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={bottomRef}></div>
                </div>
                {seen && (
                    <div className="px-4 text-right text-xs text-gray-400">
                        Seen ✓✓
                    </div>
                )}
                {chatStarted && (
                    <div className="p-3 border-t bg-white flex gap-2">
                        <input
                            value={message}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") sendMessage()
                            }}
                            onChange={(e) => {
                                setMessage(e.target.value)
                                socket.current?.send(
                                    JSON.stringify({
                                        type: "typing",
                                        from: user?.Email,
                                        to: email
                                    })
                                )
                            }}
                            placeholder="Type Message..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim()}
                            className={`text-white px-5 rounded-xl ${
                                message.trim()
                                    ? "bg-purple-600"
                                    : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </MobileLayout>

    )
}

export default Chat