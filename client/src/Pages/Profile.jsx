import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import MobileLayout from "../Components/MobileLayout"

function Profile() {

    const { user, loadUser } = useAuth()
    const [name, setName] = useState(user?.Name || "")
    const [preview, setPreview] = useState(user?.Avatar)
    const [avatar, setAvatar] = useState(null)
    const [loading, setLoading] = useState(false)
    const [popup, setPopup] = useState("")
    const [editMode, setEditMode] = useState(false)

    const handleFile = (e) => {
        const file = e.target.files[0]
        setAvatar(file)
        // setPreview(file)
        setPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        setLoading(true)
        const formData = new FormData()
        formData.append("name", name)
        if (avatar) {
            formData.append("avatar", avatar)
        }
        try {
            await api.put("/auth/user/profile", formData)
            await loadUser()
            setPopup("Profile Updated!")
            setEditMode(false)
        } catch (err) {
            setPopup("Profile Update Failed")
            // setEditMode(false)
        } finally {
            setLoading(false)
            setTimeout(() => {
                setPopup("")
            }, 200);
        }
    }

    return (
        <MobileLayout>
            <div className="p-4 pb-24">
                <div className="bg-white rounded-3xl shadow-md border border-purple-100 p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <img
                            src={
                                preview
                                    ? preview.startsWith("http") || preview.startsWith("blob:")
                                        ? preview
                                        : `http://localhost:8000${preview}`
                                    : `https://via.placeholder.com/120`
                            }
                            className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-md"
                        />
                        {!editMode && (
                            <p className="mt-3 text-xs text-gray-400">
                                Tap Edit to Update Profile
                            </p>
                        )}
                    </div>
                    {!editMode ? (
                        <>
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase">Name</p>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{user?.Name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase">Role</p>
                                    <p className="text-sm text-gray-700 break-all mt-1 font-bold">{user?.Role}</p>
                                    {/* <div className="mt-2">
                                        <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full capitalize">
                                            {user.Role}
                                        </span>
                                    </div> */}
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase">Email</p>
                                    <p className="text-sm text-gray-700 break-all mt-1 font-bold">{user?.Email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditMode(true)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-2xl transition"
                            >
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-2">Profile Photo</label>
                                <label className="flex items-center justify-center gap-2 w-full cursor-pointer bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-medium py-3 rounded-2xl transition">
                                    📷
                                    <span>
                                        {avatar ? avatar.name : "Choose Photo"}
                                        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                                    </span>
                                </label>

                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Full Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-2 border border-gray-200 focus:border-purple-500 focus:ring-purple-200 outline-none p-3 rounded-xl" placeholder="Enter Your Name" />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-purple-600 hover:bg-purple-700  text-white py-3 rounded-2xl transition"
                                >
                                    {loading ? "Saving.." : "Save Changes"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false)
                                        setName(user?.Name || "")
                                        setPreview(user?.Avatar || "")
                                        setAvatar(null)
                                    }}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                    {popup && (
                        <div className="text-center text-sm bg-green-50 text-green-600 p-3 rounded-2xl">
                            {popup}
                        </div>
                    )}
                </div>
            </div>
        </MobileLayout>
    )
}

export default Profile