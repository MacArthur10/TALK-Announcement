import { useEffect, useState } from 'react'
import api from '../shared/api'
import Layout from '../shared/Layout'
import { Paper, Typography, Card, CardContent, Chip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import React from 'react'

export default function Feed() {
  const [list, setList] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  useEffect(() => { api.get('/announcements/feed').then(r => setList(r.data)).catch(() => {}) }, [])
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'primary'
      case 'public': return 'secondary'
      case 'private': return 'info'
      default: return 'default'
    }
  }

  return (
    <Layout>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
        Flux d'annonces ({list.length})
      </Typography>
      
      <Card>
        <CardContent>
          {list.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Aucune annonce disponible
            </Typography>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2
            }}>
              {list.map(a => (
                <Box key={a._id}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', cursor: 'pointer' }} onClick={() => setSelected(a)}>
                    {Array.isArray(a.attachments) && a.attachments[0] && (
                      <Box sx={{ mb: 1 }}>
                        <img src={a.attachments[0]} alt="image" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }} />
                      </Box>
                    )}
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {a.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {a.content.substring(0, 150)}...
                    </Typography>
                    {a.createdBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        De: {a.createdBy.name} ({a.createdBy.email || '—'})
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip 
                        label={a.type} 
                        color={getTypeColor(a.type)} 
                        size="small" 
                      />
                      <Chip 
                        label={a.status} 
                        color={getStatusColor(a.status)} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent dividers>
          {Array.isArray(selected?.attachments) && selected?.attachments[0] && (
            <Box sx={{ mb: 2 }}>
              <img src={selected.attachments[0]} alt="image" style={{ width: '100%', borderRadius: 6 }} />
            </Box>
          )}
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selected?.content}</Typography>
          {selected?.links && selected.links.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Liens:</Typography>
              {selected.links.map((link: any, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Button 
                    variant="outlined" 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none' }}
                  >
                    {link.title}
                  </Button>
                </Box>
              ))}
            </Box>
          )}
          {selected?.createdBy && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Envoyé par {selected.createdBy.name} ({selected.createdBy.email || '—'})
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}


