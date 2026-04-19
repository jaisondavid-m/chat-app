import React from 'react'
import { BrowserRouter , Routes , Route , Navigate } from "react-router-dom"
import Login from "../Pages/Login.jsx"
import Home from '../Pages/Home.jsx'
import ProtectedRoute from '../routes/ProtectedRoute.jsx'
import PublicRoute from '../routes/PublicRoute.jsx'
import NotFound from "../Pages/NotFound.jsx"

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to="/home"/>} />
          <Route path='/login' element={<PublicRoute><Login/></PublicRoute>} />
          <Route path='home' element={<ProtectedRoute><Home/></ProtectedRoute>} />
          <Route path='*' element={<NotFound/>} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
