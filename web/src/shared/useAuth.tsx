import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Role = 'superadmin' | 'admin' | 'employee' | null

type AuthState = {
  token: string | null
  role: Role
  name: string | null
  serviceId?: string | null
  serviceName?: string | null
}

type AuthContextType = AuthState & {
  setAuth: (state: Partial<AuthState>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [name, setName] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [serviceName, setServiceName] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('token'))
    setRole((localStorage.getItem('role') as Role) ?? null)
    setName(localStorage.getItem('name'))
    setServiceId(localStorage.getItem('serviceId'))
    setServiceName(localStorage.getItem('serviceName'))
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    token,
    role,
    name,
    serviceId,
    serviceName,
    setAuth: ({ token: t, role: r, name: n, serviceId: sid, serviceName: sname }) => {
      if (typeof t !== 'undefined') {
        setToken(t)
        if (t) localStorage.setItem('token', t); else localStorage.removeItem('token')
      }
      if (typeof r !== 'undefined') {
        setRole(r ?? null)
        if (r) localStorage.setItem('role', r); else localStorage.removeItem('role')
      }
      if (typeof n !== 'undefined') {
        setName(n ?? null)
        if (n) localStorage.setItem('name', n); else localStorage.removeItem('name')
      }
      if (typeof sid !== 'undefined') {
        setServiceId(sid ?? null)
        if (sid) localStorage.setItem('serviceId', sid); else localStorage.removeItem('serviceId')
      }
      if (typeof sname !== 'undefined') {
        setServiceName(sname ?? null)
        if (sname) localStorage.setItem('serviceName', sname); else localStorage.removeItem('serviceName')
      }
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('name')
      localStorage.removeItem('serviceId')
      localStorage.removeItem('serviceName')
      setToken(null)
      setRole(null)
      setName(null)
      setServiceId(null)
      setServiceName(null)
    }
  }), [token, role, name, serviceId, serviceName])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}



