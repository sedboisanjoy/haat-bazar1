import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, CreditCard } from 'lucide-react'
import { orderApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface OrderItem {
  id: number
  productId: number
  quantity: number
  price: number
}

interface Order {
  id: number
  userId: number
  totalAmount: number
  status: string
  createdAt: string
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle },
  PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CreditCard },
  SHIPPED: { label: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-100', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    orderApi.listByUser(user.userId)
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Package size={56} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-xl font-bold text-stone-700 mb-2">Sign in to view your orders</h2>
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">Sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-stone-900 mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100">
                <div className="flex justify-between">
                  <div className="skeleton h-5 w-24" />
                  <div className="skeleton h-5 w-20" />
                </div>
                <div className="skeleton h-4 w-1/3 mt-3" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={56} className="mx-auto text-stone-300 mb-4" />
            <h2 className="text-xl font-bold text-stone-700 mb-2">No orders yet</h2>
            <p className="text-stone-400 mb-6 text-sm">Start shopping to see your orders here</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {[...orders].sort((a, b) => b.id - a.id).map(order => {
              const cfg = statusConfig[order.status] ?? statusConfig.PENDING
              const Icon = cfg.icon
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-stone-100 hover:border-orange-100 transition-colors overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-stone-900">Order #{order.id}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-stone-500 text-sm">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-BD', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-extrabold text-stone-900">৳{order.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Mini item list */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="inline-flex items-center gap-1 bg-stone-50 border border-stone-100 text-stone-600 text-xs px-3 py-1 rounded-full">
                          <Package size={10} />
                          Product #{item.productId} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="border-t border-stone-100 px-5 py-3 bg-amber-50 flex items-center justify-between">
                      <p className="text-xs text-amber-700 font-medium">Payment pending</p>
                      <Link
                        to={`/orders/${order.id}/pay`}
                        state={{ order }}
                        className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        Pay now <ChevronRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
