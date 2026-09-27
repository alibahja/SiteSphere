import React, { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CloudUploadIcon, Loader2Icon, MicIcon } from 'lucide-react'

const PromptInput = ({
  onSubmit,
  loading = false,
  placeholder = "Describe the website you want to build...",
  large = false,
  autoFocus = false,
  variant = "default"
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit()
    }
  }

  if (variant === "glass") {
  return (
    <form
      onSubmit={handleSubmit}
      className='p-3 transition bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl shadow-black/40 focus-within:border-white/30 focus-within:bg-white/15'
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        rows={3}
        className='w-full px-2 pt-2 text-base bg-transparent resize-none text-white placeholder:text-white/40 focus:outline-none'
      />

      <div className='flex items-center justify-between px-1 pt-3 mt-1 border-t border-white/10'>
        <label
          htmlFor="file"
          className='p-2 transition rounded-lg cursor-pointer text-white/60 hover:text-white hover:bg-white/10'
        >
          <input type="file" id='file' hidden />
          <CloudUploadIcon size={18} />
        </label>

        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            aria-label="Voice input"
            className='p-2 transition rounded-lg text-white/60 hover:text-white hover:bg-white/10'
          >
            <MicIcon size={18} />
          </button>
          <button
            type='submit'
            disabled={!value.trim() || loading}
            className='flex items-center justify-center text-black transition rounded-full size-9 bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed'
          >
            {loading
              ? <Loader2Icon size={18} className='animate-spin' />
              : <ArrowRightIcon size={18} />}
          </button>
        </div>
      </div>
    </form>
  )
}
}

export default PromptInput