import React from "react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"

function Chat() {
    const { user, setUser } = useAuth()
    return (
        <MobileLayout>
            <div>
                <p>This is home page</p>
                <p>Hi {user?.Name}</p>
            </div>
        </MobileLayout>

    )
}

export default Chat