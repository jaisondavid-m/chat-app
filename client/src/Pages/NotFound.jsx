import { Link } from "react-router-dom"
import { BsChatDotsFill } from "react-icons/bs"
import { FaHome } from "react-icons/fa"

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
            <div className="text-center bg-white shadow-2xl border border-purple-100 rounded-2xl p-10 max-w-md w-full">
                <div className="flex justify-center text-purple-600 text-5xl mb-4">
                    <BsChatDotsFill/>
                </div>
                <h1 className="text-6xl font-bold text-purple-600">404</h1>
                <h2 className="text-xl font-semibold mt-2 text-gray-800">Page Not Found</h2>
                <p className="text-gray-500 mt-2">
                    The Page You're looking for doesn't exist or was removed
                </p>
                <div className="mt-6">
                    <Link
                        to="/chat"
                        className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition"
                    >
                        <FaHome/>
                        Go Home
                    </Link>
                </div>
            </div>  
        </div>
    )
}

export default NotFound