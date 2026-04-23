import React from "react"

function Card({ children }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 overflow-hidden">
            {children}
        </div>
    )
}

export default Card