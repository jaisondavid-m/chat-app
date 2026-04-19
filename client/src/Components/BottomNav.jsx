import { NavLink , useLocation } from "react-router-dom"
import { FaUser , FaUsers , FaCog  } from "react-icons/fa"
import { FaMessage } from "react-icons/fa6"

function BottomNav() {

    const location = useLocation()

    const tabs = [
        { path: "/chat" , label: "Chat" , icon: <FaMessage size={18}/> },
        { path: "/groups" , label: "Group" , icon: <FaUsers size={18}/> },
        { path: "/profile" , label: "Profile" , icon: <FaUser size={18} /> },
        { path: "/setting" , label: "Setting" , icon: <FaCog size={18}/> },
    ]

    const activeIndex = Math.max(tabs.findIndex(
        (tab) => tab.path === location.pathname
    ),0)

    return (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
            <div className="relative bg-white/30 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-black/10 flex justify-around items-center py-2 px-1">
                <div
                    className="absolute top-1 bottom-1 w-1/4 rounded-xl bg-white/50 backdrop-blur-2xl shadow-md transition-all duration-300 ease-in-out"
                    style={{
                        transform: `translateX${activeIndex * 100}%`
                    }}
                />
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `relative z-10 w-1/4 flex flex-col items-center text-xs transition-all duration-300 ${
                                isActive
                                    ? "text-purple-600 scale-110"
                                    : "text-gray-400"
                            }`
                        }
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </div>
            {/* <NavLink
                to="/chat"
                className={({ isActive }) =>
                    `flex flex-col items-center text-xs transition
                ${isActive ? "text-purple-600 scale-110" : "text-gray-600"}`
                }
            >
                <FaMessage size={18} />
                <span>Chat</span>
            </NavLink>
            <NavLink
                to="/groups"
                className={({ isActive }) => 
                    `flex flex-col items-center text-xs transition
                    ${isActive ? "text-purple-600 scale-110" : "text-gray-600"}`
                }
            >
                <FaUser size={18}/>
                <span>Groups</span>
            </NavLink>
            <NavLink
                to="/profile"
                className={({ isActive }) => 
                    `flex flex-col items-center text-xs transition
                    ${isActive ? "text-purple-600 scale-100" : "text-gray-600"}
                    `
                }
            >
                <FaUser size={18} />
                <span>Profile</span>
            </NavLink>
            <NavLink
                to="/setting"
                className={({ isActive }) =>
                    `flex flex-col items-center text-xs transition
                    ${isActive ? "text-purple-600 scale-100" : "text-gray-600"}
                `
                }
            >
                <FaCog size={18}/>
                <span>Setting</span>
            </NavLink> */}
        </div>      
    )
}

export default BottomNav