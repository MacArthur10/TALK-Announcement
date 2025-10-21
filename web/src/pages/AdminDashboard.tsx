import React, { useEffect, useState } from 'react'
import api from '../shared/api'
import Layout from '../shared/Layout'
import { useAuth } from '../shared/useAuth'
import { Paper, Stack, TextField, Typography, Button, MenuItem, Card, CardContent, Chip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, IconButton, Divider, Grid, CircularProgress } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Reply as ReplyIcon, Refresh as RefreshIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Link as LinkIcon } from '@mui/icons-material'
import { useMemo } from 'react'

export default function AdminDashboard() {
  const { role, serviceName, serviceId } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'internal' | 'public' | 'private'>('internal')
  const [targetRole, setTargetRole] = useState<'admin' | 'all'>('all')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [services, setServices] = useState<any[]>([])
  const [serviceMembers, setServiceMembers] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  const [links, setLinks] = useState<{url: string, title: string}[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [targetScope, setTargetScope] = useState<'all' | 'specific'>('all')
  const [annTab, setAnnTab] = useState<'received' | 'sent'>('received')

  useEffect(() => {
    api.get('/announcements/feed').then(r => setFeed(r.data)).catch(() => {})
    
    // Chargement des services (pour tous les admins)
    const loadServices = async () => {
      try {
        console.log('Fetching services...');
        const response = await api.get('/services');
        console.log('Services fetched:', response.data);
        
        if (response.data && response.data.length > 0) {
          setServices(response.data);
          
          // Si des services sont disponibles, présélectionner le premier service ou le service de l'utilisateur
          if (serviceId) {
            setSelectedServiceId(serviceId);
          } else if (response.data.length > 0) {
            setSelectedServiceId(response.data[0]._id);
          }
        } else {
          // Si aucun service n'est retourné, utiliser la méthode de secours
          throw new Error('No services returned');
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
        
        // Méthode de secours pour tous les rôles admin et superadmin
        try {
          console.log('Attempting fallback method to get services via users...');
          const fallbackResponse = await api.get('/auth/super/users');
          
          // Extraire les services uniques des utilisateurs
          const uniqueServices = fallbackResponse.data.reduce((acc: any[], user: any) => {
            if (user.service && !acc.some((s: any) => s._id === user.service._id)) {
              acc.push(user.service);
            }
            return acc;
          }, []);
          
          console.log('Services extracted from users (fallback):', uniqueServices);
          
          if (uniqueServices.length > 0) {
            setServices(uniqueServices);
            
            // Présélectionner un service
            if (serviceId) {
              setSelectedServiceId(serviceId);
            } else if (uniqueServices.length > 0) {
              setSelectedServiceId(uniqueServices[0]._id);
            }
          }
        } catch (fallbackError) {
          console.error("Erreur lors du chargement des utilisateurs (fallback):", fallbackError);
          setError("Impossible de charger les services. Veuillez réessayer.");
        }
      }
    };
    
    loadServices();
    
    // Pas besoin de précharger les membres du service, ils seront chargés quand un service sera sélectionné
    setServiceMembers([]);
  }, [role, serviceId])
  
  // Fonction pour charger les membres d'un service
  const loadServiceMembers = async (serviceId: string) => {
    try {
      console.log(`Loading members for service ${serviceId}...`);
      const response = await api.get(`/auth/members?serviceId=${serviceId}`);
      console.log(`Members fetched for service ${serviceId}:`, response.data);
      setServiceMembers(response.data);
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors du chargement des membres du service:", error);
      
      // Message d'erreur plus clair pour l'utilisateur
      setError(`Impossible de charger les membres du service: ${
        error?.response?.data?.error || error?.message || 'Erreur inconnue'
      }`);
      
      // Fallback pour tous les utilisateurs (admin et superadmin)
      try {
        console.log("Trying fallback method using all users...");
        const fallbackResponse = await api.get('/auth/super/users');
        const filteredUsers = fallbackResponse.data.filter((user: any) => 
          user.service && String(user.service._id) === serviceId
        );
        console.log(`Fallback found ${filteredUsers.length} members`);
        if (filteredUsers.length > 0) {
          setServiceMembers(filteredUsers);
          setError(null); // Clear error if fallback succeeds
          return filteredUsers;
        }
      } catch (fallbackError) {
        console.error("Erreur du fallback:", fallbackError);
      }
      return [];
    }
  };
  
  // Effet pour charger les membres du service sélectionné
  useEffect(() => {
    // Pour les annonces privées, on charge les membres du service sélectionné
    if (type === 'private' && selectedServiceId) {
      loadServiceMembers(selectedServiceId);
    }
    // Pour les annonces internes, on charge uniquement les membres du service de l'admin
    else if (type === 'internal' && serviceId) {
      loadServiceMembers(serviceId);
    } 
    else {
      // Pour les autres cas, on vide la liste des membres
      setServiceMembers([]);
      if (selectedServiceId && type !== 'private' && type !== 'internal') {
        console.log(`Service ${selectedServiceId} selected but type is not 'private' or 'internal': ${type}`);
      }
    }
  }, [selectedServiceId, type, serviceId])

  async function publish() {
    try {
      // Vérifications préliminaires
      if (!title.trim() || !content.trim()) {
        throw new Error("Le titre et le contenu sont obligatoires");
      }
      
      if (!selectedServiceId && !(type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'all')) {
        throw new Error("Veuillez sélectionner un service");
      }
      
      if (type === 'private' && !selectedRecipientId) {
        throw new Error("Veuillez sélectionner un destinataire");
      }
      
      // Pour les annonces internes, vérifier que le serviceId de l'utilisateur est utilisé
      if (type === 'internal' && selectedServiceId !== serviceId) {
        throw new Error("Les annonces internes doivent être envoyées à votre propre service");
      }
      
      const payload: any = { 
        title, 
        content, 
        type,
        // Pour les annonces internes, utiliser toujours le service de l'utilisateur
        // Pour les annonces publiques de la Cellule de Communication avec scope 'all', ne pas définir de serviceId
        // Pour les annonces publiques des autres services, utiliser le service de l'utilisateur comme créateur
        serviceId: type === 'internal' ? serviceId : 
                  (type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'all') ? undefined : 
                  (type === 'public' && serviceName !== 'Cellule de Communication') ? serviceId :
                  selectedServiceId
      };
      
      // Configuration pour les annonces privées
      if (type === 'private') {
        // Utiliser le service sélectionné comme service cible
        payload.targetService = selectedServiceId;
        
        // Le destinataire est obligatoire pour les annonces privées
        payload.recipient = selectedRecipientId;
      }
      
      // Configuration pour les annonces internes
      if (type === 'internal') {
        // Pour les annonces internes, le service cible est toujours le service de l'admin
        payload.targetService = serviceId;
        // Ajout du rôle cible (admin ou tous)
        payload.targetRole = targetRole;
      }
      
      // Ajout des pièces jointes si présentes
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      // Ajout des liens si présents
      if (links.length > 0) {
        payload.links = links;
      }
      
      // Configuration pour les annonces publiques de la Cellule de Communication
      if (type === 'public' && serviceName === 'Cellule de Communication') {
        if (targetScope === 'specific') {
          // Pour les annonces publiques spécifiques, utiliser le service sélectionné comme cible
          payload.targetService = selectedServiceId;
        }
        // Pour les annonces publiques générales, ne pas définir de targetService
        payload.targetScope = targetScope;
      }
      
      // Envoi de l'annonce
      const response = await api.post('/announcements', payload);
      
      // Montrer un message de succès spécifique pour les annonces publiques de la Cellule de Communication
      if (type === 'public' && serviceName === 'Cellule de Communication') {
        setError("Votre annonce publique a été publiée directement et sera visible sur l'application mobile");
      } else if (type === 'public') {
        setError("Votre annonce publique a été envoyée pour validation à la Cellule de Communication");
      }
      
      // Réinitialisation du formulaire
      setTitle('');
      setContent('');
      setType('internal');
      setTargetRole('all');
      setSelectedServiceId('');
      setSelectedRecipientId('');
      setAttachments([]);
      setLinks([]);
      setNewLinkUrl('');
      setNewLinkTitle('');
      setTargetScope('all'); // Reset targetScope
      
      // Rechargement du flux
      api.get('/announcements/feed').then(r => setFeed(r.data)).catch(() => {});
    } catch (e: any) {
      console.error("Erreur lors de la publication:", e);
      setError(e?.message || e?.response?.data?.error || 'Erreur lors de la publication');
    }
  }

  async function onSelectImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await api.post('/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAttachments(prev => [...prev, r.data.url])
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Upload échoué')
    }
    setUploading(false)
  }
  
  // Fonction pour ajouter un lien à l'annonce
  function addLink() {
    if (!newLinkUrl) return
    
    // Vérifier si l'URL est valide
    try {
      // Ajouter http:// si aucun protocole n'est spécifié
      let url = newLinkUrl
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url
      }
      
      new URL(url) // Vérifie si l'URL est valide
      
      setLinks(prev => [...prev, { url, title: newLinkTitle || url }])
      
      // Réinitialiser les champs
      setNewLinkUrl('')
      setNewLinkTitle('')
    } catch (e) {
      setError('URL invalide')
    }
  }
  
  // Fonction pour supprimer un lien
  function removeLink(index: number) {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }

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
        Admin - Annonces
      </Typography>
      
      {/* Section pour la Cellule de Communication */}
      {role === 'admin' && serviceName === 'Cellule de Communication' && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Annonces publiques en attente de validation</Typography>
              <CommApprovals />
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Gérer les annonces publiques</Typography>
              <PublicAnnouncementsManager />
            </CardContent>
          </Card>
        </>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Créer une annonce</Typography>
          <Stack spacing={2}>
            <TextField 
              label="Titre" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              fullWidth 
              size="small"
            />
            <TextField 
              label="Contenu" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              fullWidth 
              multiline 
              minRows={3}
              size="small"
            />
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Images</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" disabled={uploading}>
                {uploading ? 'Téléversement...' : 'Ajouter une image'}
                <input type="file" accept="image/*" hidden onChange={onSelectImage} />
              </Button>
              {Array.isArray(attachments) && attachments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {attachments.map((url, idx) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img src={url} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}
                        onClick={() => {
                          setAttachments(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
            
            {/* Section des liens */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Liens web</Typography>
            {links.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {links.map((link, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button 
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<LinkIcon />}
                      sx={{ flex: 1 }}
                    >
                      {link.title || link.url}
                    </Button>
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={() => removeLink(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
              <TextField
                label="URL"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                size="small"
                sx={{ flex: 2 }}
              />
              <TextField
                label="Titre (optionnel)"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Nom du lien"
                size="small"
                sx={{ flex: 2 }}
              />
              <Button 
                variant="outlined"
                onClick={addLink}
                disabled={!newLinkUrl}
                size="small"
                sx={{ mt: 0.5 }}
              >
                Ajouter
              </Button>
            </Box>
            <TextField 
              select 
              label="Type" 
              value={type} 
              onChange={e => {
                const newType = e.target.value as any;
                setType(newType);
                setSelectedRecipientId(''); // Reset recipient when changing type
                
                // Pour les annonces internes, forcer l'utilisation du service de l'admin
                if (newType === 'internal' && serviceId) {
                  setSelectedServiceId(serviceId);
                }
                
                // Pour les annonces publiques de la Cellule de Communication, permettre le choix du scope
                if (newType === 'public' && serviceName === 'Cellule de Communication') {
                  setTargetScope('all'); // Default to all services
                }
              }} 
              fullWidth
              size="small"
            >
              <MenuItem value="internal">Interne</MenuItem>
              <MenuItem value="public">
                {serviceName === 'Cellule de Communication' ? 'Publique (directe)' : 'Publique (validation)'}
              </MenuItem>
              <MenuItem value="private">Privée</MenuItem>
            </TextField>
            
            {/* Target Scope selection for Communication Service public announcements */}
            {type === 'public' && serviceName === 'Cellule de Communication' && (
              <TextField 
                select 
                label="Cible" 
                value={targetScope} 
                onChange={e => setTargetScope(e.target.value as 'all' | 'specific')} 
                fullWidth
                size="small"
                helperText="Choisir si l'annonce s'adresse à tous les services ou à un service spécifique"
              >
                <MenuItem value="all">Tous les services</MenuItem>
                <MenuItem value="specific">Service spécifique</MenuItem>
              </TextField>
            )}

            {/* Sélection de service pour les admins (restreinte pour internal) */}
            {(type === 'internal' || 
              (type === 'public' && serviceName === 'Cellule de Communication') || 
              type === 'private') && (
              <TextField
                select
                label="Service"
                value={selectedServiceId}
                onChange={e => {
                  setSelectedServiceId(e.target.value);
                  setSelectedRecipientId(''); // Reset recipient when changing service
                }}
                fullWidth
                size="small"
                required={
                  type === 'internal' || 
                  (type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'specific')
                }
                disabled={
                  type === 'internal' || 
                  (type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'all')
                }
                helperText={
                  type === 'internal' 
                  ? "Les annonces internes sont limitées à votre service" 
                  : type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'all'
                  ? "L'annonce sera visible par tous les services"
                  : services.length === 0 
                  ? "Chargement des services..." 
                  : type === 'private' ? "Sélectionnez un service pour voir ses membres" : ""
                }
              >
                <MenuItem value="" disabled>Sélectionnez un service</MenuItem>
                {services.length === 0 ? (
                  <MenuItem value="" disabled>Aucun service disponible</MenuItem>
                ) : (
                  services.map(s => (
                    <MenuItem key={s._id} value={s._id} disabled={type === 'internal' && s._id !== serviceId}>
                      {s.name || 'Service sans nom'}
                      {type === 'internal' && s._id === serviceId && " (votre service)"}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}
            
            {/* Sélection du membre destinataire pour les annonces privées */}
            {type === 'private' && (
              <>
                {selectedServiceId ? (
                  serviceMembers.length > 0 ? (
                    <TextField
                      select
                      label="Membre destinataire"
                      value={selectedRecipientId}
                      onChange={e => setSelectedRecipientId(e.target.value)}
                      fullWidth
                      size="small"
                      required={type === 'private'}
                    >
                      <MenuItem value="" disabled>Sélectionnez un membre</MenuItem>
                      {serviceMembers.map(u => (
                        <MenuItem key={u._id} value={u._id}>{u.name} ({u.email || u.matricule || ""})</MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Aucun membre trouvé dans ce service
                    </Typography>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Veuillez sélectionner un service pour voir ses membres
                  </Typography>
                )}
              </>
            )}
            
            {/* Option pour choisir le public cible des annonces internes */}
            {type === 'internal' && (
              <TextField
                select
                label="Destinataires"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as 'admin' | 'all')}
                fullWidth
                size="small"
                required
                helperText="Choisissez qui recevra cette annonce interne"
              >
                <MenuItem value="admin">Administrateurs seulement</MenuItem>
                <MenuItem value="all">Tous les membres (admins et employés)</MenuItem>
              </TextField>
            )}
            
            {/* Affichage des membres du service pour les annonces internes */}
            {type === 'internal' && serviceId && (
              <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cette annonce interne sera envoyée aux {targetRole === 'admin' ? 'administrateurs' : 'membres'} de votre service:
                </Typography>
                {serviceMembers.length > 0 ? (
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {serviceMembers
                      .filter(u => targetRole === 'all' || u.role === 'admin')
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
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chargement des membres de votre service...
                  </Typography>
                )}
              </Box>
            )}
            {error && <Typography color="error">{error}</Typography>}
            <Button 
              variant="contained" 
              onClick={publish} 
              sx={{ alignSelf: 'flex-start' }}
              disabled={
                !title || 
                !content || 
                (
                  !selectedServiceId && 
                  (type === 'internal' || 
                   (type === 'public' && serviceName === 'Cellule de Communication' && targetScope === 'specific') ||
                   type === 'private')
                ) ||
                (type === 'private' && !selectedRecipientId)
              }
            >
              Publier
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Mon flux ({feed.length})</Typography>
            <Grid container spacing={2}>
              {feed.map(a => (
                <Grid xs={12} sm={6} md={4} key={a._id}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    {a.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {a.content.substring(0, 100)}...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
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
    </Layout>
  )
}

function CommApprovals() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const r = await api.get('/announcements/pending')
      setRows(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    try {
      await api.post(`/announcements/${id}/approve`)
      setRows(prev => prev.filter(r => r._id !== id))
      setSuccessMessage("L'annonce a été approuvée et sera visible sur l'application mobile")
      setViewDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de l\'approbation')
    }
  }

  async function reject(id: string) {
    try {
      await api.post(`/announcements/${id}/reject`)
      setRows(prev => prev.filter(r => r._id !== id))
      setSuccessMessage("L'annonce a été rejetée")
      setViewDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors du rejet')
    }
  }
  
  // Ouvrir le dialogue pour voir l'annonce en détail
  function viewAnnouncement(announcement: any) {
    setSelectedAnnouncement(announcement)
    setViewDialogOpen(true)
  }

  return (
    <>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {successMessage && <Typography color="success" sx={{ mb: 2 }}>{successMessage}</Typography>}
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">
          {rows.length} annonce{rows.length !== 1 ? 's' : ''} en attente de validation
        </Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />} 
          onClick={() => load()}
          disabled={loading}
        >
          Rafraîchir
        </Button>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Créée le</TableCell>
              <TableCell>Auteur</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>{loading ? 'Chargement...' : 'Aucune annonce en attente'}</TableCell>
              </TableRow>
            ) : rows.map(a => (
              <TableRow key={a._id} hover>
                <TableCell>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }} 
                    onClick={() => viewAnnouncement(a)}
                  >
                    {a.title}
                  </Box>
                </TableCell>
                <TableCell>{a.service?.name || '-'}</TableCell>
                <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : '-'}</TableCell>
                <TableCell>{a.createdBy?.name || '-'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={() => viewAnnouncement(a)}>
                      Voir
                    </Button>
                    <Button size="small" color="success" variant="contained" onClick={() => approve(a._id)}>
                      Approuver
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => reject(a._id)}>
                      Rejeter
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialogue pour voir une annonce en détail */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnnouncement && (
          <>
            <DialogTitle>
              Vérification d'annonce publique
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    {selectedAnnouncement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Créée le {new Date(selectedAnnouncement.createdAt).toLocaleString('fr-FR')} par {selectedAnnouncement.createdBy?.name || 'Inconnu'} du service {selectedAnnouncement.service?.name || 'Inconnu'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAnnouncement.content}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pièces jointes
                  </Typography>
                  {Array.isArray(selectedAnnouncement.attachments) && selectedAnnouncement.attachments.length > 0 ? (
                    selectedAnnouncement.attachments.map((url: string, idx: number) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <img 
                          src={url} 
                          alt="Pièce jointe" 
                          style={{ maxWidth: '100%', borderRadius: '8px' }} 
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune pièce jointe
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Fermer
              </Button>
              <Button color="error" variant="outlined" onClick={() => reject(selectedAnnouncement._id)}>
                Rejeter
              </Button>
              <Button color="success" variant="contained" onClick={() => approve(selectedAnnouncement._id)}>
                Approuver et publier
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

// Composant pour la gestion des annonces publiques par la Cellule de Communication
function PublicAnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    attachments: [] as string[],
    links: [] as {url: string, title: string}[]
  })
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Charger toutes les annonces publiques
  async function loadPublicAnnouncements() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await api.get('/announcements/public')
      setAnnouncements(response.data)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors du chargement des annonces publiques')
    }
    setLoading(false)
  }
  
  useEffect(() => {
    loadPublicAnnouncements()
  }, [])
  
  // Filtrer les annonces selon le statut sélectionné
  const filteredAnnouncements = useMemo(() => {
    if (filterStatus === 'all') return announcements
    return announcements.filter(a => a.status === filterStatus)
  }, [announcements, filterStatus])
  
  // Changer le statut d'une annonce (approuver ou rejeter)
  async function changeStatus(id: string, newStatus: 'approved' | 'rejected') {
    try {
      await api.post(`/announcements/${id}/${newStatus === 'approved' ? 'approve' : 'reject'}`)
      
      // Mettre à jour l'état local sans recharger toutes les données
      setAnnouncements(prev => 
        prev.map(a => a._id === id ? { ...a, status: newStatus } : a)
      )
      
      setSuccessMessage(`L'annonce a été ${newStatus === 'approved' ? 'approuvée' : 'rejetée'}`)
      setViewDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? `Erreur lors du changement de statut`)
    }
  }
  
  // Supprimer une annonce
  async function deleteAnnouncement(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return
    
    try {
      await api.delete(`/announcements/${id}`)
      setAnnouncements(prev => prev.filter(a => a._id !== id))
      setSuccessMessage("L'annonce a été supprimée")
      setViewDialogOpen(false)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la suppression')
    }
  }
  
  // Ouvrir le dialogue pour voir une annonce
  function viewAnnouncement(announcement: any) {
    setSelectedAnnouncement(announcement)
    setViewDialogOpen(true)
  }
  
  // Ouvrir le dialogue d'édition
  function openEditDialog(announcement: any) {
    setSelectedAnnouncement(announcement)
    setEditForm({
      title: announcement.title || '',
      content: announcement.content || '',
      attachments: announcement.attachments || [],
      links: announcement.links || []
    })
    setNewLinkUrl('')
    setNewLinkTitle('')
    setEditDialogOpen(true)
  }
  
  // Ajouter un nouveau lien
  function addLink() {
    if (!newLinkUrl) return
    
    // Vérifier si l'URL est valide
    try {
      // Ajouter http:// si aucun protocole n'est spécifié
      let url = newLinkUrl
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url
      }
      
      new URL(url) // Vérifie si l'URL est valide
      
      setEditForm(prev => ({
        ...prev,
        links: [...prev.links, { 
          url, 
          title: newLinkTitle || url 
        }]
      }))
      
      // Réinitialiser les champs
      setNewLinkUrl('')
      setNewLinkTitle('')
    } catch (e) {
      setError('URL invalide')
    }
  }
  
  // Supprimer un lien
  function removeLink(index: number) {
    setEditForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }))
  }
  
  // Ajouter une image
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await api.post('/uploads/image', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      setEditForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, response.data.url]
      }))
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erreur lors du téléversement')
    } finally {
      setUploading(false)
    }
  }
  
  // Supprimer une image
  function removeAttachment(index: number) {
    setEditForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }
  
  // Sauvegarder les modifications
  async function saveChanges() {
    if (!selectedAnnouncement) return
    
    try {
      const response = await api.put(`/announcements/${selectedAnnouncement._id}`, editForm)
      
      // Mettre à jour l'annonce dans la liste
      setAnnouncements(prev => 
        prev.map(a => a._id === selectedAnnouncement._id ? response.data : a)
      )
      
      setEditDialogOpen(false)
      setEditForm({ title: '', content: '', attachments: [], links: [] })
      setNewLinkUrl('')
      setNewLinkTitle('')
      setSuccessMessage("L'annonce a été mise à jour avec succès")
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la mise à jour')
    }
  }
  
  // Récupérer la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }
  
  // Récupérer le libellé du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvée'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejetée'
      default: return status
    }
  }
  
  return (
    <>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {successMessage && <Typography color="success" sx={{ mb: 2 }}>{successMessage}</Typography>}
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          select
          label="Filtrer par statut"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Tous</MenuItem>
          <MenuItem value="approved">Approuvées</MenuItem>
          <MenuItem value="pending">En attente</MenuItem>
          <MenuItem value="rejected">Rejetées</MenuItem>
        </TextField>
        
        <Button 
          size="small" 
          startIcon={<RefreshIcon />} 
          onClick={() => loadPublicAnnouncements()}
          disabled={loading}
        >
          Rafraîchir
        </Button>
      </Box>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Créée le</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  {loading ? 'Chargement...' : 'Aucune annonce trouvée'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAnnouncements.map(a => (
                <TableRow key={a._id} hover>
                  <TableCell>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }} 
                      onClick={() => viewAnnouncement(a)}
                    >
                      {a.title}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(a.status)}
                      color={getStatusColor(a.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{a.service?.name || '-'}</TableCell>
                  <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : '-'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => viewAnnouncement(a)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      {a.status === 'pending' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => changeStatus(a._id, 'approved')}
                            title="Approuver"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => changeStatus(a._id, 'rejected')}
                            title="Rejeter"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      
                      {a.status === 'rejected' && (
                        <IconButton 
                          size="small" 
                          color="success" 
                          onClick={() => changeStatus(a._id, 'approved')}
                          title="Approuver"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      {a.status === 'approved' && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => changeStatus(a._id, 'rejected')}
                          title="Rejeter"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => deleteAnnouncement(a._id)}
                        title="Supprimer"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialogue pour voir une annonce en détail */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnnouncement && (
          <>
            <DialogTitle>
              Détail de l'annonce publique
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {selectedAnnouncement.title}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(selectedAnnouncement.status)}
                      color={getStatusColor(selectedAnnouncement.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Créée le {new Date(selectedAnnouncement.createdAt).toLocaleString('fr-FR')} par {selectedAnnouncement.createdBy?.name || 'Inconnu'} du service {selectedAnnouncement.service?.name || 'Inconnu'}
                    {selectedAnnouncement.modifiedBy && selectedAnnouncement.modifiedAt && (
                      <Box component="span" sx={{ display: 'block', mt: 1 }}>
                        Modifiée le {new Date(selectedAnnouncement.modifiedAt).toLocaleString('fr-FR')} par {selectedAnnouncement.modifiedBy?.name || 'Inconnu'}
                      </Box>
                    )}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAnnouncement.content}
                  </Typography>
                  
                  {/* Affichage des liens */}
                  {Array.isArray(selectedAnnouncement.links) && selectedAnnouncement.links.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Liens
                      </Typography>
                      <Stack spacing={1}>
                        {selectedAnnouncement.links.map((link: {url: string, title: string}, idx: number) => (
                          <Box key={idx}>
                            <Button 
                              component="a" 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              startIcon={<LinkIcon />}
                              variant="outlined" 
                              size="small"
                            >
                              {link.title || link.url}
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pièces jointes
                  </Typography>
                  {Array.isArray(selectedAnnouncement.attachments) && selectedAnnouncement.attachments.length > 0 ? (
                    selectedAnnouncement.attachments.map((url: string, idx: number) => (
                      <Box key={idx} sx={{ mb: 2, textAlign: 'center' }}>
                        <img 
                          src={url} 
                          alt="Pièce jointe" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', // Larger images for communication team
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain', 
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune pièce jointe
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>
                Fermer
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => {
                  setViewDialogOpen(false);
                  openEditDialog(selectedAnnouncement);
                }}
              >
                Modifier
              </Button>
              
              {selectedAnnouncement.status === 'pending' && (
                <>
                  <Button color="error" variant="outlined" onClick={() => changeStatus(selectedAnnouncement._id, 'rejected')}>
                    Rejeter
                  </Button>
                  <Button color="success" variant="contained" onClick={() => changeStatus(selectedAnnouncement._id, 'approved')}>
                    Approuver
                  </Button>
                </>
              )}
              
              {selectedAnnouncement.status === 'rejected' && (
                <Button color="success" variant="contained" onClick={() => changeStatus(selectedAnnouncement._id, 'approved')}>
                  Approuver
                </Button>
              )}
              
              {selectedAnnouncement.status === 'approved' && (
                <Button color="error" variant="outlined" onClick={() => changeStatus(selectedAnnouncement._id, 'rejected')}>
                  Rejeter
                </Button>
              )}
              
              <Button color="error" onClick={() => deleteAnnouncement(selectedAnnouncement._id)}>
                Supprimer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Dialogue d'édition d'une annonce */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setEditForm({ title: '', content: '', attachments: [], links: [] })
          setNewLinkUrl('')
          setNewLinkTitle('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Modifier l'annonce publique
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Titre" 
              value={editForm.title} 
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField 
              label="Contenu" 
              value={editForm.content} 
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              multiline 
              rows={6}
              fullWidth
              required
            />
            
            {/* Section pour les liens */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Liens web</Typography>
              {Array.isArray(editForm.links) && editForm.links.length > 0 && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {editForm.links.map((link, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button 
                        component="a"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        startIcon={<LinkIcon />}
                        sx={{ flex: 1 }}
                      >
                        {link.title || link.url}
                      </Button>
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => removeLink(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
                <TextField
                  label="URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  size="small"
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Titre (optionnel)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Nom du lien"
                  size="small"
                  sx={{ flex: 2 }}
                />
                <Button 
                  variant="contained" 
                  onClick={addLink} 
                  disabled={!newLinkUrl}
                  sx={{ mt: 1 }}
                >
                  Ajouter
                </Button>
              </Box>
            </Box>
            
            {/* Section pour les images */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Images</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button 
                  component="label" 
                  variant="outlined" 
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} /> : undefined}
                >
                  {uploading ? 'Téléversement...' : 'Ajouter une image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </Stack>
              
              {Array.isArray(editForm.attachments) && editForm.attachments.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {editForm.attachments.map((url, idx) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img 
                        src={url} 
                        alt={`Attachment ${idx + 1}`} 
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <IconButton
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: -8, 
                          right: -8, 
                          bgcolor: 'background.paper',
                          boxShadow: 1
                        }}
                        onClick={() => removeAttachment(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={saveChanges}
            disabled={!editForm.title || !editForm.content}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function AnnouncementsTable({ mode }: { mode: 'received' | 'sent' }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editAttachments, setEditAttachments] = useState<string[]>([])
  const [editLinks, setEditLinks] = useState<{url: string, title: string}[]>([])
  const [editNewLinkUrl, setEditNewLinkUrl] = useState('')
  const [editNewLinkTitle, setEditNewLinkTitle] = useState('')
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<string[]>([])
  const [replyLinks, setReplyLinks] = useState<{url: string, title: string}[]>([])
  const [replyNewLinkUrl, setReplyNewLinkUrl] = useState('')
  const [replyNewLinkTitle, setReplyNewLinkTitle] = useState('')

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
        attachments: replyAttachments,
        links: replyLinks
      }
      await api.post('/announcements', payload)
      setReplyTo(null)
      setReplyContent('')
      setReplyAttachments([])
      setReplyLinks([])
      setReplyNewLinkUrl('')
      setReplyNewLinkTitle('')
      // Optionally reload received list
      load()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la réponse')
    }
  }

  function openEdit(a: any) {
    setEditing(a)
    setEditTitle(a.title)
    setEditContent(a.content)
    setEditAttachments(a.attachments || [])
    setEditLinks(a.links || [])
  }

  async function saveEdit() {
    if (!editing) return
    try {
      const r = await api.put(`/announcements/${editing._id}`, { 
        title: editTitle, 
        content: editContent,
        attachments: editAttachments,
        links: editLinks
      })
      setRows(prev => prev.map(x => x._id === editing._id ? r.data : x))
      setEditing(null)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la mise à jour')
    }
  }
  
  // Ajouter un lien en mode édition
  function addEditLink() {
    if (!editNewLinkUrl) return
    
    try {
      // Ajouter http:// si aucun protocole n'est spécifié
      let url = editNewLinkUrl
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url
      }
      
      new URL(url) // Vérifie si l'URL est valide
      
      setEditLinks(prev => [...prev, { url, title: editNewLinkTitle || url }])
      
      // Réinitialiser les champs
      setEditNewLinkUrl('')
      setEditNewLinkTitle('')
    } catch (e) {
      setError('URL invalide')
    }
  }
  
  // Supprimer un lien en mode édition
  function removeEditLink(index: number) {
    setEditLinks(prev => prev.filter((_, i) => i !== index))
  }
  
  // Ajouter un lien en mode réponse
  function addReplyLink() {
    if (!replyNewLinkUrl) return
    
    try {
      // Ajouter http:// si aucun protocole n'est spécifié
      let url = replyNewLinkUrl
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url
      }
      
      new URL(url) // Vérifie si l'URL est valide
      
      setReplyLinks(prev => [...prev, { url, title: replyNewLinkTitle || url }])
      
      // Réinitialiser les champs
      setReplyNewLinkUrl('')
      setReplyNewLinkTitle('')
    } catch (e) {
      setError('URL invalide')
    }
  }
  
  // Supprimer un lien en mode réponse
  function removeReplyLink(index: number) {
    setReplyLinks(prev => prev.filter((_, i) => i !== index))
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
                  {mode === 'sent' ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => setSelected(a)} title="Voir">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEdit(a)} title="Modifier">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => onDelete(a._id)} title="Supprimer">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => setSelected(a)} title="Voir">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => setReplyTo(a)} title="Répondre">
                        <ReplyIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => onDelete(a._id)} title="Supprimer">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent dividers>
          {Array.isArray(selected?.attachments) && selected?.attachments[0] && (
            <Box sx={{ mb: 2 }}>
              <img src={selected.attachments[0]} alt="image" style={{ width: '100%', borderRadius: 6 }} />
            </Box>
          )}
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selected?.content}</Typography>
          
          {/* Affichage des liens */}
          {Array.isArray(selected?.links) && selected?.links.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Liens
              </Typography>
              <Stack spacing={1}>
                {selected.links.map((link: {url: string, title: string}, idx: number) => (
                  <Button 
                    key={idx}
                    component="a" 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    startIcon={<LinkIcon />}
                    variant="outlined" 
                    size="small"
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {link.title || link.url}
                  </Button>
                ))}
              </Stack>
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

      {/* Edit Dialog for Sent */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'annonce</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Titre" value={editTitle} onChange={e => setEditTitle(e.target.value)} fullWidth />
            <TextField label="Contenu" value={editContent} onChange={e => setEditContent(e.target.value)} fullWidth multiline rows={4} />
            
            {/* Section des images */}
            <Typography variant="subtitle2">Images</Typography>
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
                    setEditAttachments(prev => [...prev, r.data.url]);
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
            </Stack>
            
            {Array.isArray(editAttachments) && editAttachments.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {editAttachments.map((url, idx) => (
                  <Box key={idx} sx={{ position: 'relative' }}>
                    <img src={url} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                    <IconButton 
                      size="small" 
                      sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}
                      onClick={() => {
                        setEditAttachments(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Section des liens */}
            <Typography variant="subtitle2">Liens web</Typography>
            {editLinks.length > 0 && (
              <Stack spacing={1}>
                {editLinks.map((link, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button 
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<LinkIcon />}
                      sx={{ flex: 1 }}
                    >
                      {link.title || link.url}
                    </Button>
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={() => removeEditLink(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                label="URL"
                value={editNewLinkUrl}
                onChange={(e) => setEditNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                size="small"
                sx={{ flex: 2 }}
              />
              <TextField
                label="Titre (optionnel)"
                value={editNewLinkTitle}
                onChange={(e) => setEditNewLinkTitle(e.target.value)}
                placeholder="Nom du lien"
                size="small"
                sx={{ flex: 2 }}
              />
              <Button 
                variant="outlined" 
                onClick={addEditLink} 
                disabled={!editNewLinkUrl}
                sx={{ mt: 0.5 }}
              >
                Ajouter
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Annuler</Button>
          <Button variant="contained" onClick={saveEdit} disabled={!editTitle || !editContent}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog for Received */}
      <Dialog open={!!replyTo} onClose={() => setReplyTo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Répondre à: {replyTo?.createdBy?.name || '—'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Message" value={replyContent} onChange={e => setReplyContent(e.target.value)} fullWidth multiline rows={4} />
            
            {/* Section des images */}
            <Typography variant="subtitle2">Images</Typography>
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
            </Stack>
            
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
            
            {/* Section des liens */}
            <Typography variant="subtitle2">Liens web</Typography>
            {replyLinks.length > 0 && (
              <Stack spacing={1}>
                {replyLinks.map((link, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button 
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<LinkIcon />}
                      sx={{ flex: 1 }}
                    >
                      {link.title || link.url}
                    </Button>
                    <IconButton 
                      size="small"
                      color="error"
                      onClick={() => removeReplyLink(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                label="URL"
                value={replyNewLinkUrl}
                onChange={(e) => setReplyNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                size="small"
                sx={{ flex: 2 }}
              />
              <TextField
                label="Titre (optionnel)"
                value={replyNewLinkTitle}
                onChange={(e) => setReplyNewLinkTitle(e.target.value)}
                placeholder="Nom du lien"
                size="small"
                sx={{ flex: 2 }}
              />
              <Button 
                variant="outlined" 
                onClick={addReplyLink} 
                disabled={!replyNewLinkUrl}
                sx={{ mt: 0.5 }}
              >
                Ajouter
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyTo(null)}>Annuler</Button>
          <Button variant="contained" onClick={sendReply} disabled={!replyContent.trim()}>Envoyer</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}


