import React from 'react'
import { BrowserRouter , Routes , Route , Navigate } from "react-router-dom"
import Login from "../Pages/Login.jsx"
import Chat from '../Pages/Chat.jsx'
import Groups from '../Pages/Groups.jsx'
import Profile from '../Pages/Profile.jsx'
import Setting from '../Pages/Setting.jsx'
import ProtectedRoute from '../routes/ProtectedRoute.jsx'
import PublicRoute from '../routes/PublicRoute.jsx'
import NotFound from "../Pages/NotFound.jsx"
import Friends from '../Pages/Friends.jsx'

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to="/chat"/>} />
          <Route path='/login' element={<PublicRoute><Login/></PublicRoute>} />
          <Route path='chat' element={<ProtectedRoute><Chat/></ProtectedRoute>} />
          <Route path='/groups' element={<ProtectedRoute><Groups/></ProtectedRoute>}/>
          <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
          <Route path='/setting' element={<ProtectedRoute><Setting/></ProtectedRoute>}/>
          <Route path='/friends' element={<ProtectedRoute><Friends/></ProtectedRoute>}/>
          <Route path='*' element={<NotFound/>} />
        </Routes>
    </BrowserRouter>
  )
}

export default App
