import React from 'react'
import toast from "react-hot-toast"
import { XIcon, GlobeIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'

const PublishModel = ({ publishUrl, onClose }) => {
  const handleCopyLink = () => {
    if (!publishUrl) return;
    navigator.clipboard.writeText(publishUrl);
    toast.success("Public link copied to clipboard!")
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm'>
      <div className='relative w-full max-w-md p-6 bg-white border shadow-xl rounded-2xl border-zinc-200'>
        <button
          onClick={onClose}
          aria-label="Close"
          className='absolute flex items-center justify-center transition rounded-md top-3 right-3 size-7 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
        >
          <XIcon size={16} />
        </button>

        <div className='flex items-start gap-3 mb-5'>
          <div className='flex items-center justify-center rounded-lg size-9 bg-emerald-50 text-emerald-600 shrink-0'>
            <GlobeIcon size={18} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-zinc-900'>
              Your website is live
            </h3>
            <p className='mt-0.5 text-xs text-zinc-500'>
              Anyone with the link below can view your published site.
            </p>
          </div>
        </div>

        <div className='mb-4'>
          <label className='block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>
            Published link
          </label>
          <input
            type="text"
            readOnly
            value={publishUrl}
            onFocus={(e) => e.target.select()}
            className='w-full px-3 py-2 font-mono text-xs border rounded-lg bg-zinc-50 border-zinc-200 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10'
          />
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={handleCopyLink}
            className='flex items-center justify-center flex-1 gap-1.5 px-3 py-2 text-xs font-medium transition bg-white border rounded-lg text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          >
            <CopyIcon size={14} /> Copy link
          </button>
          <button
            onClick={() => window.open(publishUrl, '_blank')}
            className='flex items-center justify-center flex-1 gap-1.5 px-3 py-2 text-xs font-medium text-white transition rounded-lg bg-zinc-900 hover:bg-zinc-800'
          >
            <ExternalLinkIcon size={14} /> Open site
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublishModel