import React from 'react'
import {Route,BrowserRouter,Routes} from 'react-router-dom'
import Login from '../screens/Login'
import Home from '../screens/Home'
import Register from '../screens/Register'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

export default function AppRoutes() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<UserAuth><Home/></UserAuth>}></Route>
            <Route path='/login' element={<Login/>}></Route>
            <Route path='/register' element={<Register/>}></Route>
            <Route path='/project' element={<UserAuth><Project/></UserAuth>}></Route>
        </Routes>
    </BrowserRouter>
  )
}
