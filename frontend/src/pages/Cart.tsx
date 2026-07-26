import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderApi } from '../api/client'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit/Debit Card', emoji: '💳' },
  { value: 'BKASH', label: 'bKash', emoji: '🔴' },
  { value: 'NAGAD', label: 'Nagad', emoji: '🟠' },
]

export default function Cart() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payMethod, setPayMethod] = useState('CARD')
  const [checkingOut, setCheckingOut] = useState(false)

  const handleRemove = async (productId: number) => {
    try {
      await removeItem(productId)
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleQty = async (productId: number, qty: number) => {
    if (qty < 1) return
    try {
      await updateItem(productId, qty)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    if (!cart?.items?.length) { toast.error('Your cart is empty'); return }
    try {
      setCheckingOut(true)
      const res = await orderApi.checkout(user.userId, payMethod)
      toast.success('Order placed! Redirecting to payment...', { icon: '🎉' })
      navigate(`/orders/${res.data.id}/pay`, { state: { order: res.data, payMethod } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <ShoppingCart size={56} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-xl font-bold text-stone-700 mb-2">Sign in to view your cart</h2>
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">Sign in →</Link>
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-stone-900">
            Shopping Cart
            {items.length > 0 && (
              <span className="ml-2 text-base font-normal text-stone-500">({items.length} items)</span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 size={14} /> Clear cart
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100">
                <div className="flex gap-4">
                  <div className="skeleton w-20 h-20 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-1/2 mb-2" />
                    <div className="skeleton h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={56} className="mx-auto text-stone-300 mb-4" />
            <h2 className="text-xl font-bold text-stone-700 mb-2">Your cart is empty</h2>
            <p className="text-stone-400 mb-6 text-sm">Add some products to get started!</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
            >
              <Package size={18} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => (
                <div key={item.productId} className="bg-white rounded-2xl p-4 border border-stone-100 flex gap-4 items-center group hover:border-orange-100 transition-colors">
                  {/* Product icon */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <Package size={28} className="text-orange-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 truncate">
                      {item.productName ?? `Product #${item.productId}`}
                    </h3>
                    <p className="text-orange-600 font-bold mt-1">৳{item.price.toLocaleString()}</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => handleQty(item.productId, item.quantity - 1)}
                        className="px-3 py-2 hover:bg-stone-50 transition-colors"
                      >
                        <Minus size={14} className="text-stone-500" />
                      </button>
                      <span className="px-3 py-2 text-sm font-semibold text-stone-800 min-w-[32px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQty(item.productId, item.quantity + 1)}
                        className="px-3 py-2 hover:bg-stone-50 transition-colors"
                      >
                        <Plus size={14} className="text-stone-500" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[80px]">
                    <p className="font-extrabold text-stone-900">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-20">
                <h2 className="font-bold text-stone-900 mb-4 text-lg">Order Summary</h2>

                {/* Items summary */}
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-stone-500 truncate max-w-[150px]">
                        {item.productName ?? `Product #${item.productId}`} ×{item.quantity}
                      </span>
                      <span className="font-medium text-stone-800">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-bold text-stone-900">Total</span>
                    <span className="text-xl font-extrabold text-orange-600">৳{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-stone-700 mb-2">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        onClick={() => setPayMethod(value)}
                        className={`p-2 rounded-xl border-2 text-center transition-all ${
                          payMethod === value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-xl block">{emoji}</span>
                        <span className="text-[10px] font-semibold text-stone-700 mt-1 block">{label.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || items.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {checkingOut ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <>Checkout <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
