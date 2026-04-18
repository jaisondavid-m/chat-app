import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function PublicRoute({ children }) {

    const { user , loading } = useAuth()

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Loading ...
            </div>
        )
    }

    if(user) {
        return <Navigate to="/home" replace />
    }

    return children

}