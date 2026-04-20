import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios.js"
import MobileLayout from "../Components/MobileLayout.jsx"
import Loading from "../Components/Loading.jsx"

function Friends() {

    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [friends, setFriends] = useState([])
    const [requests, setRequests] = useState([])
    const [blocked, setBlocked] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState("")
    const [activeTab, setActiveTab] = useState("friends")
    const [deleteFriend, setDeleteFriend] = useState(null)
    const [countdown, setCountdown] = useState(3)
    const [deleting, setDeleting] = useState(false)
    const [blockUserData, setBlockUserData] = useState(null)
    const [blockCountdown, setBlockCountdown] = useState(3)
    const [blocking, setBlocking] = useState(false)

    const loadData = async () => {
        try {
            setLoading(true)
            const [friendsRes, requestRes, blockRes] = await Promise.allSettled([
                api.get('/auth/friends'),
                api.get('/auth/friend/requests'),
                api.get('/auth/blocks'),
            ])
            setFriends(
                friendsRes.status === "fulfilled"
                    ? (friendsRes.value.data.friends || [])
                    : []
            )
            setRequests(
                requestRes.status === "fulfilled"
                    ? (requestRes.value.data.requests || [])
                    : []
            )
            setBlocked(
                blockRes.status === "fulfilled"
                    ? (blockRes.value.data.users || [])
                    : []
            )

            if (friendsRes.status === "rejected") {
                console.error("Failed to load friends", friendsRes.reason)
            }
            if (requestRes.status === "rejected") {
                console.error("Failed to load requests", requestRes.reason)
            }
            if (blockRes.status === "rejected") {
                console.error("Failed to load blocked users", blockRes.reason)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const sendRequest = async () => {
        if (!email.trim()) return
        try {
            setSending(true)
            setMessage("")
            const res = await api.post("/auth/friend/request", {
                email
            })
            setMessage(res.data.message)
            setEmail("")
            await loadData()
        } catch (err) {
            setMessage(
                err.response?.data?.message || "Failed to Send Request"
            )
        } finally {
            setSending(false)
        }
    }

    const acceptRequest = async (id) => {
        try {
            await api.post(`/auth/friend/accept/${id}`)
            await loadData()
        } catch (err) {
            console.error(err)
        }
    }

    const rejectRequest = async (id) => {
        try {
            await api.post(`/auth/friend/reject/${id}`)
            await loadData()
        } catch (err) {
            console.error(err)
        }
    }

    const blockUser = async (id) => {
        try {
            setBlocking(true)
            await api.post(`/auth/block/${id}`)
            await loadData()
            setMessage("User Blocked")
            setBlockUserData(null)
        } catch (err) {
            console.error(err)
        } finally {
            setBlocking(false)
        }
    }

    const confirmBlock = (user) => {
        setBlockUserData(user)
        setBlockCountdown(3)
    }


    const unblockUser = async (id) => {
        try {
            await api.delete(`/auth/unblock/${id}`)
            setMessage("User Unblocked")
            await loadData()
        } catch (err) {
            console.error(err)
        }
    }

    const openChat = (friendEmail) => {
        navigate(`/chat?email=${friendEmail}`)
    }

    const confirmDelete = (friend) => {
        setDeleteFriend(friend)
        setCountdown(3)
    }

    const removeFriend = async () => {
        if (!deleteFriend) return
        try {
            setDeleting(true)
            await api.delete(`/auth/friend/${deleteFriend.ID}`)
            setDeleteFriend(null)
            await loadData()
        } catch (err) {
            console.error(err)
        } finally {
            setDeleting(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!deleteFriend || countdown === 0) return

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1)
        }, 1000);
        return () => clearTimeout(timer)
    }, [deleteFriend, countdown])

    useEffect(() => {
        if(!blockUserData || blockCountdown === 0 ) return
        const timer = setTimeout(() => {
            setBlockCountdown((prev) => prev - 1)
        }, 1000);
        return () => clearTimeout(timer)
    },[blockUserData,blockCountdown])

    return (
        <MobileLayout>
            <div className="p-4 space-y-5">
                <div className="bg-white rounded-2xl p-1 shadow flex relative overflow-hidden">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(33.33%-4px)] rounded-xl bg-purple-600 transition-all duration-300 ease-in-out ${activeTab === "friends"
                            ? "left-1"
                            : activeTab === "requests"
                                ? "left-1/3"
                                : "left-2/3"
                            }`}
                    />
                    <button
                        onClick={() => setActiveTab("friends")}
                        className={`relative z-10 w-1/3 py-2 rounded-xl text-sm font-medium transition ${activeTab === "friends"
                            ? "bg-purple-600 text-white"
                            : "text-gray-500"
                            }`}
                    >
                        My Friends
                    </button>
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`relative z-10 w-1/3 py-2 rounded-xl text-sm font-medium transition ${activeTab === "requests"
                            ? "bg-purple-600 text-white"
                            : "text-gray-500"
                            }`}
                    >
                        Requests
                    </button>
                    <button
                        onClick={() => setActiveTab("blocked")}
                        className={`relative z-10 w-1/3 py-2 rounded-xl text-sm font-medium transition ${activeTab === "blocked"
                            ? "bg-purple-600 text-white"
                            : "text-gray-500"
                            }`}
                    >
                        Blocked
                    </button>
                </div>
                {activeTab === "requests" && (
                    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
                        <h2 className="text-lg font-semibold">Add Friend</h2>
                        <div className="flex gap-2">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-purple-500"
                            />
                            <button
                                onClick={sendRequest}
                                disabled={sending || !email.trim()}
                                className={`px-4 rounded-xl text-white ${email.trim()
                                    ? "bg-purple-600"
                                    : "bg-gray-300 cursor-not-allowed"
                                    }`}
                            >
                                {sending ? "..." : "Send"}
                            </button>
                        </div>
                        {message && (
                            <p className="text-sm text-gray-500">{message}</p>
                        )}
                    </div>
                )}

                {loading ? (
                    <Loading text="Loading..." />
                ) : (
                    <>
                        {activeTab === "requests" && (
                            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
                                <h2 className="text-lg font-semibold">Friend Requests</h2>
                                {requests.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No Pending Requests
                                    </p>
                                ) : (
                                    requests.map((req) => (
                                        <div
                                            key={req.ID}
                                            className="border rounded-xl p-3 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {req.sender?.Name || `User ID: ${req.SenderID}`}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {req.sender?.Email || "Wants to Connect"}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptRequest(req.ID)}
                                                    className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(req.ID)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => confirmBlock({
                                                        ID: req.SenderID,
                                                        Name: req.sender?.Name || "user"
                                                    })}
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm"
                                                >
                                                    Block
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {activeTab === "friends" && (
                            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
                                <h2 className="text-lg font-semibold">My Friends</h2>
                                {friends.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No Friends Yet
                                    </p>
                                ) : (
                                    friends.map((friend) => (
                                        <div key={friend.ID} className="border rounded-xl p-3 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={friend.Avatar}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium">
                                                        {friend.Name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {friend.Email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() =>
                                                        openChat(friend.Email)
                                                    }
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm"
                                                >
                                                    Chat
                                                </button>
                                                <button
                                                    onClick={() => confirmBlock(friend)}
                                                    className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm"
                                                >
                                                    Block
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(friend)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>

                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {activeTab === "blocked" && (
                            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
                                <h2 className="text-lg font-semibold">Blocked Users</h2>
                                {blocked.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No Blocked Users
                                    </p>
                                ) : (
                                    blocked.map((user) => (
                                        <div
                                            key={user.ID}
                                            className="border rounded-xl p-3 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.Avatar}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="">
                                                    <p className="font-medium">{user.Name}</p>
                                                    <p className="text-xs text-gray-400">{user.Email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => unblockUser(user.ID)}
                                                className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {deleteFriend && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm space-y-4 animate-in fade-in cursor-zoom-in">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Delete Friend
                        </h2>
                        <p className="text-sm text-gray-500">
                            Are you sure want to delete{" "}
                            <span className="font-semibold text-gray-700">
                                {deleteFriend.Name}
                            </span>
                            ?
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setDeleteFriend(null)}
                                className="w-1/2 border rounded-xl py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={removeFriend}
                                disabled={countdown > 0 || deleting}
                                className={`w-1/2 rounded-xl py-2 text-sm text-white ${countdown > 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-500"
                                    }`}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : countdown > 0
                                        ? `Delete (${countdown})`
                                        : "Delete"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {blockUserData && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Block User
                        </h2>
                        <p className="text-sm text-gray-500">
                            Are You sure want to block{" "}
                            <span className="font-semibold text-gray-700
                            ">
                                {blockUserData.Name}
                            </span>
                            ?
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setBlockUserData(null)}
                                className="w-1/2 border rounded-xl py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => blockUser(blockUserData.ID)}
                                disabled={blockCountdown > 0 || blocking}
                                className={`w-1/2 rounded-xl py-2 text-sm text-white ${
                                    blockCountdown > 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-yellow-500"
                                }`}
                            >
                                {blocking
                                    ? "Blocking..."
                                    : blockCountdown > 0
                                    ? `Block (${blockCountdown})`
                                    : "Block"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>
    )

}

export default Friends