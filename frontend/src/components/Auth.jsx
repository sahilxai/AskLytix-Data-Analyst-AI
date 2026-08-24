import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { Bot, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleToggleMode = () => {
    setIsRegister(!isRegister)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setLoading(false)
        setError(signUpError.message)
      } else {
        // Ensure user is not auto-logged in upon sign up
        await supabase.auth.signOut()
        setLoading(false)
        setPassword('')
        setConfirmPassword('')
        setIsRegister(false)
        setMessage('Registration successful! Please login with your credentials.')
      }
    } else {
      setLoading(true)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)

      if (signInError) {
        setError(signInError.message)
      }
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-x-hidden overflow-y-auto">
      {/* Background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Asklytix Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-3 border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Bot size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">AskLytix</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Create your account' : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Missing Config Banner */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200 mb-1">Supabase Credentials Required</p>
              <p>Please add your <code className="bg-slate-900/80 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="bg-slate-900/80 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> to the <code className="bg-slate-900/80 px-1 py-0.5 rounded text-amber-300">frontend/.env</code> file.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{isRegister ? 'Register' : 'Login'}</span>
            )}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium cursor-pointer"
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  )
}
