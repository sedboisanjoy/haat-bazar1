import { useState } from 'react'
import { ShoppingCart, Package, Plus, Minus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock?: number
  category?: string
}

const productGradients = [
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-rose-400 to-orange-500',
]

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, cart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [adding, setAdding] = useState(false)
  const [qty, setQty] = useState(1)

  const gradient = productGradients[product.id % productGradients.length]
  const cartItem = cart?.items?.find(i => i.productId === product.id)
  const inCart = !!cartItem
  const isCustomer = !isAuthenticated || user?.role === 'CUSTOMER'

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart')
      return
    }
    if (user?.role !== 'CUSTOMER') {
      toast.error('Only customers can purchase products')
      return
    }
    try {
      setAdding(true)
      await addItem(product.id, qty, product.price)
      toast.success(`${product.name} added to cart!`, {
        icon: '🛍️',
        style: { borderRadius: '12px', fontWeight: '600' },
      })
    } catch {
      toast.error('Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="product-card bg-white rounded-2xl border border-stone-100 overflow-hidden group">
      {/* Image placeholder with gradient */}
      <Link to={`/products/${product.id}`}>
        <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
          <Package size={48} className="text-white/60" />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-stone-900 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          {product.category && (
            <span className="absolute top-3 left-3 bg-white/90 text-stone-700 text-[10px] font-semibold px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-stone-900 text-sm leading-snug hover:text-orange-600 transition-colors line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-stone-400 text-xs line-clamp-1 mb-3">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-extrabold text-stone-900">৳{product.price.toLocaleString()}</span>
            {product.stock !== undefined && product.stock > 0 && (
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{product.stock} in stock</p>
            )}
          </div>

          {/* Qty + Add */}
          <div className="flex items-center gap-1">
            {isCustomer && (
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-2 py-1.5 hover:bg-stone-50 transition-colors"
                >
                  <Minus size={12} className="text-stone-500" />
                </button>
                <span className="px-2 text-sm font-semibold text-stone-800 min-w-[20px] text-center">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="px-2 py-1.5 hover:bg-stone-50 transition-colors"
                >
                  <Plus size={12} className="text-stone-500" />
                </button>
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={adding || product.stock === 0 || !isCustomer}
              title={!isCustomer ? 'Only customers can purchase' : undefined}
              className={`p-2 rounded-xl transition-colors ${
                !isCustomer
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : inCart
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
              }`}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
