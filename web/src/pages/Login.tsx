import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../shared/api'
import { useAuth } from '../shared/useAuth'
import { Box, Paper, TextField, Typography, Button, Stack, Avatar, Divider } from '@mui/material'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.post('/auth/login', { email, password })
      const role = res.data.user.role as 'superadmin' | 'admin' | 'employee'
      const serviceId = res.data.user.service?.id || null
      const serviceName = res.data.user.service?.name || null
      setAuth({ token: res.data.token, role, name: res.data.user.name, serviceId, serviceName })
      if (role === 'superadmin') navigate('/super')
      else if (role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Login failed')
    }
  }

  return (
        <Box 
      sx={{ 
        minHeight: '100dvh', 
        display: 'grid', 
        placeItems: 'center', 
        backgroundImage: 'url(/Mairie_dla3.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.15) 100%)',
        }
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          width: 400, 
          maxWidth: '90vw',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Header with logo and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Avatar
            src="/logo.webp"
            alt="Logo"
            sx={{ width: 50, height: 50 }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700} color="success">
              CAD3 Intranet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Système de Gestion des Annonces
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack component="form" onSubmit={onSubmit} spacing={2}>
          <Typography variant="h6" fontWeight={600} textAlign="center">
            Connexion
          </Typography>
          <TextField
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
          />
          {error && <Typography color="error" textAlign="center">{error}</Typography>}
          <Button type="submit" variant="contained" size="large" fullWidth color="success">
            Se connecter
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}


