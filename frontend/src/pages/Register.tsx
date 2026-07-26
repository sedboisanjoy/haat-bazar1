import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Loader2, Check } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const roles = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Shop for products', emoji: '🛒' },
  { value: 'SELLER', label: 'Seller', desc: 'Sell your products', emoji: '🏪' },
  { value: 'ADMIN', label: 'Admin', desc: 'Manage the platform', emoji: '🛡️' },
]

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Fill in all fields')
      return
    }
    try {
      setLoading(true)
      const res = await authApi.register(form)
      login(res.data.token)
      toast.success('Account created! Welcome to HaatBazar 🎉')
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-stone-900 p-12 text-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">হ</span>
          </div>
          <span className="text-xl font-bold">HaatBazar</span>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Join the<br />
            <span className="text-orange-400">marketplace</span>
          </h2>
          <p className="text-stone-400 text-lg mb-8">
            Buy, sell, and grow — all in one place.
          </p>
          <div className="space-y-4">
            {[
              '✅ Free to register as a customer',
              '✅ Start selling in minutes',
              '✅ Secure bKash & card payments',
              '✅ Real-time inventory management',
            ].map(item => (
              <p key={item} className="text-stone-300 text-sm">{item}</p>
            ))}
          </div>
        </div>
        <div />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-stone-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-stone-900">Create your account</h1>
            <p className="text-stone-500 mt-1 text-sm">Join HaatBazar — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 space-y-5">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">I want to</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label, desc, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: value }))}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      form.role === value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {form.role === value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                    <span className="text-xl block mb-1">{emoji}</span>
                    <p className="text-xs font-bold text-stone-900">{label}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm pr-12"
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
                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              ) : (
                <><UserPlus size={18} /> Create account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 font-semibold hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
