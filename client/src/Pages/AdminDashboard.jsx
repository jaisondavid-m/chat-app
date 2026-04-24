import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import api from "../api/axios.js"
import MobileLayout from "../Components/MobileLayout.jsx"
import Loading from "../Components/Loading.jsx"
import StatCard from "../Components/StatCard.jsx"

function AdminDashboard() {

    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

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
        } finally {
            setLoading(false)
        }
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
                            <div key={user.ID} className="flex items-center gap-3 py-2 border-b">
                                <img
                                    src={user.Avatar}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{user.Name}</p>
                                    <p className="text-xs text-gray-400">
                                        {user.Email}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${user.Role === "admin"
                                        ? "bg-purple-100 text-purple-600"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {user.Role}
                                </span>
                                <span
                                    className={`text-xs ${user.IsActive
                                        ? "text-green-500"
                                        : "text-red-500"
                                        }`}
                                >
                                    {user.IsActive ? "Active" : "Disabled"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MobileLayout>
    )

}

export default AdminDashboard