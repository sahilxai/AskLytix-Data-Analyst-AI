import { useState, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import Logo from './Logo'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Interactive mouse spotlight position tracking
  const cardRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleToggle = () => {
    setIsRegister(!isRegister)
    setError('')
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!isSupabaseConfigured()) {
      setError('Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
      return
    }

    if (!email || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (isRegister) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      setLoading(true)
      const { error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setLoading(false)
        setError(signUpError.message)
      } else {
        await supabase.auth.signOut()
        setLoading(false)
        setPassword('')
        setConfirmPassword('')
        setIsRegister(false)
        setMessage('Registration successful! Please sign in with your credentials.')
      }
    } else {
      setLoading(true)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)

      if (signInError) {
        setError(signInError.message)
      }
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent text-slate-100 flex items-center justify-center p-4 font-sans relative z-10 overflow-hidden">
      {/* Background Soft Ambient Light */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Interactive Spotlight Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setMousePos({ x: -1000, y: -1000 })
        }}
        className="w-full max-w-[410px] relative p-[1.5px] rounded-2xl transition-all duration-300 group"
        style={{
          background: isHovered
            ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.6), rgba(99, 102, 241, 0.3), rgba(51, 65, 85, 0.4))`
            : 'rgba(51, 65, 85, 0.5)'
        }}
      >
        {/* Inner Card */}
        <div className="relative bg-slate-900/90 border border-slate-800/80 rounded-[14.5px] p-7 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
          
          {/* Subtle cursor light inside the card */}
          {isHovered && (
            <div
              className="pointer-events-none absolute -inset-px rounded-[14.5px] opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.07), transparent 70%)`
              }}
            />
          )}

          {/* Top Header */}
          <div className="flex flex-col items-center text-center mb-7 relative z-10">
            <div className="mb-3">
              <Logo showBackground={true} />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white">AskLytix</h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister ? 'Create your account to get started' : 'Sign in to access your workspace'}
            </p>
          </div>

          {/* Missing Config Alert */}
          {!isSupabaseConfigured() && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2 relative z-10">
              <AlertCircle size={15} className="shrink-0 text-amber-400 mt-0.5" />
              <span>Missing Supabase credentials in frontend/.env</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2 relative z-10 animate-in slide-in-from-top-1">
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {message && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2 relative z-10 animate-in slide-in-from-top-1">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Simple Clean Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm hover:border-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {isRegister && <span className="text-[10px] text-slate-500">Min. 6 chars</span>}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm hover:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode only) */}
            {isRegister && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm hover:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    tabIndex={-1}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Glowing Interactive Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:via-indigo-500 hover:to-sky-400 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 group"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Simple Switch Link */}
          <div className="mt-6 text-center relative z-10">
            <p className="text-xs text-slate-400">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={handleToggle}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer ml-1"
              >
                {isRegister ? 'Sign in' : 'Register'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
