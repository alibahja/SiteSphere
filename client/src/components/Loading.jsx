import { Loader2Icon } from 'lucide-react'

const Loading = () => {
  return (
    <div role="status" aria-label='Loading' className='flex items-center justify-center h-screen bg-white'>
      <Loader2Icon size={26} className='animate-spin text-zinc-900' />
    </div>
  )
}

export default Loading