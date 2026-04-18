import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import api from "../api/axios.js"

function Login() {
    
    const [ loading , setLoading ] = useState(false)
    const [ error , setError ] = useState("")

    const handleSuccess = async (credentailResponse) => {

        setLoading(true)
        setError("")

        try {
            const token = credentailResponse.credential
            const res = await api.post("/auth/google" , {
                token
            })
            const message = res.data?.message
            window.location.href = "/home"
        } catch (err) {
            setError(
                err.response?.data?.message || "Login Failed , Please Try Again"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleError = () => {
        setError("Google Authentication Failed")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to =-br from-white to-purple-50">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-purple-100">
                <h1 className="text-3xl font-bold text-center text-purple-600" >ChatApp</h1>
                <p className="text-center text-gray-500 mt-2">Sign in with Google to Continue</p>
                {error && (
                    <div className="mt-4 text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg border border-red-200">
                        { error }
                    </div>
                )}
                {loading && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Authenticating...
                    </div>
                )}
                <div className="mt-8 flex justify-center">
                    <div className={loading ? "opacity-50 pointer-events-none" : ""}>
                        <GoogleLogin 
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    </div>
                </div>
                <p className="text-xs text-center text-gray-400 mt-6">
                    Secure Authentication powered by Google OAuth
                </p>
            </div>
        </div>
    )

}

export default Login