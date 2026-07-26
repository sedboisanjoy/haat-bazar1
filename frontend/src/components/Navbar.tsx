import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, LogOut, Menu, X, Package, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-orange-600 font-semibold'
      : 'text-stone-600 hover:text-orange-600'

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg">হ</span>
            </div>
            <div className="leading-none">
              <span className="font-bold text-xl text-stone-900 tracking-tight">Haat</span>
              <span className="font-bold text-xl text-orange-600 tracking-tight">Bazar</span>
              <div className="text-[9px] text-stone-400 tracking-widest uppercase">Fresh from the source</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm transition-colors ${isActive('/')}`}>Home</Link>
            <Link to="/products" className={`text-sm transition-colors ${isActive('/products')}`}>Products</Link>
            {user?.role === 'CUSTOMER' && (
              <Link to="/orders" className={`text-sm transition-colors ${isActive('/orders')}`}>My Orders</Link>
            )}
            {user?.role === 'SELLER' && (
              <Link to="/seller" className={`text-sm transition-colors ${isActive('/seller')}`}>
                <span className="flex items-center gap-1">
                  <Package size={14} />Seller
                </span>
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={`text-sm transition-colors flex items-center gap-1 ${isActive('/admin')}`}>
                <Shield size={14} />Admin
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user?.role === 'CUSTOMER' && (
                  <Link to="/cart" className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors">
                    <ShoppingCart size={22} className="text-stone-600" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center badge-pulse">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm text-stone-700 max-w-24 truncate">{user.email.split('@')[0]}</span>
                    <ChevronDown size={14} className="text-stone-400" />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-semibold text-stone-900 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          user.role === 'SELLER' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{user.role}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-stone-600 hover:text-orange-600 font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Join now
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-stone-100"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 py-3 space-y-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Products' },
              ...(user?.role === 'CUSTOMER' ? [{ to: '/orders', label: 'My Orders' }, { to: '/cart', label: 'Cart' }] : []),
              ...(user?.role === 'SELLER' ? [{ to: '/seller', label: 'Seller Dashboard' }] : []),
              ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {dropOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
      )}
    </nav>
  )
}
