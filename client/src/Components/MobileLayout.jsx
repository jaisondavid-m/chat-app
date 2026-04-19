import BottomNav from "./BottomNav"
import TopBar from "./TopBar"

function MobileLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative overflow-hidden">
                <TopBar/>
                <main className="pb-20 pt-2">
                    {children}
                </main>
                <BottomNav/>
            </div>
        </div>
    )
}

export default MobileLayout