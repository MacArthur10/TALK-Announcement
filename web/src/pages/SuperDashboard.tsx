import React, { useEffect, useMemo, useState } from 'react'
import api from '../shared/api'
import Layout from '../shared/Layout'
import { Box, Button, Paper, Stack, TextField, Typography, Card, CardContent, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, MenuItem } from '@mui/material'
import Grid from '@mui/material/Grid'

import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, PersonAdd as PersonAddIcon, Visibility as VisibilityIcon, Reply as ReplyIcon } from '@mui/icons-material'

export default function SuperDashboard() {
  // Announcement creation function
  async function createAnnouncement() {
    setAnnouncementLoading(true)
    setAnnouncementError(null)
    try {
      const payload: any = {
        title: announcementForm.title,
        content: announcementForm.content,
        type: announcementForm.type,
        serviceId: announcementForm.serviceId || services[0]?._id, // Use selected service or first service
        targetService: ['private', 'internal'].includes(announcementForm.type) ? announcementForm.targetService : undefined,
        attachments: announcementForm.attachments,
        recipient: announcementForm.type === 'private' ? announcementForm.recipient : undefined,
        targetRole: announcementForm.type === 'internal' ? announcementForm.targetRole : undefined
      }
      await api.post('/announcements', payload)
      setAnnouncementDialogOpen(false)
      setAnnouncementForm({ 
        title: '', 
        content: '', 
        type: 'internal', 
        targetService: '', 
        serviceId: '',
        attachments: [], 
        recipient: '',
        targetRole: 'all'
      })
    } catch (e: any) {
      setAnnouncementError(e?.response?.data?.error ?? 'Erreur lors de la création')
    }
    setAnnouncementLoading(false)
  }
  // Announcement creation dialog state
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'internal',
    targetService: '',
    serviceId: '',
    attachments: [],
    recipient: '',
    targetRole: 'all' // Default to all members
  })
  const [announcementLoading, setAnnouncementLoading] = useState(false)
  const [announcementError, setAnnouncementError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [serviceMembers, setServiceMembers] = useState<any[]>([])

  const [allUsers, setAllUsers] = useState<any[]>([])
  useEffect(() => {
    api.get('/auth/super/users').then(r => setAllUsers(r.data)).catch(() => {})
  }, [])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  // User form fields
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    matricule: '',
    serviceId: '',
    role: 'employee' as 'admin' | 'employee'
  })
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [annTab, setAnnTab] = useState<'received' | 'sent'>('received')

  useEffect(() => {
    loadServices()
    loadUsers()
  }, [])

  useEffect(() => {
    if (tabValue === 3) {
      loadPendingAnnouncements()
    }
  }, [tabValue])
  
  // Effet pour charger les membres quand un service est sélectionné pour une annonce privée
  useEffect(() => {
    if (announcementForm.type === 'private' && announcementForm.targetService) {
      loadServiceMembers(announcementForm.targetService);
    }
  }, [announcementForm.targetService, announcementForm.type]);
  
  // Fonction pour charger les membres d'un service spécifique
  async function loadServiceMembers(serviceId: string) {
    try {
      console.log(`Loading members for service ${serviceId}...`);
      const response = await api.get(`/auth/members?serviceId=${serviceId}`);
      console.log(`Service members loaded:`, response.data);
      setServiceMembers(response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error loading service members:", error);
      setAnnouncementError(`Impossible de charger les membres: ${
        error?.response?.data?.error || error?.message || 'Erreur inconnue'
      }`);
      return [];
    }
  }

  async function loadServices() {
    try {
      const r = await api.get('/services')
      setServices(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function loadUsers() {
    try {
      const r = await api.get('/auth/super/users')
      setUsers(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors du chargement des utilisateurs')
    }
  }

  async function onSelectImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      console.log("Uploading file:", file.name, file.type, file.size);
      
      const form = new FormData()
      form.append('file', file)
      
      // Afficher plus de détails sur l'erreur si elle se produit
      const r = await api.post('/uploads/image', form, { 
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log("Upload successful, response:", r.data);
      setAnnouncementForm(prev => ({ ...prev, attachments: [...(prev.attachments as any[]), r.data.url] }))
    } catch (err: any) {
      console.error("Upload error details:", err);
      const errorMessage = err?.response?.data?.error ?? 'Upload échoué';
      console.error("Error message:", errorMessage);
      setAnnouncementError(errorMessage);
    }
    setUploading(false)
  }

  async function addService() {
    try {
      const r = await api.post('/services', { name, description })
      setServices(prev => [...prev, r.data])
      setName('')
      setDescription('')
      setServiceDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function updateService() {
    try {
      const r = await api.put(`/services/${editingService._id}`, { name, description })
      setServices(prev => prev.map(s => s._id === editingService._id ? r.data : s))
      setEditingService(null)
      setName('')
      setDescription('')
      setServiceDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function deleteService(id: string) {
    try {
      await api.delete(`/services/${id}`)
      setServices(prev => prev.filter(s => s._id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function createUser() {
    try {
      if (editingUser) {
        // update user
        await api.put(`/auth/super/users/${editingUser._id}`, userForm)
      } else {
        await api.post('/auth/super/create-user', userForm)
      }
      setUserForm({
        email: '',
        name: '',
        password: '',
        matricule: '',
        serviceId: '',
        role: 'employee'
      })
      setUserDialogOpen(false)
      setEditingUser(null)
      loadUsers()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function deleteUser(id: string) {
    try {
      await api.delete(`/auth/super/users/${id}`)
      setUsers(prev => prev.filter(u => u._id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
  }

  async function loadPendingAnnouncements() {
    try {
      setApprovalsLoading(true)
      setApprovalsError(null)
      const r = await api.get('/announcements/pending')
      setPendingAnnouncements(r.data)
    } catch (e: any) {
      setApprovalsError(e?.response?.data?.error ?? 'Erreur lors du chargement des annonces en attente')
    } finally {
      setApprovalsLoading(false)
    }
  }

  async function approveAnnouncement(id: string) {
    try {
      await api.post(`/announcements/${id}/approve`)
      setPendingAnnouncements(prev => prev.filter(a => a._id !== id))
    } catch (e: any) {
      setApprovalsError(e?.response?.data?.error ?? 'Erreur lors de l\'approbation')
    }
  }

  async function rejectAnnouncement(id: string) {
    try {
      await api.post(`/announcements/${id}/reject`)
      setPendingAnnouncements(prev => prev.filter(a => a._id !== id))
    } catch (e: any) {
      setApprovalsError(e?.response?.data?.error ?? 'Erreur lors du rejet')
    }
  }

  function openEditService(service: any) {
    setEditingService(service)
    setName(service.name)
    setDescription(service.description || '')
    setServiceDialogOpen(true)
  }

  function openCreateService() {
    setEditingService(null)
    setName('')
    setDescription('')
    setServiceDialogOpen(true)
  }

  return (
    <Layout>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
        Super Admin Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Services" />
          <Tab label="Utilisateurs" />
          <Tab label="Annonces" />
        </Tabs>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={() => setAnnouncementDialogOpen(true)}>
          Créer une annonce
        </Button>
      </Box>
      {tabValue === 2 && (
        <>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={annTab === 'received' ? 0 : 1} onChange={(e, v) => setAnnTab(v === 0 ? 'received' : 'sent')}>
                  <Tab label="Reçues" />
                  <Tab label="Envoyées" />
                </Tabs>
              </Box>
              <AnnouncementsTable mode={annTab} />
            </CardContent>
          </Card>
        </>
      )}

      {tabValue === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Gestion des Services</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateService}>
                  Ajouter un service
                </Button>
              </Box>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Services existants ({services.length})</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map(s => (
                      <TableRow key={s._id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.description || '-'}</TableCell>
                        <TableCell>
                          <Chip label="Actif" color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => openEditService(s)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => deleteService(s._id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {tabValue === 1 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Gestion des Utilisateurs</Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setEditingUser(null); setUserDialogOpen(true); }}>
                  Créer un utilisateur
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Utilisateurs ({users.length})</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Matricule</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u._id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.matricule}</TableCell>
                        <TableCell>{u.service?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Employé'} 
                            color={u.role === 'superadmin' ? 'error' : u.role === 'admin' ? 'primary' : 'default'} 
                            size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={u.active ? 'Actif' : 'Inactif'} 
                            color={u.active ? 'success' : 'default'} 
                            size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => {
                            setEditingUser(u)
                            setUserForm({
                              email: u.email || '',
                              name: u.name || '',
                              password: '',
                              matricule: u.matricule || '',
                              serviceId: u.service?._id || '',
                              role: u.role === 'admin' ? 'admin' : 'employee'
                            })
                            setUserDialogOpen(true)
                          }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteUser(u._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {false && <div />}

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingService ? 'Modifier le service' : 'Ajouter un service'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom du service"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={editingService ? updateService : addService}
            disabled={!name.trim()}
          >
            {editingService ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Nom complet"
              value={userForm.name}
              onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Matricule"
              value={userForm.matricule}
              onChange={e => setUserForm(prev => ({ ...prev, matricule: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={userForm.password}
              onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required={!editingUser}
              helperText={editingUser ? 'Laisser vide pour conserver le mot de passe actuel' : ''}
            />
            <TextField
              select
              label="Service"
              value={userForm.serviceId}
              onChange={e => setUserForm(prev => ({ ...prev, serviceId: e.target.value }))}
              fullWidth
              required
            >
              {services.map(s => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Rôle"
              value={userForm.role}
              onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'employee' }))}
              fullWidth
              required
            >
              <MenuItem value="admin">Administrateur</MenuItem>
              <MenuItem value="employee">Employé</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={createUser}
            disabled={!userForm.email || !userForm.name || (!editingUser && !userForm.password) || !userForm.serviceId}
          >
            {editingUser ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onClose={() => setAnnouncementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une annonce</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titre"
              value={announcementForm.title}
              onChange={e => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Contenu"
              value={announcementForm.content}
              onChange={e => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              required
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" disabled={uploading}>
                {uploading ? 'Téléversement...' : 'Ajouter une image'}
                <input type="file" accept="image/*" hidden onChange={onSelectImage} />
              </Button>
              {Array.isArray(announcementForm.attachments) && announcementForm.attachments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {announcementForm.attachments.map((u: string, idx: number) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img src={u} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
            <TextField
              select
              label="Type"
              value={announcementForm.type}
              onChange={e => setAnnouncementForm(prev => ({ ...prev, type: e.target.value, targetService: '', recipient: '', serviceId: '' }))}
              fullWidth
              required
            >
              <MenuItem value="internal">Interne</MenuItem>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Privé</MenuItem>
            </TextField>
            
            {/* Service selection for internal and private announcements */}
            {(announcementForm.type === 'private' || announcementForm.type === 'internal') && (
              <TextField
                select
                label="Service destinataire"
                value={announcementForm.targetService}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, targetService: e.target.value, serviceId: e.target.value, recipient: '' }))}
                fullWidth
                required
              >
                {services.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                ))}
              </TextField>
            )}

            {/* Target role selection for internal announcements */}
            {announcementForm.type === 'internal' && announcementForm.targetService && (
              <TextField
                select
                label="Destinataires"
                value={announcementForm.targetRole}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, targetRole: e.target.value }))}
                fullWidth
                required
                helperText="Choisissez qui recevra cette annonce interne"
              >
                <MenuItem value="admin">Administrateurs seulement</MenuItem>
                <MenuItem value="all">Tous les membres (admins et employés)</MenuItem>
              </TextField>
            )}
            
            {/* User selection only for private announcements after service is selected */}
            {announcementForm.type === 'private' && announcementForm.targetService && (
              <TextField
                select
                label="Membre destinataire"
                value={announcementForm.recipient}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, recipient: e.target.value }))}
                fullWidth
                required
              >
                {serviceMembers.length > 0 ? (
                  serviceMembers.map(u => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name} ({u.email || u.matricule || "Sans identifiant"})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>Chargement des membres...</MenuItem>
                )}
              </TextField>
            )}
            
            {/* Show who will receive the internal announcement */}
            {announcementForm.type === 'internal' && announcementForm.targetService && serviceMembers.length > 0 && (
              <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cette annonce sera envoyée aux {announcementForm.targetRole === 'admin' ? 'administrateurs' : 'membres'} du service sélectionné:
                </Typography>
                <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {serviceMembers
                    .filter(u => announcementForm.targetRole === 'all' || u.role === 'admin')
                    .map(u => (
                      <Box key={u._id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={u.role === 'admin' ? 'Admin' : 'Employé'} 
                          size="small" 
                          color={u.role === 'admin' ? 'primary' : 'default'} 
                          sx={{ mr: 1 }} 
                        />
                        <Typography variant="body2">
                          {u.name} {u.email ? `(${u.email})` : u.matricule ? `(${u.matricule})` : ''}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}
            {/* Optionally add attachments, targetService fields here if needed */}
            {announcementError && <Typography color="error">{announcementError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={createAnnouncement}
            disabled={announcementLoading || !announcementForm.title || !announcementForm.content || (announcementForm.type === 'private' && !announcementForm.recipient)}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

function AnnouncementsTable({ mode }: { mode: 'sent' | 'received' }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    attachments: [] as string[]
  })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get(`/announcements/${mode}`)
      setRows(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [mode])

  async function onDelete(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return
    try {
      await api.delete(`/announcements/${id}`)
      setRows(prev => prev.filter(r => r._id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la suppression')
    }
  }

  async function sendReply() {
    if (!replyTo) return
    try {
      const payload: any = {
        title: `RE: ${replyTo.title}`,
        content: replyContent,
        type: 'private',
        targetService: replyTo.service?._id || replyTo.service,
        recipient: replyTo.createdBy?._id || replyTo.createdBy,
        attachments: replyAttachments
      }
      await api.post('/announcements', payload)
      setReplyTo(null)
      setReplyContent('')
      setReplyAttachments([])
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la réponse')
    }
  }
  
  async function updateAnnouncement() {
    if (!editingAnnouncement) return
    try {
      await api.put(`/announcements/${editingAnnouncement._id}`, {
        title: editForm.title,
        content: editForm.content,
        attachments: editForm.attachments
      })
      // Mettre à jour l'élément dans la liste
      setRows(prev => prev.map(row => 
        row._id === editingAnnouncement._id 
          ? { ...row, title: editForm.title, content: editForm.content, attachments: editForm.attachments }
          : row
      ))
      setEditingAnnouncement(null)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la modification')
    }
  }

  return (
    <>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Créée le</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>{loading ? 'Chargement...' : 'Aucune annonce'}</TableCell>
              </TableRow>
            ) : rows.map(a => (
              <TableRow key={a._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => setSelected(a)}>
                    {Array.isArray(a.attachments) && a.attachments[0] && (
                      <img 
                        src={a.attachments[0]} 
                        alt="" 
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                      />
                    )}
                    <span>{a.title}</span>
                  </Box>
                </TableCell>
                <TableCell>{a.service?.name || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={a.status}
                    color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : a.status === 'rejected' ? 'error' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : '-'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => setSelected(a)} title="Voir">
                      <VisibilityIcon />
                    </IconButton>
                    {mode === 'received' && (
                      <IconButton size="small" onClick={() => setReplyTo(a)} title="Répondre">
                        <ReplyIcon />
                      </IconButton>
                    )}
                    {mode === 'sent' && (
                      <IconButton size="small" onClick={() => {
                        setEditingAnnouncement(a);
                        setEditForm({
                          title: a.title,
                          content: a.content,
                          attachments: a.attachments || []
                        });
                      }} title="Modifier">
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => onDelete(a._id)} title="Supprimer">
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent dividers>
          {Array.isArray(selected?.attachments) && selected?.attachments[0] && (
            <Box sx={{ mb: 2 }}>
              <img src={selected.attachments[0]} alt="image" style={{ width: '100%', borderRadius: 6 }} />
            </Box>
          )}
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selected?.content}</Typography>
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
      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onClose={() => setReplyTo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Répondre à: {replyTo?.createdBy?.name || '—'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Message" value={replyContent} onChange={e => setReplyContent(e.target.value)} fullWidth multiline rows={4} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" disabled={uploading}>
                {uploading ? 'Téléversement...' : 'Ajouter une image'}
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  
                  const form = new FormData();
                  form.append('file', file);
                  
                  api.post('/uploads/image', form, { 
                    headers: { 'Content-Type': 'multipart/form-data' } 
                  })
                  .then(r => {
                    // Store the uploaded image URL in the component state
                    setReplyAttachments(prev => [...prev, r.data.url]);
                  })
                  .catch(err => {
                    const errorMessage = err?.response?.data?.error ?? 'Upload échoué';
                    setError(errorMessage);
                  })
                  .finally(() => {
                    setUploading(false);
                  });
                }} />
              </Button>
              {Array.isArray(replyAttachments) && replyAttachments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {replyAttachments.map((url, idx) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img src={url} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}
                        onClick={() => {
                          setReplyAttachments(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyTo(null)}>Annuler</Button>
          <Button variant="contained" onClick={sendReply} disabled={!replyContent.trim()}>Envoyer</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edition Dialog */}
      <Dialog open={!!editingAnnouncement} onClose={() => setEditingAnnouncement(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'annonce</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titre"
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Contenu"
              value={editForm.content}
              onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              required
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" disabled={uploading}>
                {uploading ? 'Téléversement...' : 'Modifier les images'}
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  
                  console.log("Editing mode - Uploading file:", file.name, file.type, file.size);
                  
                  const form = new FormData();
                  form.append('file', file);
                  api.post('/uploads/image', form, { 
                    headers: { 'Content-Type': 'multipart/form-data' } 
                  })
                  .then(r => {
                    console.log("Editing mode - Upload successful, response:", r.data);
                    setEditForm(prev => ({ 
                      ...prev, 
                      attachments: [...(prev.attachments || []), r.data.url] 
                    }));
                  })
                  .catch(err => {
                    console.error("Editing mode - Upload error details:", err);
                    const errorMessage = err?.response?.data?.error ?? 'Upload échoué';
                    console.error("Editing mode - Error message:", errorMessage);
                    setError(errorMessage);
                  })
                  .finally(() => {
                    setUploading(false);
                  });
                }} />
              </Button>
              {Array.isArray(editForm.attachments) && editForm.attachments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {editForm.attachments.map((url: string, idx: number) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img src={url} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}
                        onClick={() => {
                          setEditForm(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== idx)
                          }));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAnnouncement(null)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={updateAnnouncement}
            disabled={!editForm.title || !editForm.content}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}



