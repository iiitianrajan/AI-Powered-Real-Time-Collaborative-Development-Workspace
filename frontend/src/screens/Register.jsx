import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()


    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/register', {
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
                <section className="order-2 hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-700 p-12 text-white lg:order-1 lg:flex">
                    <div className="flex items-center gap-3 text-lg font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><i className="ri-code-s-slash-line"></i></span> CollabCode</div>
                    <div><p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">Start creating</p><h1 className="max-w-md text-5xl font-semibold tracking-tight">From a prompt to a runnable project, together.</h1></div>
                    <p className="text-sm text-violet-100">Create projects · Invite collaborators · Run in the browser</p>
                </section>
                <section className="order-1 flex items-center justify-center p-7 sm:p-12 lg:order-2">
                  <div className="w-full max-w-sm">
                    <div className="mb-9"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-indigo-600 text-xl text-white lg:hidden"><i className="ri-code-s-slash-line"></i></div><p className="mb-2 text-sm font-medium text-indigo-600">CREATE ACCOUNT</p><h2 className="text-3xl font-bold tracking-tight text-slate-950">Build your next idea</h2><p className="mt-2 text-sm leading-6 text-slate-500">Set up your workspace and start collaborating in minutes.</p></div>
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
                        Create account <i className="ri-arrow-right-line ml-1"></i>
                    </button>
                </form>
                <p className="mt-7 text-center text-sm text-slate-500">
                    Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
                </p>
                  </div>
                </section>
            </div>
        </main>
    )
}

export default Register
