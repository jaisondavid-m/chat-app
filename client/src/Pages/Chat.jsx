import React, { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { IoLocationSharp } from "react-icons/io5"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"
import Loading from "../Components/Loading"

function Chat() {
    const emojis = ["😂", "❤️", "🔥", "🥲", "😭", "🥰", "🥹", "🙏"]
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const pressTimer = useRef(null)
    const messageInputRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const [reactionMsg, setReactionMsg] = useState(null)
    const [showReactionModal, setShowReactionModal] = useState(false)
    const [showLocationDenied, setShowLocationDenied] = useState(false)
    const [showLocationConfirm, setShowLocationConfirm] = useState(false)
    const [unreadChats, setUnreadChats] = useState({})

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
                setUnreadChats((prev) => {
                    const updated = { ...prev }
                    delete updated[targetEmail]
                    return updated
                })
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

    const sendBrowserNotification = (title, body, icon = "") => {
        if (!("Notification" in window)) return
        if (Notification.permission === "granted") {
            const notification = new Notification(title, {
                body,
                icon: icon || "/icons.svg",
                badge: icon || "/icons.svg"
            })
            notification.onclick = () => {
                window.focus()
            }
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
        setUnreadChats((prev) => {
            const updated = { ...prev }
            delete updated[normalizedEmail]
            return updated
        })
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
                // loadMessages(normalizedEmail)
                if (showList || email !== data.from) {
                    sendBrowserNotification(
                        "New Message",
                        `${data.from} sent you a message`
                    )
                    setUnreadChats((prev) => ({
                        ...prev,
                        [data.from]: (prev[data.from] || 0) + 1
                    }))
                    
                } else {
                    // setUnreadChats((prev) => ({
                    //     ...prev,
                    //     [data.from]: (prev[data.from] || 0) + 1
                    // }))
                    loadMessages(normalizedEmail)
                }
            }
            if (data.type === "typing") {
                setTyping(true)
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current)
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

    const loadUnreadChats = async () => {
        try {
            const res = await api.get('/auth/messages/unread-counts')
            setUnreadChats(res.data.counts || {})
        } catch (err) {
            console.error(err)
        }
    }

    const renderMessageWithLinks = (text = "") => {

        const urlRegex = /(https:\/\/[^\s]+|www\.[^\s]+)/gi

        const parts = text.split(urlRegex)

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                const href = part.startsWith("http")
                    ? part
                    : `https://${part}`

                return (
                    <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click to open link"
                        className="text-white underline break-all"
                    >
                        {part}
                    </a>
                )
            }
            return <React.Fragment key={index}>{part}</React.Fragment>
        })

    }

    const reactToMessage = async (id, emoji) => {
        try {
            await api.put(`/auth/chat/message/react/${id}`, {
                emoji,
            })
            socket.current?.send(JSON.stringify({
                type: "message",
                to: email,
            }))
            loadMessages(email)
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
        loadUnreadChats()
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
        }, 1000);
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

    const shareLocation = () => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude

                await api.post("/auth/chat/send", {
                    email: email,
                    content: "",
                    image_url: "",
                    latitude: latitude,
                    longitude: longitude,
                    is_location: true,
                })
                socket.current?.send(
                    JSON.stringify({
                        type: "message",
                        from: user?.Email,
                        to: email,
                        is_location: true
                    })
                )
                loadMessages(email);
            },
            () => {
                // alert("Location permission denied")
                setShowLocationDenied(true)
            }
        )
    }

    useEffect(() => {
        const close = (e) => {
            if (e.key === "Escape") {
                setShowActions(false)
                setEditingId(null)
                setShowEmojiPicker(false)
                setShowReactionModal(false)
                setReactionMsg(null)
            }
        }
        window.addEventListener("keydown", close)
        return () => window.removeEventListener("keydown", close)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!showEmojiPicker) return
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [showEmojiPicker])

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission()
        }
    },[])

    const insertEmoji = (emoji) => {
        const input = messageInputRef.current

        if (!input) {
            setMessage((prev) => `${prev}${emoji}`)
            return
        }

        const start = input.selectionStart ?? message.length
        const end = input.selectionEnd ?? message.length
        const nextMessage = `${message.slice(0, start)}${emoji}${message.slice(end)}`

        setMessage(nextMessage)
        requestAnimationFrame(() => {
            const cursorPosition = start + emoji.length
            input.focus()
            input.setSelectionRange(cursorPosition, cursorPosition)
        })
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
                                                {unreadChats[friend.Email] > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span className="text-xs text-green-600 font-medium">
                                                            {/* New Message(s) */}
                                                            {unreadChats[friend.Email] > 99
                                                                ? "99+"
                                                                : unreadChats[friend.Email] >= 3
                                                                    ? "3+ New Messages"
                                                                    : `${unreadChats[friend.Email]} New Message`
                                                            }
                                                        </span>
                                                    </div>
                                                ) : (
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
                                                )}

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
                                                className={`flex relative group ${isMe ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    onDoubleClick={() => {
                                                        setReactionMsg(msg)
                                                        setShowReactionModal(true)
                                                    }}
                                                    onMouseDown={() => isMe && startPress(msg)}
                                                    onMouseUp={cancelPress}
                                                    onMouseLeave={cancelPress}
                                                    onTouchStart={() => isMe && startPress(msg)}
                                                    onTouchEnd={cancelPress}
                                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow break-word peer ${isMe
                                                        ? "bg-purple-600 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 rounded-bl-md"
                                                        }`}
                                                >
                                                    {msg.IsLocation ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${msg.Latitude},${msg.Longitude}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={`underline font-medium ${isMe ? "text-white" : "text-blue-600"
                                                                }`}
                                                        >
                                                            Shared Location
                                                        </a>
                                                    ) : (
                                                        <>
                                                            {msg.Content ? (
                                                                <p>{renderMessageWithLinks(msg.Content)}</p>
                                                            ) : (
                                                                <p className="italic opacity-70">Message Deleted</p>
                                                            )}
                                                            {msg.IsEdited && msg.Content && (
                                                                <p className="text-[10px] opacity-70 mt-1">(edited)</p>
                                                            )}
                                                            {msg.ImageURL && (
                                                                <img
                                                                    src={msg.ImageURL}
                                                                    alt="sent"
                                                                    className="mt-2 rounded-lg max-w-full"
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                    {/* {msg.Content ? (
                                                        <p>{renderMessageWithLinks(msg.Content)}</p>
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
                                                    {msg.Is_Location ? (
                                                        <a
                                                            href={`https://www.google.com/map?q=${msg.Latitude},${msg.Longitude}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="underline text-white"
                                                        >
                                                            Share Location
                                                        </a>
                                                    ) : 
                                                        msg.Content ? (
                                                            <p>{renderMessageWithLinks(msg.Content)}</p>
                                                        ) : (
                                                        <p className="italic opacity-75">Message Deleted</p>
                                                    )}
                                                    {msg.IsEdited && msg.Content && (
                                                        <p className="text-[10px] opacity-70 mt-1">(edited)</p>
                                                    )}
                                                    {msg.ImageURL && (
                                                        <img
                                                            src={msg.ImageURL}
                                                            alt="sent"
                                                            className="mt-2 rounded-lg max-w-full"
                                                        />
                                                    )} */}
                                                </div>
                                                {/* <div className={`opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto peer-hover:opacity-100 peer-hover:pointer-events-auto hover:opacity-100 hover:pointer-events-auto transition-all duration-150
                                                    flex gap-1 flex-wrap absolute -top-10 z-20 ${
                                                    isMe ? "right-0" : "left-0"
                                                } bg-white px-2 py-1 rounded-xl shadow`}>
                                                    {emojis.map((emo) => (
                                                        <button
                                                            key={emo}
                                                            onClick={() => reactToMessage(msg.ID, emo)}
                                                            className="text-sm hover:scale-125 transition"
                                                            title="React"
                                                        >
                                                            {emo}
                                                        </button>
                                                    ))}
                                                </div> */}
                                                {msg.Reaction && (
                                                    <div className={`absolute -bottom-3 text-sm bg-white px-2 rounded-full shadow ${isMe ? "right-2" : "left-2"
                                                        }`}>
                                                        {msg.Reaction}
                                                    </div>
                                                )}
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
                                <div>
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
                                <button
                                    // onClick={shareLocation}
                                    onClick={() => setShowLocationConfirm(true)}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-purple-600 text-xl"
                                >
                                    {/* 📍 */}
                                    <IoLocationSharp />
                                </button>
                            </div>
                            <div className="relative flex gap-0.5">
                                {/* <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                        className="h-full px-3 border border-gray-200 rounded-xl text-xl hover:bg-gray-50"
                                        title="Add emoji"
                                    >
                                        😀
                                    </button>
                                    {showEmojiPicker && (
                                        <div
                                            ref={emojiPickerRef}
                                            className="absolute bottom-14 left-0 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 grid grid-cols-4 gap-1 z-20"
                                        >
                                            {emojis.map((emo) => (
                                                <button
                                                    key={emo}
                                                    type="button"
                                                    onClick={() => insertEmoji(emo)}
                                                    className="text-xl p-1 rounded-lg hover:bg-gray-100"
                                                >
                                                    {emo}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div> */}
                                <input
                                    ref={messageInputRef}
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
                <div
                    className="fixed inset-0 bg-black/30 flex items-end justify-center z-50"
                    onClick={() => setShowActions(false)}
                >
                    <div className="bg-white w-full max-w-sm rounded-t-2xl p-4 space-y-3 animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={openEdit}
                            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition"
                        >
                            Edit Message
                        </button>
                        <button
                            onClick={deleteMessage}
                            className="w-full py-3 rounded-xl bg-red-500 text-white hover:opacity-90 active:scale-[0.98] transition"
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
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditingId(null)}>
                    <div className="bg-white flex flex-col gap-y-4 p-4 rounded-2xl w-[90%] max-w-sm space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
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
            {showReactionModal && reactionMsg && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-end justify-center z-50"
                    onClick={() => {
                        setShowReactionModal(false)
                        setReactionMsg(null)
                    }}
                >
                    <div className="bg-white w-full max-w-sm rounded-t-3xl p-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-center font-semibold mb-3">
                            React to Messagge
                        </h2>
                        <div className="grid grid-cols-4 gap-3">
                            {emojis.map((emo) => (
                                <button
                                    key={emo}
                                    onClick={() => {
                                        if (!reactionMsg?.ID) return
                                        reactToMessage(reactionMsg.ID, emo)
                                        setShowReactionModal(false)
                                        setReactionMsg(null)
                                    }}
                                    className="text-3xl p-2 rounded-xl hover:bg-gray-100 active:scale-95"
                                >
                                    {emo}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowReactionModal(false)
                                setReactionMsg(null)
                            }}
                            className="w-full mt-4 py-2 bg-gray-200 rounded-xl"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {showLocationDenied && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setShowLocationDenied(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            className="text-lg font-semibold text-red-500"
                        >
                            Location Access Denied
                        </h2>
                        <p className="text-sm text-gray-600">
                            Please allow location permission in your browser setting to share your location.
                        </p>
                        <button
                            onClick={() => setShowLocationDenied(false)}
                            className="w-full py-2 bg-purple-600 text-white rounded-xl"
                        >
                            Ok
                        </button>
                    </div>
                </div>
            )}
            {showLocationConfirm && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setShowLocationConfirm(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            className="text-lg font-semibold text-purple-600"
                        >
                            Share Location ?
                        </h2>
                        <p>
                            Are You Sure want to share your current Location with this User ?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowLocationConfirm(false)}
                                className="flex-1 py-2 bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowLocationConfirm(false)
                                    shareLocation()
                                }}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-xl"
                            >
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>

    )
}

export default Chat