import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import api from "../api/axios.js"
import { useAuth } from "../context/AuthContext.jsx"
import { useNavigate } from "react-router-dom"
import Loading from "../Components/Loading.jsx"
import { FaRobot } from "react-icons/fa"
import { BsChatDotsFill } from "react-icons/bs"
import { MdOutlineSecurity } from "react-icons/md"

function Login() {
    const { loadUser } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSuccess = async (credentailResponse) => {

        setLoading(true)
        setError("")

        try {
            const token = credentailResponse.credential
            await api.post("/auth/google", { token })
            await loadUser()
            navigate("/home")
        } catch (err) {
            setError(
                err.response?.data?.message || "Login Failed"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleError = () => {
        setError("Google Authentication Failed")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br via-white to-purple-50 px-4">
            <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-6 border border-purple-100">
                <div className="text-center">
                    <div className="flex justify-center text-purple-600 text-4xl">
                        <BsChatDotsFill />
                    </div>
                    <h1 className="text-3xl font-bold text-center text-purple-600" >ChatApp</h1>
                    <p className="mt-6 space-y-3">Welcome to Your real-time chat space</p>
                </div>
                <div className="mt-6 flex justify-center">
                    <div className={loading ? "opacity-50 pointer-events-none" : ""}>
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    </div>
                </div>
                <div className="mt-6 space-y-3">
                    {/* <div className="flex items-start gap-2">
                        <FaRobot className="text-purple-500 mt-1"/>
                        <div className="bg-purple-50 text-sm p-3 rounded-xl">
                           Authenticate to continue
                        </div>
                    </div>
                    <div className="flex items-start gap-2 justify-end">
                        <div className="bg-indigo-100 text-sm p-3 rounded-xl">
                            Okay, let's Go
                        </div>
                    </div> */}
                    <div className="mt-6 justify-center">
                        <div className="flex items-center text-center justify-center gap-2 bg-green-50 text-sm p-3 rounded-xl">
                            <MdOutlineSecurity className="text-green-500 mt-1" />
                            <span>We use Secure Google Authentication only.</span>
                        </div>
                    </div>
                </div>
                {/* <p className="text-center text-gray-500 mt-2">Sign in with Google to Continue</p> */}
                {error && (
                    <div className="mt-4 text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}
                {loading && (
                    <div className="mt-6">
                        {/* Signing you in ... */}
                        <Loading text="Signing You in"/>
                    </div>
                )}

                <p className="text-xs text-center text-gray-400 mt-6">
                    End-to-end Secure Authentication powered by Google OAuth
                </p>
            </div>
        </div>
    )

}

export default Login