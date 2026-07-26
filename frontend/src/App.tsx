import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Payment from './pages/Payment'
import SellerDashboard from './pages/SellerDashboard'
import AdminPanel from './pages/AdminPanel'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<Products />} />
          <Route path="/cart" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/orders/:orderId/pay" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/seller" element={
            <ProtectedRoute roles={['SELLER']}>
              <SellerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 hero-gradient rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">হ</span>
              </div>
              <span className="font-bold text-white">HaatBazar</span>
            </div>
            <p className="text-stone-400 text-sm text-center">
              Bangladesh's freshest online marketplace • Spring Boot microservices backend
            </p>
            <div className="flex gap-4 text-stone-400 text-xs">
              <span>auth-service</span>
              <span>•</span>
              <span>product-service</span>
              <span>•</span>
              <span>order-service</span>
              <span>•</span>
              <span>payment-service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#1c1917',
                color: '#fafaf9',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#f97316', secondary: '#fff' },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
