import React from 'react'

const LoginLeft = () => {
  return (
    <div className='relative flex flex-col justify-between w-full p-10 overflow-hidden text-white xl:p-14 bg-[url("/bg-img.png")] bg-cover bg-center'>
      {/* Dark overlay for text contrast */}
      <div className='absolute inset-0 bg-slate-950/55' />

      {/* Logo */}
      <div className='relative flex items-center gap-2.5'>
        <img src="/favicon1.svg" alt="SiteSphere logo" className='size-7' />
        <span className='text-lg font-semibold tracking-tight'>SiteSphere</span>
      </div>

      {/* Copy */}
      <div className='relative max-w-md'>
        <h2 className='text-3xl font-semibold leading-tight tracking-tight xl:text-4xl'>
          Build your presence on the web
        </h2>
        <p className='mt-5 text-sm leading-relaxed text-white/75 xl:text-base'>
          Describe what you need, preview instantly, and customize your site
          in real time — clean JSX, verified layouts, and instant code export.
        </p>
      </div>

      {/* Footer */}
      <p className='relative text-xs text-white/60'>
        © {new Date().getFullYear()} SiteSphere. All rights reserved.
      </p>
    </div>
  )
}

export default LoginLeft