import {
  ArrowLeftIcon, Code2Icon, DownloadIcon, ExternalLinkIcon,
  EyeIcon, GlobeIcon, Loader2Icon
} from 'lucide-react'
import React from 'react'

const BuilderHeader = ({
  projectName, version, showCode, publishing,
  onToggleShowCode, onOpenPreview, onPublish, onDownload, onBack, onLogout,
}) => {
  return (
    <header className='flex items-center justify-between h-14 px-4 border-b bg-white shrink-0 border-zinc-200'>
      {/* Left */}
      <div className='flex items-center min-w-0 gap-3'>
        <button
          onClick={onBack}
          aria-label="Back to home"
          className='flex items-center justify-center transition rounded-md size-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
        >
          <ArrowLeftIcon size={16} />
        </button>
        <img src="/logo.svg" alt="SiteSphere" className='size-5' />
        <div className='flex items-center min-w-0 gap-2'>
          <span className='text-sm font-medium truncate text-zinc-900'>
            {projectName}
          </span>
          <span className='px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 rounded bg-zinc-100 border border-zinc-200 shrink-0'>
            v{version}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className='flex items-center gap-1.5'>
        <button
          onClick={onToggleShowCode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition ${
            showCode
              ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          {showCode ? <><EyeIcon size={14} /> Preview</> : <><Code2Icon size={14} /> Code</>}
        </button>

        <button
          onClick={onOpenPreview}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 transition bg-white border rounded-md border-zinc-200 hover:bg-zinc-50'
        >
          <ExternalLinkIcon size={14} /> Open Preview
        </button>

        <button
          onClick={onPublish}
          disabled={publishing}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white transition rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed'
        >
          {publishing ? <Loader2Icon size={14} className='animate-spin' /> : <GlobeIcon size={14} />}
          Publish
        </button>

        <button
          onClick={onDownload}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 transition bg-white border rounded-md border-zinc-200 hover:bg-zinc-50'
        >
          <DownloadIcon size={14} /> Export
        </button>

        <div className='w-px h-5 mx-1 bg-zinc-200' />

        <button
          onClick={onLogout}
          className='px-3 py-1.5 text-xs font-medium transition rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default BuilderHeader