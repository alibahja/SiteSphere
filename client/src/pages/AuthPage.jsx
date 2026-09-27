import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import LoginLeft from '../components/LoginLeft'
import { useAppContext } from '../context/AppContext'

const AuthPage = ({ mode }) => {
  const { login, register } = useAppContext()
  const isLogin = mode === "login"
  const navigate = useNavigate()

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      navigate("/")
    } catch (err) {
      setError(
        err.message ||
        (isLogin ? "Invalid email or password." : "Registration failed.")
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen bg-slate-50'>
      {/* Left panel - Branding (desktop only) */}
      <div className='hidden lg:flex lg:w-1/2 xl:w-[55%]'>
        <LoginLeft />
      </div>

      {/* Right panel - Form */}
      <div className='flex items-center justify-center w-full px-6 py-12 lg:w-1/2 xl:w-[45%]'>
        <div className='w-full max-w-md'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl'>
              {isLogin ? "Sign in" : "Create an account"}
            </h1>
            <p className='mt-2 text-sm text-slate-500'>
              {isLogin
                ? "Enter your credentials to access your website builder."
                : "Get started by entering your registration details."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role='alert'
              className='px-4 py-3 mb-6 text-sm border rounded-lg bg-red-50 border-red-100 text-red-700'
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-5'>
            {!isLogin && (
              <div>
                <label
                  htmlFor='name'
                  className='block mb-1.5 text-sm font-medium text-slate-700'
                >
                  Full name
                </label>
                <input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete='name'
                  required
                  className='w-full px-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5'
                />
              </div>
            )}

            <div>
              <label
                htmlFor='email'
                className='block mb-1.5 text-sm font-medium text-slate-700'
              >
                Email address
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='email'
                required
                className='w-full px-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block mb-1.5 text-sm font-medium text-slate-700'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className='w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className='absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-700'
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-white transition rounded-lg bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {loading && <Loader2Icon size={16} className='animate-spin' />}
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Footer link */}
          <p className='mt-6 text-sm text-center text-slate-500'>
            {isLogin ? (
              <>
                New to SiteSphere?{" "}
                <Link
                  to='/register'
                  className='font-medium text-slate-900 underline-offset-4 hover:underline'
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  to='/login'
                  className='font-medium text-slate-900 underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage