import BottomNav from "./BottomNav"

function MobileLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative">
                {children}
                <BottomNav/>
            </div>
        </div>
    )
}

export default MobileLayout