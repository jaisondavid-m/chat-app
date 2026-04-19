import React , { useEffect , useState } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"
import Loading from "../Components/Loading"

function Chat() {

    const { user } = useAuth()
    const [ email , setEmail ] = useState("")
    const [ message , setMessage ] = useState("")
    const [ messages , setMessages ] = useState([])
    const [ loading , setLoading ] = useState(false)
    const [ chatStarted , setChatStarted ] = useState(false)

    const loadMessages = async (targetEmail) => {
        try {
            const res = await api.get(`/auth/chat/message/${targetEmail}`)
            setMessages(res.data.messages || [])
        } catch (err) {
            setMessages([])
        }
    }

    const startChat = async () => {
        if (!email.trim()) return
        setChatStarted(true)
        setLoading(true)
        await loadMessages(email)
        setLoading(false)
    }

    const sendMessage = async () => {
        if (!message.trim()) return
        try {
            await api.post("/auth/chat/send",{
                email,
                content: message
            })
            setMessage("")
            await loadMessages(email)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        let interval
        if (chatStarted) {
            interval = setInterval(() => {
                loadMessages(email)
            }, 2000);
        }
        return () => clearInterval(interval)
    },[chatStarted,email])

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
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                    {!chatStarted ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Start Chat by entering email
                        </div>
                    ) : loading ? (
                        <Loading text="Loading Chat ..."/>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm">
                            No Messages Yet
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.SenderID === user?.ID
                            return (
                                <div
                                    key={msg.ID}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
                                            isMe
                                                ? "bg-purple-600 text-white rounded-br-md"
                                                : "bg-white text-gray-800 rounded-bl-md"
                                        }`}
                                    >
                                        {msg.Content}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
                {chatStarted && (
                    <div className="p-3 border-t bg-white flex gap-2">
                        <input
                            value={message}
                            onChange={(e)=>setMessage(e.target.value)}
                            placeholder="Type Message..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-purple-600 text-white px-5 rounded-xl"
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