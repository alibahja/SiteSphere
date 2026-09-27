import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import PromptInput from '../components/PromptInput'
import { homeTags } from "../assets/assets"
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ClockIcon, TrashIcon } from 'lucide-react'
import moment from 'moment'

const Home = () => {
  const {
    user, projects, loadingProjects, generatingProject,
    loadProjects, handleGenerate, handleDelete, logout
  } = useAppContext()
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className='relative min-h-screen overflow-x-hidden'>
      {/* Background image */}
      <div className='fixed inset-0 -z-10 bg-[url("/bg-img.png")] bg-cover bg-center bg-no-repeat' />
      {/* Scrim for legibility */}
      <div className='fixed inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/60 to-black/80' />

      {/* Nav */}
      <nav className='sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-md'>
        <div className='flex items-center justify-between max-w-6xl px-6 py-3.5 mx-auto'>
          <div className='flex items-center gap-2.5'>
            <img src="/favicon1.svg" alt="SiteSphere" className='size-6' />
            <span className='text-base font-semibold tracking-tight text-white'>
              SiteSphere
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='hidden text-sm text-white/70 sm:block'>
              {user?.name}
            </span>
            <div className='w-px h-5 mx-1 bg-white/15' />
            <button
              onClick={logout}
              className='px-3 py-1.5 text-sm font-medium text-white/80 transition rounded-md hover:text-white hover:bg-white/10'
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className='px-6 pt-20 pb-24 mx-auto max-w-5xl sm:pt-28'>
        <div className='flex flex-col items-center text-center'>
          {/* Promo badge */}
          <div className='inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs rounded-full bg-white/10 border border-white/15 backdrop-blur-sm'>
            <span className='px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-amber-400 text-amber-950'>
              PROMO
            </span>
            <span className='pr-2 text-white/85'>
              Create your first project for free
            </span>
          </div>

          {/* Title */}
          <h1 className='text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl'>
            Let's build your app together
          </h1>
          <p className='max-w-xl mt-6 text-base leading-relaxed text-white/70 sm:text-lg'>
            Describe your idea and watch AI design, structure, and launch your
            website — instantly. No coding required.
          </p>

          {/* Prompt input */}
          <div className='w-full max-w-2xl mt-10'>
            <PromptInput
              onSubmit={handleGenerate}
              loading={generatingProject}
              placeholder='Create a portfolio website'
              variant='glass'
              autoFocus
            />
          </div>

          {/* Suggestion tags */}
          <div className='flex flex-wrap items-center justify-center max-w-3xl gap-2 mt-8'>
            {homeTags.map((tag, i) => (
              <button
                key={i}
                onClick={() => handleGenerate(tag)}
                disabled={generatingProject}
                className='px-3.5 py-1.5 text-sm text-white/75 transition rounded-full border border-white/15 bg-white/5 hover:text-white hover:bg-white/10 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* All projects */}
        {!loadingProjects && projects.length > 0 && (
          <div className='mt-24'>
            <div className='flex items-baseline justify-between mb-5'>
              <h2 className='text-sm font-semibold tracking-wide uppercase text-white/60'>
                Your projects
              </h2>
              <span className='text-xs text-white/40'>
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              {projects.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/builder/${p._id}`)}
                  className='group flex items-center justify-between p-4 transition rounded-xl cursor-pointer bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20'
                >
                  <div className='min-w-0'>
                    <p className='font-medium truncate text-white'>{p.name}</p>
                    <div className='flex items-center gap-3 mt-1.5 text-xs text-white/50'>
                      <span className='inline-flex items-center gap-1'>
                        <ClockIcon size={12} />
                        {moment(p.updatedAt || p.createdAt).fromNow()}
                      </span>
                      <span className='px-1.5 py-0.5 rounded border border-white/10 text-white/60'>
                        v{p.version}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-1 shrink-0'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p._id);
                      }}
                      aria-label={`Delete ${p.name}`}
                      className='p-2 text-white/40 transition rounded-md hover:text-red-400 hover:bg-red-500/10'
                    >
                      <TrashIcon size={15} />
                    </button>
                    <ArrowRightIcon
                      size={16}
                      className='text-white/40 transition group-hover:text-white group-hover:translate-x-0.5'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className='border-t border-white/10'>
        <div className='max-w-6xl px-6 py-6 mx-auto text-xs text-center text-white/40'>
          © {new Date().getFullYear()} SiteSphere — Build, preview, publish.
        </div>
      </footer>
    </div>
  )
}

export default Home