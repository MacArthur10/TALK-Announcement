import React, { useMemo, useState } from 'react'
import { AppBar, Box, Toolbar, Typography, Container, Button, Stack, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme, Avatar } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useAuth } from './useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { role, name, serviceName } = useAuth()

  const menuItems = useMemo(() => {
    const items: Array<{ text: string, path: string }> = []
    if (role === 'admin') items.push({ text: 'Admin', path: '/admin' })
    if (role === 'superadmin') items.push({ text: 'Super', path: '/super' })
    return items
  }, [role])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    navigate('/login')
  }

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={RouterLink} to={item.path} onClick={() => setDrawerOpen(false)}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar position="static" color="success">
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Avatar
            src="/logo.webp"
            alt="Logo"
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>CAD3 Intranet</Typography>
          {!isMobile && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {name || ''}{serviceName ? ` — ${serviceName}` : ''}
            </Typography>
          )}
          {!isMobile && (
            <Stack direction="row" spacing={1}>
              {role === 'admin' && (
                <Button color="inherit" component={RouterLink} to="/admin">Admin</Button>
              )}
              {role === 'superadmin' && (
                <Button color="inherit" component={RouterLink} to="/super">Super</Button>
              )}
              <Button color="inherit" onClick={logout}>Déconnexion</Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  )
}


