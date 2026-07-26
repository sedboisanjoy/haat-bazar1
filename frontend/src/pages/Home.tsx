import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Truck, Shield, Zap, Star, TrendingUp } from 'lucide-react'
import { productApi, categoryApi } from '../api/client'
import ProductCard from '../components/ProductCard'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
}

interface Category {
  id: number
  name: string
}

const categoryEmojis: Record<string, string> = {
  Groceries: '🥬',
  Electronics: '📱',
  Clothing: '👗',
  Books: '📚',
  Home: '🏠',
  Food: '🍔',
  Beauty: '✨',
  Sports: '⚽',
  Toys: '🧸',
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([productApi.list(), categoryApi.list()])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data.slice(0, 8))
        setCategories(cRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 80 + 20}px`,
                height: `${Math.random() * 80 + 20}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6">
              <TrendingUp size={14} />
              Bangladesh's freshest marketplace
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              Your Daily<br />
              <span className="text-yellow-300">Haat Bazar</span><br />
              — Online
            </h1>
            <p className="text-lg text-white/85 mb-8 leading-relaxed max-w-lg">
              Shop groceries, electronics, and more from trusted sellers.
              Fast delivery, authentic products, best prices guaranteed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-6 py-3 rounded-2xl hover:bg-yellow-50 transition-colors shadow-lg"
              >
                <ShoppingBag size={18} />
                Shop Now
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/10 transition-colors"
              >
                Become a Seller
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              {[
                { value: '10K+', label: 'Products' },
                { value: '5K+', label: 'Sellers' },
                { value: '50K+', label: 'Customers' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-extrabold text-yellow-300">{value}</div>
                  <div className="text-white/70 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#fafaf9"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Same day in Dhaka', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Shield, title: 'Secure Payment', desc: 'CARD, bKash, Nagad', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Star, title: 'Verified Sellers', desc: 'Quality assured', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Zap, title: 'Best Prices', desc: 'Price match promise', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-stone-900 text-sm">{title}</p>
                <p className="text-stone-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-900">Shop by Category</h2>
            <Link to="/products" className="text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1">
              All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-stone-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {categoryEmojis[cat.name] ?? '🛍️'}
                </span>
                <span className="text-xs font-medium text-stone-700 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Featured Products</h2>
            <p className="text-stone-500 text-sm mt-1">Fresh picks from our sellers</p>
          </div>
          <Link to="/products" className="text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100">
                <div className="skeleton h-40 w-full rounded-xl mb-3" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500">No products yet. Log in as a Seller to add some!</p>
            <Link to="/login" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">
              Sign in →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-stone-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-3">Ready to start selling?</h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Join thousands of sellers on Haat Bazar. Set up your shop in minutes.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg"
          >
            Create Seller Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
