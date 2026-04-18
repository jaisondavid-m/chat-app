import React from "react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"

function Home() {
    const { user , setUser } = useAuth()
    return (
        <div>
            <p>This is home page</p>
            <p>Hi {user?.Name}</p>
        </div>
    )
}

export default Home