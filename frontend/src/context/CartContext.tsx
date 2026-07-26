import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { cartApi } from '../api/client'
import { useAuth } from './AuthContext'

interface CartItem {
  id?: number
  productId: number
  productName?: string
  quantity: number
  price: number
}

interface Cart {
  id?: number
  userId: number
  items: CartItem[]
  totalAmount?: number
}

interface CartContextType {
  cart: Cart | null
  itemCount: number
  loading: boolean
  addItem: (productId: number, quantity: number, price: number) => Promise<void>
  updateItem: (productId: number, quantity: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const userId = user?.userId ?? 0

  const refreshCart = async () => {
    if (!isAuthenticated || !userId) return
    try {
      setLoading(true)
      const res = await cartApi.get(userId)
      setCart(res.data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && userId && user?.role === 'CUSTOMER') {
      refreshCart()
    } else {
      setCart(null)
    }
  }, [isAuthenticated, userId, user?.role])

  const addItem = async (productId: number, quantity: number, price: number) => {
    await cartApi.addItem(userId, { productId, quantity, price })
    await refreshCart()
  }

  const updateItem = async (productId: number, quantity: number) => {
    await cartApi.updateItem(userId, productId, quantity)
    await refreshCart()
  }

  const removeItem = async (productId: number) => {
    await cartApi.removeItem(userId, productId)
    await refreshCart()
  }

  const clearCart = async () => {
    await cartApi.clear(userId)
    await refreshCart()
  }

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, addItem, updateItem, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
