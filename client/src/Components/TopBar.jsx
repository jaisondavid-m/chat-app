import { BsChatDotsFill } from "react-icons/bs"

function TopBar() {
    return (
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-purple-500 px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="text-purple-600 text-2xl">
                    <BsChatDotsFill/>
                </div>
                <h1 className="text-lg font-bold text-purple-600">
                    ChatApp
                </h1>
            </div>
        </div>
    )
}

export default TopBar