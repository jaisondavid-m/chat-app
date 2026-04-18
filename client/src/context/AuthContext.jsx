import { createContext , useContext , useEffect , useState } from "react"
import api from "../api/axios.js"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [ user , setUser ] = useState(null)
    const [ loading , setLoading ] = useState(true)
    const [ error , setError ] = useState(null)

    const loadUser = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get("/auth/me")
            setUser(res.data.user)
        } catch (err) {
            try {
                await api.post("/auth/refresh")
                const res = await api.get("/auth/me")
                setUser(res.data.user)
            } catch (refresherr) {
                setUser(null)
                setError("Session Expired")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUser()
    },[])

    return (
        <AuthContext.Provider value={{ user , setUser , loading , error , loadUser }}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)