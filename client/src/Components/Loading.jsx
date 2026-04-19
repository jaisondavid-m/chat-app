import { FaSpinner } from "react-icons/fa"

function Loading({ text = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-purple-600 text-2xl"/>
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    )
}

export default Loading