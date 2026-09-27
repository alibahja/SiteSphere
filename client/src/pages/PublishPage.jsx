import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertCircleIcon } from 'lucide-react'
import api from '../api/api'
import Loading from '../components/Loading'
import FullPagePreview from '../components/FullPagePreview'

const PublishPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return;
    const fetchPublicProject = async () => {
      try {
        const { data } = await api.get(`/api/projects/public/${id}`)
        setProject(data)
      } catch (err) {
        console.error("Failed to load public project:", err);
        setError(
          err?.response?.data?.error ||
          "This website is not available or is not published yet."
        )
      } finally {
        setLoading(false)
      }
    }
    fetchPublicProject();
  }, [id])

  if (loading) return <Loading />

  if (error || !project) {
    return (
      <div className='flex items-center justify-center min-h-screen p-6 bg-zinc-50'>
        <div className='w-full max-w-md text-center'>
          <div className='flex items-center justify-center mx-auto mb-5 rounded-full size-12 bg-zinc-100 text-zinc-500'>
            <AlertCircleIcon size={22} />
          </div>

          <h1 className='text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl'>
            Website unavailable
          </h1>
          <p className='max-w-sm mx-auto mt-2 text-sm leading-relaxed text-zinc-500'>
            {error || "This website is not available or is not published yet."}
          </p>

          <Link
            to="/"
            className='inline-flex items-center gap-1.5 mt-6 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-zinc-900 hover:bg-zinc-800'
          >
            Go to SiteSphere
          </Link>

          <p className='mt-10 text-xs text-zinc-400'>
            © {new Date().getFullYear()} SiteSphere
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-screen h-screen overflow-hidden bg-white'>
      <FullPagePreview files={project.files} />
    </div>
  )
}

export default PublishPage