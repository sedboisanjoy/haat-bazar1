import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  sub: string
  role: string
  userId?: number
  exp: number
}

interface User {
  email: string
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN'
  userId: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

function parseToken(token: string): User | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    if (payload.exp * 1000 < Date.now()) return null
    return {
      email: payload.sub,
      role: payload.role as User['role'],
      userId: payload.userId ?? Math.abs(payload.sub.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9999) + 1,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hb_token'))
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('hb_token')
    return t ? parseToken(t) : null
  })

  const login = (newToken: string) => {
    const parsed = parseToken(newToken)
    if (!parsed) return
    localStorage.setItem('hb_token', newToken)
    setToken(newToken)
    setUser(parsed)
  }

  const logout = () => {
    localStorage.removeItem('hb_token')
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (token) {
      const parsed = parseToken(token)
      if (!parsed) logout()
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
