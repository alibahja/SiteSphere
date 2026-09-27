import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthLayout, GuestLayout } from './pages/Layout'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'           // ✅ fixed: was lucide icon
import BuilderPage from './pages/BuilderPage'
import Preview from './pages/Preview'
import PublishPage from './pages/PublishPage'

const App = () => {
  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#18181b',            // zinc-900
            border: '1px solid #e4e4e7', // zinc-200
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px 14px',
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />

      <Routes>
        {/* Login Routes */}
        <Route element={<GuestLayout />}>
          <Route path='/login' element={<AuthPage mode="login" />} />
          <Route path='/register' element={<AuthPage mode="register" />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<AuthLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='/builder/:id' element={<BuilderPage />} />
          <Route path='/preview/:id' element={<Preview />} />
        </Route>

        {/* Public Routes */}
        <Route path='/publish/:id' element={<PublishPage />} />

        {/* Catch-all */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  )
}

export default App