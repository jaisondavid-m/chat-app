import React, { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import api from "../api/axios.js"
import MobileLayout from "../Components/MobileLayout"
import Loading from "../Components/Loading.jsx"
import { IoLocationSharp } from "react-icons/io5"

function Groups() {

    const emojis = ["😁", "😂", "❤️", "🥲", "🥰", "🙏", "😭"]
    const { user } = useAuth()

    const [view, setView] = useState("list")
    const [groups, setGroups] = useState([])
    const [unreadCounts, setUnreadCounts] = useState({})
    const [activeGroup, setActiveGroup] = useState(null)
    const [members, setMembers] = useState([])
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [image, setImage] = useState(null)
    const [typing, setTyping] = useState(false)
    const [actionMsg, setActionMsg] = useState(null)
    const [showActions, setShowActions] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState("")
    const [reactionMsg, setReactionMsg] = useState(null)
    const [showReactionModal, setShowReactionModal] = useState(false)
    const [showLocationConfirm, setShowLocationConfirm] = useState(false)
    const [showLocationDenied, setShowLocationDenied] = useState(false)
    const [createName, setCreateName] = useState("")
    const [createDesc, setCreateDesc] = useState("")
    const [createEmails, setCreateEmails] = useState("")
    const [createError, setCreateError] = useState("")
    const [createLoading, setCreateLoading] = useState(false)
    const [showManage, setShowManage] = useState(false)
    const [addEmail, setAddEmail] = useState("")
    const [addError, setAddError] = useState("")
    const [newName, setNewName] = useState("")
    const [newDesc, setNewDesc] = useState("")
    const [newAvatar, setNewAvatar] = useState("")
    const [newAvatarFile, setNewAvatarFile] = useState(null)
    const [showEditGroup, setShowEditGroup] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [canDelete, setCanDelete] = useState(false)
    const socket = useRef(null)
    const bottomRef = useRef(null)
    const pressTimer = useRef(null)
    const typingTimeoutRef = useRef(null)
    const fileInputRef = useRef(null)
    const messageInputRef = useRef(null)

    const isAdmin = () => {
        if (!activeGroup || !user) return false
        return members.some(m => m.user_id === user.ID && m.role === "admin")
    }

    const loadGroups = async () => {
        try {
            const res = await api.get("/auth/groups")
            const list = res.data?.groups || res.data?.group || []
            setGroups(list)
            return list
        } catch (err) {
            console.error(err)
            return []
        }
    }

    const loadUnreadCounts = async (groupList) => {
        const list = groupList || groups
        const counts = {}
        await Promise.all(
            list.map(async (g) => {
                try {
                    const res = await api.get(`/auth/group/${g.ID}/unread`)
                    counts[g.ID] = res.data?.count || 0
                } catch { }
            })
        )
        setUnreadCounts(counts)
    }

    const loadGroupDetails = async (groupId) => {
        try {
            const res = await api.get(`/auth/group/${groupId}`)
            setMembers(res.data?.members || [])
        } catch (err) {
            console.error(err)
        }
    }

    const loadMessages = async (groupId) => {
        try {
            const res = await api.get(`/auth/group/${groupId}/messages`)
            setMessages(res.data?.messages || [])
            await api.put(`/auth/group/${groupId}/seen`)
            setUnreadCounts(prev => ({ ...prev, [groupId]: 0 }))
        } catch {
            setMessages([])
        }
    }

    const uploadImage = async (file) => {
        const formData = new FormData()
        formData.append("image", file)
        const res = await api.post("/auth/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return res.data.url
    }

    const openGroup = async (group) => {
        setActiveGroup(group)
        setView("chat")
        setLoading(true)

        if (socket.current) socket.current.close()

        socket.current = new WebSocket(
            `wss://chat-app-8x7a.onrender.com/api/auth/ws?email=${user?.Email}`
        )
        socket.current.onopen = async () => {
            await loadGroupDetails(group.ID)
            await loadMessages(group.ID)
            setLoading(false)
        }
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "group_message" && data.group_id === group.ID) {
                // loadMessages(group.ID)
                setMessages(prev => [...prev, data.message])
            }
            if (data.type === "typing" && data.group_id === group.ID) {
                setTyping(true)
                if (typingTimeoutRef.current)
                    clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false)
                }, 3000);
            }
        }
    }

    const updateGroup = async (avatarUrl = newAvatar) => {
        await api.put(`/auth/group/${activeGroup.ID}`, {
            name: newName,
            description: newDesc,
            avatar: avatarUrl,
        })
    }

    const deleteGroup = async () => {
        try {
            setDeleting(false)
            await api.delete(`/auth/group/${activeGroup.ID}`)
            setShowDeleteConfirm(false)
            goBackToList()
        } catch (err) {
            console.error(err)
        } finally {
            setDeleting(false)
        } 
    }

    const goBackToList = () => {
        socket.current?.close()
        setView("list")
        setActiveGroup(null)
        setMessages([])
        setMembers([])
        setMessage("")
        setTyping(false)
        loadGroups().then(loadUnreadCounts)
    }

    const sendMessage = async () => {
        if (!message.trim() && !image) return
        try {
            let imageUrl = ""

            if (image) imageUrl = await uploadImage(image)

            await api.post(`/auth/group/${activeGroup.ID}/messages`, {
                content: message,
                image_url: imageUrl,
            })

            socket.current?.send(JSON.stringify({
                type: "group_message",
                group_id: activeGroup.ID,
                from: user?.Email,
            }))
            setMessage("")
            setImage(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            await loadMessages(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const shareLocation = () => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                await api.post(`/auth/group/${activeGroup.ID}/messages`, {
                    content: "",
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    is_location: true,
                })
                socket.current?.send(JSON.stringify({
                    type: "group_message",
                    group_id: activeGroup.ID,
                    from: user?.Email,
                }))
                loadMessages(activeGroup.ID)
            },
            () => setShowLocationDenied(true)
        )
    }

    const sendTyping = () => {
        socket.current?.send(JSON.stringify({
            type: "typing",
            group_id: activeGroup.ID,
            from: user?.Email,
        }))
    }

    const debounceTyping = useRef(null)

    const openEdit = () => {
        setEditingId(actionMsg.ID)
        setEditText(actionMsg.Content)
        setShowActions(false)
    }

    const saveEdit = async () => {
        try {
            await api.put(`/auth/group/message/${editingId}`, { content: editText })
            socket.current?.send(JSON.stringify({ type: "group_message", group_id: activeGroup.ID }))
            setEditingId(null)
            setEditText("")
            loadMessages(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const deleteMessage = async () => {
        try {
            await api.delete(`/auth/group/message/${actionMsg.ID}`)
            socket.current?.send(JSON.stringify({ type: "group_message", group_id: activeGroup.ID }))
            setShowActions(false)
            loadMessages(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const reactToMessage = async (id, emoji) => {
        try {
            await api.put(`/auth/group/message/${id}/react`, { emoji })
            socket.current?.send(JSON.stringify({ type: "group_message", group_id: activeGroup.ID }))
            loadMessages(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreateGroup = async () => {
        if (!createName.trim()) {
            setCreateError("Group Name is Required")
            return
        }
        setCreateLoading(true)
        setCreateError("")
        try {
            const emails = createEmails.split(",").map(e => e.trim()).filter(Boolean)
            await api.post("/auth/group", {
                name: createName.trim(),
                description: createDesc.trim(),
                member_emails: emails,
            })
            setCreateName("")
            setCreateDesc("")
            setCreateEmails("")
            setView("list")
            await loadGroups()
        } catch (err) {
            setCreateError(err.response?.data?.message || "Faile to Create Group")
        } finally {
            setCreateLoading(false)
        }
    }

    const handleAddMember = async () => {
        if (!addEmail.trim()) return
        setAddError("")
        try {
            await api.post(`/auth/group/${activeGroup.ID}/member`, { email: addEmail.trim() })
            setAddEmail("")
            loadGroupDetails(activeGroup.ID)
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to add")
        }
    }

    const handleRemoveMember = async (userId) => {
        try {
            await api.delete(`/auth/group/${activeGroup.ID}/member/${userId}`)
            loadGroupDetails(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const handleChangeRole = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "member" : "admin"
        try {
            await api.put(`/auth/group/${activeGroup.ID}/member/${userId}/role`, { role: newRole })
            loadGroupDetails(activeGroup.ID)
        } catch (err) {
            console.error(err)
        }
    }

    const getSenderName = (senderId) => {
        if (senderId === user?.ID) return "You"
        const m = members.find(m => m.user_id === senderId)
        return m?.name || "Unkown"
    }

    const renderMessageWithLinks = (text = "") => {
        const urlRegex = /(https:\/\/[^\s]+)/gi
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                const href = part.startsWith("http") ? part : `https://${part}`
                return (
                    <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white underline break-all"
                    >
                        {part}
                    </a>
                )
            }
            return <React.Fragment key={i}>{part}</React.Fragment>
        })
    }

    const startPress = (msg) => {
        pressTimer.current = setTimeout(() => {
            setActionMsg(msg)
            setShowActions(true)
            setCanDelete(false)
            setTimeout(() => {
                setCanDelete(true)
            }, 3000);
        }, 700)
    }

    const cancelPress = () => clearTimeout(pressTimer.current)

    useEffect(() => {
        loadGroups()
    }, [])

    useEffect(() => {
        if (groups.length > 0) loadUnreadCounts(groups)
    }, [groups.length])

    useEffect(() => {
        return () => {
            socket.current?.close()
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        }
    }, [])

    useEffect(() => {
        const close = (e) => {
            if (e.key === "Escape") {
                setShowActions(false)
                setEditingId(null)
                setShowReactionModal(false)
                setReactionMsg(null)
                setShowManage(false)
            }
        }
        window.addEventListener("keydown", close)
        return () => window.removeEventListener("keydown", close)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <MobileLayout>
            <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
                {view === "list" && (
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="bg-white px-4 py-4 border-b flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-800">Groups</h1>
                            <button
                                onClick={() => setView("create")}
                                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-xl"
                            >
                                + New Group
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white">
                            {groups.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 py-20">
                                    <span className="text-4xl">👥</span>
                                    <p>No Groups Yet</p>
                                    <button
                                        onClick={() => setView("create")}
                                        className="mt-2 text-sm text-purple-600 underline"
                                    >
                                        Create Your first group
                                    </button>
                                </div>
                            ) : (
                                groups.map((group) => (
                                    <button
                                        key={group.ID}
                                        onClick={() => openGroup(group)}
                                        className="flex w-full px-4 py-3 items-center gap-3 border-b hover:bg-gray-50 transition rounded-xl mx-2 my-1 shadow-sm bg-white"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold   shadow">
                                            {group.Avatar
                                                ? <img src={group.Avatar} alt="" className="w-full h-full object-cover" />
                                                : group.Name?.[0]?.toUpperCase()
                                            }
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{group.Name}</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-400 truncate">{group.Description || "No Descriptoin"}</p>
                                                {unreadCounts[group.ID] > 0 && (
                                                    <span className="ml-2 shrink-0 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                                        {unreadCounts[group.ID] > 99 ? "99+" : unreadCounts[group.ID]}
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
                {view === "create" && (
                    <div classname="flex flex-col flex-1 min-h-0">
                        <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
                            <button
                                onClick={() => setView("list")}
                                className="text-xl font-bold text-purple-600"
                            >
                                ←
                            </button>
                            <h1 className="text-lg font-bold text-gray-800">New Group</h1>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white px-5 py-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Group Name</label>
                                <input
                                    value={createName}
                                    onChange={e => {
                                        setCreateName(e.target.value)
                                        setCreateError("")
                                    }}
                                    placeholder="e.g. MyFamily, Work Crew"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <input
                                    value={createDesc}
                                    onChange={e => setCreateDesc(e.target.value)}
                                    placeholder="Write shortly about your Group"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Invite Members</label>
                                <textarea
                                    value={createEmails}
                                    onChange={e => setCreateEmails(e.target.value)}
                                    placeholder="Comma-seperated emails: jaison7373@gmail.com,carlson@gmail.com"
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 resize-none"
                                />
                                <p className="text-xs text-gray-400">Only Friends With Account will be Added</p>
                            </div>
                            {createError && (
                                <p className="text-sm text-red-500">{createError}</p>
                            )}
                            <button
                                onClick={handleCreateGroup}
                                disabled={createLoading}
                                className={`w-full py-3 rounded-xl text-white font-medium ${createLoading ? "bg-gray-300" : "bg-gray-600"}`}
                            >
                                {createLoading ? "Creating..." : "Create Group"}
                            </button>
                        </div>
                    </div>
                )}
                {view === "chat" && activeGroup && (
                    <>
                        <div className="bg-white px-4 py-3 border-b flex items-center gap-3 shadow-sm">
                            <button
                                onClick={goBackToList}
                                className="text-xl font-bold text-purple-600"
                            >
                                ←
                            </button>
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600 shrink-0 overflow-hidden">
                                {activeGroup.Avatar
                                    ? <img src={activeGroup.Avatar} alt="" className="w-full h-full object-cover" />
                                    : activeGroup.Name?.[0]?.toUpperCase()
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs truncate text-gray-800">{activeGroup.Name}</p>
                                <p>
                                    {members.length} member{members.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            {isAdmin() && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowManage(true)}
                                        className="text-purple-600 text-sm font-medium"
                                    >
                                        Manage
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNewName(activeGroup.Name)
                                            setNewDesc(activeGroup.Description)
                                            setNewAvatar(activeGroup.Avatar || "")
                                            setNewAvatarFile(null)
                                            setShowEditGroup(true)
                                        }}
                                        className="text-blue-600 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="text-red-500 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>

                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {loading ? (
                                <Loading text="Loading Messages..." />
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-10">
                                    No Messages Yet . Say Hello to Start the Converstaion
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.SenderID === user?.ID
                                    return (
                                        <React.Fragment key={msg.ID}>
                                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                {isMe && (
                                                    <span className="text-xs text-purple-600 font-medium mb-0.5 ml-1">
                                                        {getSenderName(msg.SenderID)}
                                                    </span>
                                                )}
                                                <div className={`relative flex ${isMe ? "justify-end" : "justify-start"} w-full group`}>
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
                                                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-md break-words ${isMe ? "bg-purple-600 text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"
                                                            }`}
                                                    >
                                                        {msg.IsLocation ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${msg.Latitude},${msg.Longitude}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block"
                                                            >
                                                                <img
                                                                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${msg.Latitude},${msg.Longitude}&zoom=15&size=600x300&markers=${msg.Latitude},${msg.Longitude},red-pushpin`}
                                                                    alt="Shared location map"
                                                                    className="mt-1 rounded-xl w-full max-w-full object-cover"
                                                                />
                                                            </a>
                                                        ) : (
                                                            <>
                                                                {msg.Content ? (
                                                                    <p>{renderMessageWithLinks(msg.Content)}</p>
                                                                ) : msg.IsDeleted ? (
                                                                    <p className="italic opacity-70">Message Deleted</p>
                                                                ) : null}
                                                                {msg.IsEdited && msg.Content && (
                                                                    <p className="text-[10px] opacity-70 mt-1">(edited)</p>
                                                                )}
                                                                {msg.ImageURL && (
                                                                    <img src={msg.ImageURL} alt="sent" className="mt-2 rounded-lg max-w-full" />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {msg.Reaction && (
                                                        <div className={`absolute -bottom-3 text-sm bg-white px-2 rounded-full shadow ${isMe ? "right-2" : "left-2"}`}>
                                                            {msg.Reaction}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )
                                })
                            )}
                            {typing && (
                                <p className="text-xs text-gray-400 italic">Someone is typing...</p>
                            )}
                            <div ref={bottomRef} />
                        </div>
                        <div className="p-3 border-t bg-white space-y-2 shadow-inner">
                            {image && (
                                <div className="px-2 text-xs text-gray-600 flex items-center justify-between gap-2">
                                    <span>{image.name}</span>
                                    <button
                                        onClick={() => {
                                            setImage(null)
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = ""
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
                                    id="group-image-upload"
                                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                                />
                                <label
                                    htmlFor="group-image-upload"
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                                >
                                    Add Image
                                </label>
                                <button
                                    onClick={() => setShowLocationConfirm(true)}
                                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-purple-600 text-xl"
                                >
                                    <IoLocationSharp />
                                </button>
                            </div>
                            <div className="flex gap-0.5">
                                <input
                                    ref={messageInputRef}
                                    value={message}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                            sendMessage()
                                    }}
                                    onChange={(e) => {
                                        setMessage(e.target.value)
                                        // socket.current?.send(JSON.stringify({
                                        //     type: "typing",
                                        //     group_id: activeGroup.ID,
                                        //     from: user?.Email,
                                        // }))
                                        if (debounceTyping.current) clearTimeout(debounceTyping.current)
                                        debounceTyping.current = setTimeout(() => {
                                            sendTyping
                                        }, 500);
                                    }}
                                    placeholder="Type Message..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!message.trim() && !image}
                                    className={`text-white px-5 rounded-xl ${message.trim() || image ? "bg-purple-600" : "bg-gray-300 cursor-not-allowed"}`}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showActions && (
                <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50" onClick={() => setShowActions(false)}>
                    <div
                        className="bg-white w-full max-w-sm rounded-t-2xl p-4 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={openEdit}
                            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                        >
                            Edit Message
                        </button>
                        <button
                            onClick={deleteMessage}
                            className="w-full py-3 rounded-xl bg-red-500 text-white hover:opacity-90 transition"
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
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setEditingId(null)}
                >
                    <div
                        className="bg-white flex flex-col gap-y-4 p-4 rounded-2xl w-[90%] max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="font-semibold">Edit Message</h2>
                        <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full border px-3 py-1 rounded-xl"
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
                <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50" onClick={() => { setShowReactionModal(false); setReactionMsg(null) }}>
                    <div
                        className="bg-white w-full max-w-sm rounded-t-3xl p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-center font-semibold mb-3">React To Message</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {emojis.map((emo) => (
                                <button
                                    key={emo}
                                    onClick={() => {
                                        reactToMessage(reactionMsg.ID, emo)
                                        setShowReactionModal(false)
                                        setReactionMsg(null)
                                    }}
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
            {/* {showLocationConfirm && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setShowLocationConfirm(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-purple-600">Share Location ?</h2>
                        <p className="">Share Your Current Location With the group</p>
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
            )} */}
            {showLocationConfirm && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setShowLocationConfirm(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-purple-600">Share Locatoin</h2>
                        <p>Share Your current location with the group?</p>
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
            {showLocationDenied && (
                <div
                    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                    onClick={() => setShowLocationDenied(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-red-500">Location Access Denied</h2>
                        <p className="text-sm text-gray-600">Please Allow locatino permission in your browser settings.</p>
                        <button
                            onClick={() => setShowLocationDenied(false)}
                            className="w-full py-2 bg-purple-600 text-white rounded-xl"
                        >
                            Ok
                        </button>
                    </div>
                </div>
            )}
            {showManage && activeGroup && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
                    onClick={() => setShowManage(false)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-t-3xl p-4 max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-center font-semibold text-lg mb-3">Manage Group</h2>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={addEmail}
                                onChange={e => {
                                    setAddEmail(e.target.value)
                                    setAddError("")
                                }}
                                placeholder="Add By Email"
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                            />
                            <button
                                onClick={handleAddMember}
                                className="bg-purple-600 text-white px-4 rounded-xl text-sm"
                            >
                                Add
                            </button>
                        </div>
                        {addError && (
                            <p className="text-xs text-red-500 mb-2">{addError}</p>
                        )}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {members.map((m) => (
                                <div
                                    key={m.user_id}
                                    className="flex items-center gap-3 py-2 border-b"
                                >
                                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 shrink-0 overflow-hidden">
                                        {m.Avatar
                                            ? <img src={m.Avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                                            : m.name?.[0]?.toUpperCase()
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{m.name} {m.user_id === user?.ID && (
                                            <span className="text-gray-400">(You)</span>
                                        )}</p>
                                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-purple-100 text-gray-500"}`}>
                                        {m.role}
                                    </span>
                                    {m.user_id !== user?.ID && (
                                        <div
                                            className="flex gap-1"
                                        >
                                            <button
                                                onClick={() => handleChangeRole(m.user_id, m.role)}
                                                className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-100"
                                                title={m.role === "admin" ? "Demote to member" : "Promote to Admin"}
                                            >
                                                {m.role === "admin" ? "↓" : "↑"}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(m.user_id)}
                                                className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowManage(false)}
                            className="mt-4 w-full py-2 bg-gray-200 rounded-xl"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
            {showEditGroup && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setShowEditGroup(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-purple-600">Edit Group</h2>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full border px-3 py-2 rounded-xl"
                        />
                        <input
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            placeholder="Description"
                            className="w-full border px-3 py-2 rounded-xl"
                        />
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Group Avatar</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setNewAvatarFile(e.target.files?.[0] || null)}
                                className="w-full border px-3 py-2 rounded-xl"
                            />
                            {newAvatarFile && (
                                <p className="text-xs text-gray-500 truncate">{newAvatarFile.name}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowEditGroup(false)
                                    setNewAvatarFile(null)
                                }}
                                className="flex-1 py-2 bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    let avatarUrl = newAvatar
                                    if (newAvatarFile) {
                                        avatarUrl = await uploadImage(newAvatarFile)
                                    }
                                    await updateGroup(avatarUrl)
                                    setNewAvatarFile(null)
                                    setShowEditGroup(false)
                                    loadGroups()
                                }}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-xl"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-white w-[90%] max-w-sm rounded-2xl p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-red-500">
                            Delete Group
                        </h2>
                        <p className="text-sm text-gray-600">
                            Are You Sure Want to Delete This Group ? This cannot be undone.
                        </p>
                        {deleting && (
                            <p className="text-sm text-gray-500">
                                Deleting in 3 Seconds
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                disabled={deleting}
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleting}
                                onClick={deleteGroup}
                                className="flex-1 py-2 bg-red-500 text-white rounded-xl"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>
    )
}

export default Groups