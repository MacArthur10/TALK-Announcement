import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './style.css'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { AuthProvider } from './shared/useAuth'
import Protected from './shared/Protected'

const Login = React.lazy(() => import('./pages/Login'))
const SuperDashboard = React.lazy(() => import('./pages/SuperDashboard'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const Feed = React.lazy(() => import('./pages/Feed'))
const UploadTest = React.lazy(() => import('./pages/UploadTest'))

const router = createBrowserRouter([
  { path: '/', element: (<React.Suspense fallback={<div />}> <Feed /> </React.Suspense>) },
  { path: '/login', element: (<React.Suspense fallback={<div />}> <Login /> </React.Suspense>) },
  { path: '/super', element: (<React.Suspense fallback={<div />}> <Protected roles={['superadmin']}><SuperDashboard /></Protected> </React.Suspense>) },
  { path: '/admin', element: (<React.Suspense fallback={<div />}> <Protected roles={['admin','superadmin']}><AdminDashboard /></Protected> </React.Suspense>) },
  { path: '/upload-test', element: (<React.Suspense fallback={<div />}> <Protected roles={['superadmin', 'admin']}><UploadTest /></Protected> </React.Suspense>) },
])

const root = createRoot(document.getElementById('app')!)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B6BCB' },
    secondary: { main: '#004AAD' },
    background: { default: '#f7f9fc' },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: 'Inter, system-ui, Arial' },
})
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)


