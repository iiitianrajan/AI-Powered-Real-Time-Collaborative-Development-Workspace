import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)

        }).catch(err => {
            console.log(err)
        })

    }, [])

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200"><i className="ri-code-s-slash-line"></i></div><div><h1 className="font-bold tracking-tight text-slate-950">CollabCode</h1><p className="text-xs text-slate-500">Collaborative workspace</p></div></div>
                    <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:block">{user?.email}</span><div className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{user?.email?.[0]?.toUpperCase() || "U"}</div></div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
                <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Your workspace</p><h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Projects that move ideas forward.</h2><p className="mt-3 max-w-xl text-slate-500">Create a project, invite your team, and turn a conversation into working code.</p></div><button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100"><i className="ri-add-line text-lg"></i>New project</button></div>

                {project.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600"><i className="ri-folder-add-line"></i></div><h3 className="text-lg font-semibold text-slate-900">Create your first project</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Bring collaborators and AI-assisted coding into one focused workspace.</p><button onClick={() => setIsModalOpen(true)} className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700">Create a project <i className="ri-arrow-right-line ml-1"></i></button></div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {project.map((project) => (
                            <button key={project._id} onClick={() => navigate(`/project`, { state: { project } })} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/70 focus:outline-none focus:ring-4 focus:ring-indigo-100">
                                <div className="mb-8 flex items-start justify-between"><div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-xl text-indigo-600"><i className="ri-folder-3-line"></i></div><i className="ri-arrow-right-up-line text-lg text-slate-300 transition group-hover:text-indigo-600"></i></div>
                                <h3 className="truncate text-lg font-semibold text-slate-900">{project.name}</h3><div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><i className="ri-team-line"></i>{project.users.length} collaborator{project.users.length !== 1 ? "s" : ""}</span></div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-sm font-semibold text-indigo-600">NEW WORKSPACE</p><h2 className="mt-1 text-xl font-bold text-slate-950">Create a project</h2></div><button type="button" onClick={() => setIsModalOpen(false)} className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"><i className="ri-close-line text-lg"></i></button></div><form onSubmit={createProject}><label className="mb-2 block text-sm font-semibold text-slate-700">Project name</label><input autoFocus onChange={(e) => setProjectName(e.target.value)} value={projectName || ""} placeholder="e.g. customer-dashboard" type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" required /><div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">Create project</button></div></form></div>
                </div>
            )}
        </main>
    )
}

export default Home
