import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {


    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            console.log(res.data)

            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)

            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }

    return (
        <main className="min-h-screen bg-slate-950 p-5 text-slate-900 sm:p-8">
            <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-indigo-950/30 lg:grid-cols-2">
                <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-950 p-12 text-white lg:flex">
                    <div className="flex items-center gap-3 text-lg font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><i className="ri-code-s-slash-line"></i></span> CollabCode</div>
                    <div><p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">Build together</p><h1 className="max-w-md text-5xl font-semibold tracking-tight">Your shared space for turning ideas into working software.</h1></div>
                    <p className="text-sm text-indigo-100">Realtime teamwork · AI-assisted generation · Browser preview</p>
                </section>
                <section className="flex items-center justify-center p-7 sm:p-12">
                  <div className="w-full max-w-sm">
                    <div className="mb-9"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-indigo-600 text-xl text-white lg:hidden"><i className="ri-code-s-slash-line"></i></div><p className="mb-2 text-sm font-medium text-indigo-600">WELCOME BACK</p><h2 className="text-3xl font-bold tracking-tight text-slate-950">Sign in to your workspace</h2><p className="mt-2 text-sm leading-6 text-slate-500">Continue building with your projects and collaborators.</p></div>
                <form
                    onSubmit={submitHandler}
                    className="space-y-5"
                >
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">Email address</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    >
                        Sign in <i className="ri-arrow-right-line ml-1"></i>
                    </button>
                </form>
                <p className="mt-7 text-center text-sm text-slate-500">
                    New to CollabCode? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create an account</Link>
                </p>
                  </div>
                </section>
            </div>
        </main>
    )
}

export default Login
