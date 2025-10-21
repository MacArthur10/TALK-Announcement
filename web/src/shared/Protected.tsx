import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function Protected({ children, roles }: { children: React.ReactNode, roles?: Array<'superadmin'|'admin'|'employee'> }) {
  const { token, role } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && role && !roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}



