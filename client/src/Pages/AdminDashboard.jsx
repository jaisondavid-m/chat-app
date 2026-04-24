import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import api from "../api/axios.js"
import MobileLayout from "../Components/MobileLayout.jsx"
import Loading from "../Components/Loading.jsx"
import StatCard from "../Components/StatCard.jsx"

function AdminDashboard() {

    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        total_groups: 0,
        active_groups: 0,
    })
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showModal, setShowModal] = useState(false)

    const openModal = (user) => {
        setSelectedUser(user)
        setShowModal(true)
    }

    const chartData = stats ? [
        { name: "Users", total: stats.total_users },
        { name: "Active Users", total: stats.active_users },
        { name: "Groups", total: stats.total_groups },
        { name: "Active Groups", total: stats.active_groups }
    ] : []

    const loadData = async () => {
        try {
            const [statsRes, userRes] = await Promise.all([
                api.get("/auth/admin/stats"),
                api.get("/auth/admin/users")
            ])

            setStats(statsRes.data)
            setUsers(userRes.data.users || [])
        } catch (err) {
            console.error(err)
            setStats({
                total_users: 0,
                active_users: 0,
                total_groups: 0,
                active_groups: 0,
            })
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const changeRole = async (userId, newRole) => {
        try {
            await api.put(`/auth/admin/user/role/${userId}`, {
                role: newRole,
            })
            setUsers(prev =>
                prev.map(u =>
                    u.ID === userId ? { ...u, role: newRole } : u
                )
            )
        } catch (err) {
            console.error(err)
            alert(err.response?.data?.message || "Failed to update role")
        }
    }

    const confirmRoleChange = async () => {

        if (!selectedUser) return

        const newRole = selectedUser.Role === "admin" ? "user" : "admin"

        await changeRole(selectedUser.ID,newRole)

        setShowModal(false)
        setSelectedUser(null)

    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <Loading text="Loading Admin Dashboard..." />
        )
    }

    return (
        <MobileLayout>
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-semibold mb-4">Platform Overview</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "10px",
                                border: "none",
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey="total"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>

            </div>

            <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Total Users" value={stats.total_users} />
                    <StatCard title="Active Users" value={stats.active_users} />
                    <StatCard title="Total Groups" value={stats.total_groups} />
                    <StatCard title="Active Groups" value={stats.active_groups} />
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                    <h2 className="font-semibold mb-3">Users</h2>
                    <div className="max-h-100 overflow-y-auto">
                        {users.map(user => (
                            <div key={user.ID} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition border mb-2">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.Avatar}
                                        className="w-11 h-11 rounded-full"
                                    />
                                    <div className="">
                                        <p className="font-semibold text-sm">{user.Name}</p>
                                        <p className="text-xs text-gray-400">
                                            {user.Email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`text-xs font-medium ${user.IsActive
                                            ? "text-green-500"
                                            : "text-red-500"
                                            }`}
                                    >
                                        {user.IsActive ? "Active" : "Disabled"}
                                    </span>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-medium ${user.Role === "admin"
                                            ? "bg-purple-100 text-purple-600"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {user.Role}
                                    </span>
                                    {user.Role !== "superadmin" && (
                                        <button
                                        onClick={() => openModal(user)}
                                            // onClick={() => {
                                            //     changeRole(
                                            //         user.ID,
                                            //         user.Role === "admin" ? "user" : "admin"
                                            //     )
                                            // }}
                                            className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                                                user.Role === "admin"
                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                    : "bg-green-100 text-green-600 hover:bg-green-200"
                                            }`}
                                        >
                                            {user.Role === "admin" ? "Demote" : "Promote"}
                                        </button>
                                    )}
                                </div>


                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-5 w-[90%] max-w-sm shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">
                            Confirm Action
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are You Sure Want to {" "}
                            <span className="font-semibold">
                                {selectedUser?.Role === "admin" ? "demote" : "promote"}
                            </span>
                            <br />
                            <span className="font-semibold text-black">
                                {selectedUser?.Name}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold">
                                {selectedUser?.Role === "admin" ? "User" : "Admin"}
                            </span>
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRoleChange}
                                className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MobileLayout>
    )
}
export default AdminDashboard