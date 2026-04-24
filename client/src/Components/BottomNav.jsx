import { NavLink, useLocation } from "react-router-dom"
import { FaUser, FaUsers, FaCog } from "react-icons/fa"
import { FaMessage, FaUserGroup, FaCircleInfo } from "react-icons/fa6"
import { useAuth } from "../context/AuthContext"

function BottomNav() {

    const location = useLocation()
    const { user } = useAuth()

    const tabs = [
        { path: "/chat", label: "Chat", icon: <FaMessage size={18} /> },
        { path: "/friends", label: "Friends", icon: <FaUserGroup size={18} /> },
        { path: "/groups", label: "Group", icon: <FaUsers size={18} /> },
        { path: "/profile", label: "Profile", icon: <FaUser size={18} /> },
        { path: "/about" , label: "About" , icon: <FaCircleInfo size={18}/>  },
        ...(user?.Role === "admin"
            ? [{ path: "/admin" , label: "Admin" , icon: <FaCog size={18}/> }]
            : []
        )
    ]

    const activeIndex = Math.max(tabs.findIndex(
        // (tab) => tab.path === location.pathname
        (tab) => location.pathname.startsWith(tab.path)
    ), 0)

    return (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-96 z-50">
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20  rounded-2xl shadow-lg shadow-purple-500/10 flex justify-around items-center py-2 px-2">
                <div
                    className="absolute top-1 bottom-1 rounded-xl bg-white/50 backdrop-blur-2xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0,0.36,1)]"
                    style={{
                        width: `${100 / tabs.length}%`,
                        transform: `translateX(${activeIndex * 100}%)`
                    }}
                />
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                    >
                        {({ isActive }) => (
                            <div
                                className={`relative z-10 w-1/4 flex flex-col items-center text-xs transition-all duration-300 ${isActive
                                    ? "text-purple-600 scale-110 font-semibold"
                                    : "text-gray-400"
                                    }`}
                            >
                                <span className={isActive ? "animate-[bounce_0.4s]" : ""}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                            </div>
                        )}
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