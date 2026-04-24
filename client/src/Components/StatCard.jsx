import React from "react"

function StatCard({ title , value }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-purple-600">
                {value}
            </p>
        </div>
    )
}

export default StatCard