import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Loader2, CreditCard, ArrowLeft } from 'lucide-react'
import { paymentApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit/Debit Card', emoji: '💳', desc: 'Visa, Mastercard, Amex' },
  { value: 'BKASH', label: 'bKash', emoji: '🔴', desc: 'Bangladesh mobile banking' },
  { value: 'NAGAD', label: 'Nagad', emoji: '🟠', desc: 'Bangladesh mobile banking' },
]

export default function Payment() {
  useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()

  const order = (location.state as { order?: { id: number; totalAmount: number; items: unknown[] } })?.order
  const [payMethod, setPayMethod] = useState((location.state as { payMethod?: string })?.payMethod ?? 'CARD')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  if (!order || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Order not found.</p>
          <button onClick={() => navigate('/orders')} className="text-orange-600 font-semibold hover:underline">
            ← Back to orders
          </button>
        </div>
      </div>
    )
  }

  const handlePay = async () => {
    try {
      setPaying(true)
      await paymentApi.process({
        orderId: order.id,
        userId: user.userId,
        amount: order.totalAmount,
        method: payMethod,
      })
      await refreshCart()
      setPaid(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mb-3">Payment Successful! 🎉</h1>
          <p className="text-stone-500 mb-2">
            Order <span className="font-semibold text-stone-800">#{order.id}</span> has been paid.
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mb-8">৳{order.totalAmount.toLocaleString()}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="hero-gradient text-white p-6">
            <CreditCard size={28} className="mb-3 opacity-80" />
            <h1 className="text-xl font-extrabold">Complete Payment</h1>
            <p className="text-white/75 text-sm mt-1">Order #{order.id}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Order summary */}
            <div className="bg-stone-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-stone-700 mb-3">Order Summary</p>
              <div className="flex justify-between items-center">
                <span className="text-stone-600 text-sm">
                  {(order.items as unknown[]).length} item{(order.items as unknown[]).length !== 1 ? 's' : ''}
                </span>
                <span className="text-2xl font-extrabold text-stone-900">৳{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-semibold text-stone-700 mb-3">Payment Method</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ value, label, emoji, desc }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      payMethod === value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={payMethod === value}
                      onChange={() => setPayMethod(value)}
                      className="sr-only"
                    />
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900 text-sm">{label}</p>
                      <p className="text-stone-400 text-xs">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      payMethod === value ? 'border-orange-500' : 'border-stone-300'
                    }`}>
                      {payMethod === value && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm text-base"
            >
              {paying ? (
                <><Loader2 size={20} className="animate-spin" /> Processing payment...</>
              ) : (
                <>Pay ৳{order.totalAmount.toLocaleString()} via {payMethod}</>
              )}
            </button>

            <p className="text-center text-xs text-stone-400">
              🔒 Payments are processed securely. This is a demo environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
