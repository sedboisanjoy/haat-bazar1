import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Fill in all fields')
      return
    }
    try {
      setLoading(true)
      const res = await authApi.login(form)
      login(res.data.token)
      toast.success('Welcome back!', { icon: '👋' })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 hero-gradient p-12 text-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">হ</span>
          </div>
          <span className="text-xl font-bold">HaatBazar</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Your daily market,<br />
            <span className="text-yellow-300">online</span>
          </h2>
          <p className="text-white/75 text-lg">
            Thousands of products from verified sellers across Bangladesh.
          </p>
        </div>
        <div className="flex gap-6">
          {[['10K+', 'Products'], ['5K+', 'Sellers'], ['50K+', 'Customers']].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-extrabold text-yellow-300">{v}</div>
              <div className="text-white/60 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">হ</span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900">Welcome back</h1>
            <p className="text-stone-500 mt-1 text-sm">Sign in to your HaatBazar account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : (
                <><LogIn size={18} /> Sign in</>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-stone-400">Quick demo accounts</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'CUSTOMER', email: 'karim@hb.com', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { role: 'SELLER', email: 'rahim@hb.com', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { role: 'ADMIN', email: 'admin@hb.com', color: 'bg-red-50 text-red-700 border-red-200' },
              ].map(({ role, email, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ email, password: 'secret123' })}
                  className={`text-xs font-semibold py-2 px-3 rounded-xl border ${color} hover:opacity-80 transition-opacity`}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-stone-400">Demo password: <code className="bg-stone-100 px-1.5 py-0.5 rounded">secret123</code></p>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            No account?{' '}
            <Link to="/register" className="text-orange-600 font-semibold hover:underline">
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
