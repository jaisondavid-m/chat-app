import BottomNav from "./BottomNav"
import TopBar from "./TopBar"

function MobileLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white h-screen shadow-xl relative overflow-hidden flex flex-col">
                <TopBar/>
                <main className="flex-1 min-h-0 overflow-y-auto pb-20 pt-2">
                    {children}
                </main>
                <BottomNav/>
            </div>
        </div>
    )
}

export default MobileLayout