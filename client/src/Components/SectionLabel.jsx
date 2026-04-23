import React from "react"

function SectionLabel({ label }) {
    return (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-5 mb-2 px-1">
            {label}
        </p>
    )
}

export default SectionLabel