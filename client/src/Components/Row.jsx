import React from "react"

function Row({ icon , color , title , desc , last }) {
    return (
        <div className={`flex items-start gap-3 px-4 py-3 ${!last ? "border-b border-gray-100" : ""}`}>
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-base shrink-0 mt-0.5`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

export default Row