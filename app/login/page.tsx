'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [shake, setShake] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const validateForm = (): boolean => {
    let valid = true
    setEmailError('')
    setPasswordError('')

    if (!email.trim()) {
      setEmailError('Email is required')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email')
      valid = false
    }

    if (!password) {
      setPasswordError('Password is required')
      valid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      valid = false
    }

    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid email or password')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/25">
            <span className="text-2xl font-bold text-white">LC</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400">Sign in to your account to continue</p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={cn(
            "bg-white/5 rounded-2xl p-8 border border-slate-700/50 space-y-5 transition-all duration-300",
            shake && "animate-[shake_0.5s_ease-in-out]"
          )}
        >
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setEmailError('')
                setError('')
              }}
              className={cn(
                "w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200",
                emailError ? "border-red-500/50 focus:ring-red-500" : "border-slate-600"
              )}
              placeholder="you@example.com"
            />
            {emailError && (
              <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setPasswordError('')
                  setError('')
                }}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 pr-10",
                  passwordError ? "border-red-500/50 focus:ring-red-500" : "border-slate-600"
                )}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-800/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to home
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

