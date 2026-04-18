import React from 'react'
import { BrowserRouter , Routes , Route , Navigate } from "react-router-dom"
import Login from "../Pages/Login.jsx"
import Home from '../Pages/Home.jsx'
import ProtectedRoute from '../routes/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to="/login"/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='home' element={<ProtectedRoute><Home/></ProtectedRoute>} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
