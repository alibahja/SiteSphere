import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import Loading from '../components/Loading'
import FullPagePreview from '../components/FullPagePreview'

const Preview = () => {
  const { id } = useParams();
  const {
    activeProject: project,
    loadingActiveProject: loading,
    loadProject
  } = useAppContext();

  useEffect(() => {
    if (id) loadProject(id)
  }, [id, loadProject])

  if (loading || !project) {
    return <Loading />
  }

  return (
    <div className='w-screen h-screen overflow-hidden bg-white'>
      <FullPagePreview files={project.files} />
    </div>
  )
}

export default Preview