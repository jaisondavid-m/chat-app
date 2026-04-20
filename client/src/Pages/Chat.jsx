import React, { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"
import Loading from "../Components/Loading"

function Chat() {

    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatStarted, setChatStarted] = useState(false)
    const [typing, setTyping] = useState(false)
    // const [seen, setSeen] = useState(false)
    const socket = useRef(null)
    const bottomRef = useRef(null)
    const typingTimeoutRef = useRef(null)
    const fileInputRef = useRef(null)
    const [friends, setFriends] = useState([])
    const [selectedFriend, setSelectedFriend] = useState(null)
    const [showList, setShowList] = useState(true)
    const [image, setImage] = useState(null)
    const [presence, setPresence] = useState({})
    const [actionMsg, setActionMsg] = useState(null)
    const [showActions, setShowActions] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState("")
    const pressTimer = useRef(null)

    const loadFriends = async () => {
        try {
            const res = await api.get("/auth/friends")
            setFriends(res.data?.friends || [])
            res.data?.friends.forEach(friend => {
                fetchPresence(friend.Email)
            })
        } catch (err) {
            console.error(err)
        }
    }

    const loadMessages = async (targetEmail) => {
        try {
            const res = await api.get(`/auth/chat/message/${targetEmail}`)
            const msgs = res.data.messages || []
            setMessages(msgs)
            const last = msgs[msgs.length - 1]
            if (last && last.SenderID !== user.ID) {
                await api.put(`/auth/messages/seen/${targetEmail}`)
                const updated = await api.get(`/auth/chat/message/${targetEmail}`)
                setMessages(updated.data.messages || [])
                socket.current?.send(
                    JSON.stringify({
                        type: "seen",
                        from: user?.Email,
                        to: targetEmail,
                    })
                )
            }
        } catch (err) {
            setMessages([])
        }
    }

    const uploadImage = async (file) => {
        const formData = new FormData()
        formData.append("image", file)
        const res = await api.post("/auth/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
        return res.data.url
    }

    const fetchPresence = async (friendEmail) => {
        try {
            const res = await api.get(`/auth/presence/${encodeURIComponent(friendEmail)}`)
            setPresence(prev => ({
                ...prev,
                [friendEmail]: res.data
            }))
        } catch (err) {
            console.error(err)
        }
    }

    const startChat = async (targetEmail = email) => {
        const normalizedEmail = (targetEmail || "").trim()
        if (!normalizedEmail) return
        setEmail(normalizedEmail)
        const friend = friends.find(f => f.Email === normalizedEmail)
        setSelectedFriend(friend || null)
        setChatStarted(true)
        setShowList(false)
        setLoading(true)
        if (socket.current) {
            socket.current.close()
        }
        // await loadMessages(email)
        socket.current = new WebSocket(
            `ws://localhost:8000/api/auth/ws?email=${user?.Email}`
        )
        socket.current.onopen = async () => {
            await loadMessages(normalizedEmail)
            setLoading(false)
        }
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "message") {
                // setMessages((prev) => [...prev, data])
                loadMessages(normalizedEmail)
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
                loadMessages(normalizedEmail)
            }
        }
        // setLoading(false)
    }

    const sendMessage = async () => {
        if (!message.trim() && !image) return
        try {
            let imageUrl = ""
            if (image) {
                imageUrl = await uploadImage(image)
            }
            await api.post("/auth/chat/send", {
                email,
                content: message,
                image_url: imageUrl,
            })
            socket.current?.send(
                JSON.stringify({
                    type: "message",
                    from: user?.Email,
                    to: email,
                    content: message,
                    image: imageUrl
                })
            )
            setMessage("")
            setImage(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
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
    }, [messages])

    useEffect(() => {
        return () => {
            socket.current?.close()
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        loadFriends()
        const initialEmail = (searchParams.get("email") || "").trim()
        if (!initialEmail || !user?.Email) return
        startChat(initialEmail)
    }, [searchParams, user?.Email])

    useEffect(() => {
        if (!email) return
        const friend = friends.find((f) => f.Email === email)
        setSelectedFriend(friend || null)
    }, [friends, email])

    useEffect(() => {
        if (friends.length === 0) return
        const interval = setInterval(() => {
            friends.forEach(f => fetchPresence(f.Email))
        }, 10000)

        return () => clearInterval(interval)
    }, [friends])

    const goBackToList = () => {
        setShowList(true)
        setChatStarted(false)
        setMessage("")
        setTyping(false)
    }

    const startPress = (msg) => {
        pressTimer.current = setTimeout(() => {
            setActionMsg(msg)
            setShowActions(true)
        }, 400);
    }

    const cancelPress = () => {
        clearTimeout(pressTimer.current)
    }

    const openEdit = () => {
        setEditingId(actionMsg.ID)
        setEditText(actionMsg.Content)
        setShowActions(false)
    }

    const saveEdit = async () => {
        try {
            await api.put(`/auth/chat/message/${editingId}`, {
                content: editText,
            })
            socket.current?.send(JSON.stringify({
                type: "message",
                to: email,
            }))
            setEditingId(null)
            setEditText("")
            loadMessages(email)
        } catch (err) {
            console.error(err)
        }
    }

    const deleteMessage = async () => {
        try {
            await api.put(`/auth/chat/message/delete/${actionMsg.ID}`)
            socket.current?.send(JSON.stringify({
                type: "message",
                to: email,
            }))
            setShowActions(false)
            loadMessages(email)
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <MobileLayout>
            <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
                {showList && (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* <div className="bg-white px-4 py-4 border-b">
                            <h1 className="text-xl font-bold text-gray-800">
                                Chats
                            </h1>
                        </div> */}
                        <div className="flex-1 overflow-y-auto bg-white">
                            {friends.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No Friends Yet
                                </div>
                            ) : (
                                friends.map((friend) => (
                                    <button
                                        key={friend.ID}
                                        onClick={() => startChat(friend.Email)}
                                        className="flex w-full px-4 py-3 items-center gap-3 border-b hover:bg-gray-50 transition"
                                    >
                                        <img
                                            src={friend.Avatar}
                                            alt=""
                                            className={`w-12 h-12 rounded-full object-cover `}
                                        />
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-gray-800">
                                                {friend.Name}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-400">
                                                    {friend.Email}
                                                </p>
                                                <span className="text-xs">
                                                    {presence[friend.Email]?.online ? (
                                                        <span className="text-green-500">● Online</span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Last Seen{" "}
                                                            {presence[friend.Email]?.last_seen
                                                                ? new Date(presence[friend.Email].last_seen).toLocaleTimeString()
                                                            : "recently"}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {/* <div className="p-4 border-b bg-white space-y-3">
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
                </div> */}
                {/* <div className="bg-white border-b px-3 py-3 overflow-x-auto">
                    <div className="flex gap-3 w-max">

                    </div>
                </div>
                {chatStarted && selectedFriend && (
                    <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                        <img
                            src={selectedFriend.Avatar}
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <p className="font-medium text-sm">{selectedFriend.Name}</p>
                            <p className="text-xs text-gray-400">{selectedFriend.Email}</p>
                        </div>
                    </div>
                )} */}
                {!showList && (
                    <>
                        <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
                            <button
                                onClick={goBackToList}
                                className="text-xl font-bold text-purple-600"
                            >
                                ←
                            </button>
                            <img
                                src={selectedFriend?.Avatar}
                                alt=""
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="font-medium text-sm">
                                    {selectedFriend?.Name}
                                </p>
                                <p className="text-xs">
                                    {presence[selectedFriend?.Email]?.online ? (
                                        <span className="text-green-500">Online</span>
                                    ) : (
                                        <span className="text-gray-400">
                                            Last Seen{" "}
                                            {presence[selectedFriend?.Email]?.last_seen
                                                ? new Date(presence[selectedFriend?.Email].last_seen).toLocaleTimeString()
                                                : "recently"
                                            }
                                        </span>
                                    )}
                                    {/* {selectedFriend?.Email} */}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {loading ? (
                                <Loading text="Loading Chat ..." />
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm">
                                    No Messages Yet
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.SenderID === user?.ID || msg.from === user?.Email
                                    // const isLastMessage = index === messages.length - 1
                                    const lastMsg = messages.at(-1)
                                    const isLastMessage = msg.ID === lastMsg?.ID
                                    return (
                                        <React.Fragment key={msg.ID}>
                                            <div
                                                // key={msg.ID}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    onMouseDown={() => isMe && startPress(msg)}
                                                    onMouseUp={cancelPress}
                                                    onMouseLeave={cancelPress}
                                                    onTouchStart={() => isMe && startPress(msg)}
                                                    onTouchEnd={cancelPress}
                                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow wrap-break-word ${isMe
                                                        ? "bg-purple-600 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 rounded-bl-md"
                                                        }`}
                                                >
                                                    {msg.Content ? (
                                                        <p>{msg.Content}</p>
                                                    ) : (
                                                        <p className="italic opacity-70">Message deleted</p>
                                                    )}
                                                    {msg.IsEdited && msg.Content && (
                                                        <p className="text-[10px] opacity-70 mt-1">(edited)</p>
                                                    )}
                                                    {msg.ImageURL && (
                                                        <img
                                                            src={msg.ImageURL}
                                                            alt="send"
                                                            className="mt-2 rounded-lg max-w-full"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            {isMe && isLastMessage && msg.IsRead && (
                                                <div className="text-right text-[11px] text-gray-400 mt-1">
                                                    Seen ✓
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )
                                })
                            )}
                            {typing && (
                                <p className="text-xs text-gray-400 italic">
                                    Typing
                                </p>
                            )}
                            <div ref={bottomRef}></div>
                        </div>
                        <div className="p-3 border-t bg-white space-y-2">
                            {image && (
                                <div className="px-2 text-xs text-gray-600 flex items-center justify-between gap-2">
                                    <span>{image.name}</span>
                                    <button
                                        onClick={() => {
                                            setImage(null)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = ""
                                            }
                                        }}
                                        className="text-red-500"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    id="chat-image-upload"
                                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                                />
                                <label
                                    htmlFor="chat-image-upload"
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Add Image
                                </label>
                            </div>
                            <div className="flex gap-0.5">
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
                                    disabled={!message.trim() && !image}
                                    className={`text-white px-5 rounded-xl ${message.trim() || image
                                        ? "bg-purple-600"
                                        : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    Send
                                </button>
                            </div>

                        </div>

                    </>
                )}
            </div>
            {showActions && (
                <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50">
                    <div className="bg-white w-full max-w-sm rounded-t-2xl p-4 space-y-3">
                        <button
                            onClick={openEdit}
                            className="w-full py-3 rounded-xl bg-gray-100"
                        >
                            Edit Message
                        </button>
                        <button
                            onClick={deleteMessage}
                            className="w-full py-3 rounded-xl bg-red-500 text-white"
                        >
                            Delete Message
                        </button>
                        <button
                            onClick={() => setShowActions(false)}
                            className="w-full py-3 rounded-xl bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {editingId && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-2xl w-[90%] max-w-sm sapce-y-3">
                        <h2 className="font-semibold">Edit Message</h2>
                        <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full border px-3 py-2 rounded-xl"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={saveEdit}
                                className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-xl"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 bg-red-600 text-white py-2 rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>

    )
}

export default Chat