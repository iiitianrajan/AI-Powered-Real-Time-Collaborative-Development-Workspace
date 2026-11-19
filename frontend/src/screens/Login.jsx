import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import toast from 'react-hot-toast'

const Login = () => {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()

        axios.post('/users/login', { email, password })
            .then((res) => {
                console.log(res.data)
                localStorage.setItem('token', res.data.token)
                setUser(res.data.user)
                toast.success('Welcome back!')
                navigate('/')
            })
            .catch((err) => {
                console.log(err.response?.data || err)
                const errors = err.response?.data?.errors
                const message = Array.isArray(errors) ? errors[0]?.msg : errors || err.response?.data?.error || 'Unable to sign in. Please try again.'
                toast.error(message)
            })
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200"><i className="ri-code-s-slash-line"></i></div><div><h1 className="font-bold tracking-tight text-slate-950">CollabCode</h1><p className="text-xs text-slate-500">Collaborative workspace</p></div></div>
                    <span className="hidden text-sm font-medium text-slate-500 sm:block">Build together, from anywhere.</span>
                </div>
            </header>
            <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center justify-center px-5 py-12 sm:px-8">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Welcome back</p><h2 className="text-2xl font-bold tracking-tight text-slate-950">Sign in to your workspace</h2><p className="mt-2 text-sm leading-6 text-slate-500">Continue building with your projects and collaborators.</p></div>
                    <form onSubmit={submitHandler} className="space-y-5">
                        <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">Email address</label><input onChange={(e) => setEmail(e.target.value)} type="email" id="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" /></div>
                        <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">Password</label><input onChange={(e) => setPassword(e.target.value)} type="password" id="password" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Enter your password" /></div>
                        <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200">Sign in <i className="ri-arrow-right-line ml-1"></i></button>
                    </form>
                    <p className="mt-7 text-center text-sm text-slate-500">New to CollabCode? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link></p>
                </div>
            </section>
        </main>
    )
}

export default Login
