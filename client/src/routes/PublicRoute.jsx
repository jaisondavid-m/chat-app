import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Loading from "../Components/Loading.jsx"

export default function PublicRoute({ children }) {

    const { user , loading } = useAuth()

    if (loading) {
        return (
            <Loading/>
            // <div className="h-screen flex items-center justify-center">
            //     Loading ...
            // </div>
        )
    }

    if(user) {
        return <Navigate to="/chat" replace />
    }

    return children

}