import axios from "axios"

const api = axios.create({
    baseURL: "https://chat-app-8x7a.onrender.com/api",
    withCredentials: true,
})

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;
//         if (originalRequest?.url?.includes("/auth/refresh")) {
//             return Promise.reject(error)
//         }
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true
//             try {
//                 await api.post(
//                     "/auth/refresh",
//                     {},
//                     {withCredentials: true}
//                 )
//                 return api(originalRequest)
//             } catch (err) {
//                 window.location.href = "/login"
//             }
//         }
//         return Promise.reject(error)
//     }
// )

export default api