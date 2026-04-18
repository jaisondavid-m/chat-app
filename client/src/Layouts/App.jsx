import React from 'react'
import { BrowserRouter , Routes , Route , Navigate } from "react-router-dom"
import Login from "../Pages/Login.jsx"
import Home from '../Pages/Home.jsx'

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to="/login"/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='home' element={<Home/>} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
