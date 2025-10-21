import React, { useState, useEffect } from 'react'
import api from '../shared/api'
import Layout from '../shared/Layout'
import { Box, Button, Card, CardContent, Typography, Stack, Alert, 
  TextField, LinearProgress, Paper, Divider, Chip, Grid } from '@mui/material'

export default function UploadTest() {
  const [cloudinaryStatus, setCloudinaryStatus] = useState<any>(null)
  const [fileUploadResult, setFileUploadResult] = useState<any>(null)
  const [memoryUploadResult, setMemoryUploadResult] = useState<any>(null)
  const [directUploadResult, setDirectUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Fonction d'ajout de logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }
  
  useEffect(() => {
    addLog('Outil de diagnostic d\'upload initialisé')
  }, [])
  
  async function testCloudinaryConfig() {
    setLoading(true)
    setError(null)
    addLog('Test de la configuration Cloudinary...')
    
    try {
      addLog('Envoi de la requête de test...')
      const response = await api.get('/uploads/test-cloudinary')
      addLog('✅ Test de configuration réussi')
      setCloudinaryStatus(response.data)
      
      // Analyse des résultats pour afficher des logs informatifs
      const data = response.data
      if (data.status === 'OK - Tous les tests ont réussi') {
        addLog(`✅ Cloudinary configuré avec le compte: ${data.config?.cloud_name || 'inconnu'}`)
        
        if (data.plan) {
          addLog(`ℹ️ Plan: ${data.plan.plan}, Crédits: ${data.plan.usage?.credits || 'N/A'}`)
        }
      }
    } catch (err: any) {
      console.error("Cloudinary config test error:", err)
      const errorMsg = err?.response?.data?.error || err.message || 'Test failed'
      addLog(`❌ Échec du test: ${errorMsg}`)
      setError(errorMsg)
      setCloudinaryStatus(err?.response?.data || null)
      
      // Analyse de l'erreur pour fournir des conseils
      if (errorMsg.includes('authentication')) {
        addLog('⚠️ Problème d\'authentification: vérifiez vos credentials')
      } else if (errorMsg.includes('network')) {
        addLog('⚠️ Problème réseau: vérifiez votre connexion internet')
      }
    }
    
    setLoading(false)
  }
  
  async function testMemoryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    setLoading(true)
    setError(null)
    setMemoryUploadResult(null)
    
    const fileSizeKB = (file.size / 1024).toFixed(2)
    addLog(`Test d'upload en mémoire: ${file.name} (${fileSizeKB} KB)`)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      addLog(`Formulaire préparé, envoi de la requête...`)
      
      const response = await api.post('/uploads/test-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      })
      
      addLog(`✅ Upload en mémoire réussi`)
      setMemoryUploadResult(response.data)
    } catch (err: any) {
      console.error("Memory upload test error:", err)
      const errorMsg = err?.response?.data?.error || err.message || 'Memory upload test failed'
      addLog(`❌ Échec de l'upload en mémoire: ${errorMsg}`)
      setError(errorMsg)
      
      // Informations supplémentaires pour le débogage
      if (err.response) {
        addLog(`Code d'erreur: ${err.response.status}`)
      }
    }
    
    setLoading(false)
  }
  
  async function testCloudinaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    setLoading(true)
    setError(null)
    setFileUploadResult(null)
    
    const fileDetails = {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      lastModified: new Date(file.lastModified).toISOString()
    }
    
    addLog(`Test d'upload Cloudinary: ${file.name} (${fileDetails.size})`)
    addLog(`Type de fichier: ${fileDetails.type}`)
    
    try {
      addLog('Préparation du formulaire avec le fichier...')
      const formData = new FormData()
      formData.append('file', file)
      
      addLog('Envoi de la requête vers Cloudinary...')
      const startTime = Date.now()
      
      // Définir un timeout plus long pour les uploads volumineux
      const response = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 secondes
      })
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      addLog(`✅ Upload Cloudinary réussi en ${duration}s`)
      
      // Ajout des informations de l'image uploadée
      if (response.data.url) {
        addLog(`🔗 Image disponible à: ${response.data.url}`)
      }
      
      setFileUploadResult(response.data)
    } catch (err: any) {
      console.error("Cloudinary upload test error:", err)
      
      // Afficher des informations détaillées sur l'erreur
      const errResponse = err?.response || {}
      const errData = errResponse?.data || {}
      
      // Récupérer un message d'erreur plus détaillé
      const errorMessage = errData?.error 
        || errData?.message
        || err.message 
        || 'Cloudinary upload failed'
      
      addLog(`❌ Échec de l'upload: ${errorMessage}`)
      
      // Détails supplémentaires pour le débogage
      if (errResponse.status) {
        addLog(`Code d'erreur HTTP: ${errResponse.status}`)
      }
      
      // Conseils spécifiques en fonction du type d'erreur
      if (errorMessage.includes('timeout')) {
        addLog('⚠️ Timeout - Le serveur a mis trop de temps à répondre.')
        addLog('💡 Conseil: Essayez avec un fichier plus petit ou vérifiez votre connexion.')
      } else if (errResponse.status === 413) {
        addLog('⚠️ Le fichier est trop volumineux pour être traité.')
        addLog('💡 Conseil: Réduisez la taille du fichier et réessayez.')
      } else if (errResponse.status === 500) {
        addLog('⚠️ Erreur serveur interne lors de l\'upload.')
        addLog('💡 Conseil: Vérifiez les logs du serveur pour plus de détails.')
      }
      
      setError(`Erreur (${errResponse.status || 'unknown'}): ${errorMessage}`)
      setFileUploadResult(errData || { error: errorMessage })
    }
    
    setLoading(false)
  }
  
  // Test d'upload direct avec Base64 (contournant multer)
  async function testDirectUpload() {
    if (!selectedFile) {
      addLog('⚠️ Veuillez d\'abord sélectionner un fichier')
      return
    }
    
    setLoading(true)
    setError(null)
    setDirectUploadResult(null)
    
    addLog(`Test d'upload direct: ${selectedFile.name}`)
    addLog('Conversion du fichier en Base64...')
    
    try {
      // Convertir le fichier en base64
      const base64 = await convertFileToBase64(selectedFile)
      addLog(`Fichier converti en Base64 (${(base64.length / 1024).toFixed(2)} KB)`)
      
      // Envoi direct à l'API sans passer par multer
      addLog('Envoi direct à l\'API Cloudinary...')
      const startTime = Date.now()
      
      const response = await api.post('/uploads/test-direct-cloudinary', {
        imageBase64: base64
      }, { 
        timeout: 60000 // 60 secondes
      })
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      addLog(`✅ Upload direct réussi en ${duration}s`)
      
      if (response.data.url) {
        addLog(`🔗 Image disponible à: ${response.data.url}`)
      }
      
      setDirectUploadResult(response.data)
    } catch (err: any) {
      console.error("Direct upload test error:", err)
      
      const errResponse = err?.response || {}
      const errData = errResponse?.data || {}
      
      const errorMessage = errData?.error 
        || errData?.message
        || err.message 
        || 'Direct upload failed'
      
      addLog(`❌ Échec de l'upload direct: ${errorMessage}`)
      
      if (errResponse.status) {
        addLog(`Code d'erreur HTTP: ${errResponse.status}`)
      }
      
      if (errData?.suggestion) {
        addLog(`💡 Suggestion: ${errData.suggestion}`)
      }
      
      setError(`Erreur directe: ${errorMessage}`)
      setDirectUploadResult(errData || { error: errorMessage })
    }
    
    setLoading(false)
  }
  
  // Fonction utilitaire pour convertir un fichier en base64
  function convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Échec de la conversion en base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Diagnostic d'upload Cloudinary</Typography>
      
      {loading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: { xs: '1 1 auto', md: 2 } }}>
          <Stack spacing={3}>
            {/* Section d'information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Instructions</Typography>
                <Typography variant="body2" paragraph>
                  Cet outil vous permet de diagnostiquer les problèmes d'upload vers Cloudinary. 
                  Suivez les étapes dans l'ordre pour isoler la source du problème.
                </Typography>
                
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Si vous rencontrez une erreur 500:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li">
                    <Typography variant="body2">
                      Vérifiez les logs du serveur pour voir les messages d'erreur détaillés
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Assurez-vous que vos credentials Cloudinary sont correctement configurés
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      Vérifiez les limites de votre plan Cloudinary
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Test de configuration */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Étape 1: Test de la configuration Cloudinary</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vérifie si les credentials Cloudinary sont corrects et si le compte est accessible.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={testCloudinaryConfig}
                  disabled={loading}
                >
                  Tester la configuration
                </Button>
                
                {cloudinaryStatus && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(cloudinaryStatus, null, 2)}</pre>
                  </Paper>
                )}
              </CardContent>
            </Card>
            
            {/* Test d'upload en mémoire */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Étape 2: Test d'upload en mémoire</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Teste si le serveur peut recevoir un fichier correctement (sans l'envoyer à Cloudinary).
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={loading}
                  >
                    Choisir un fichier
                    <input
                      type="file"
                      hidden
                      onChange={testMemoryUpload}
                    />
                  </Button>
                  
                  {selectedFile && (
                    <Chip 
                      label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`} 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {memoryUploadResult && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(memoryUploadResult, null, 2)}</pre>
                  </Paper>
                )}
              </CardContent>
            </Card>
            
            {/* Test d'upload Cloudinary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Étape 3: Test d'upload vers Cloudinary</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Teste l'upload complet avec traitement Cloudinary via multer.
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={loading}
                  >
                    Choisir un fichier
                    <input
                      type="file"
                      hidden
                      onChange={testCloudinaryUpload}
                    />
                  </Button>
                  
                  {selectedFile && (
                    <Chip 
                      label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`} 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {fileUploadResult && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(fileUploadResult, null, 2)}</pre>
                  </Paper>
                )}
              </CardContent>
            </Card>
            
            {/* Test d'upload direct Base64 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Étape 4: Test d'upload direct Base64</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Teste l'upload direct à Cloudinary (sans multer) en utilisant une image base64.
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={loading}
                  >
                    Choisir un fichier
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                  </Button>
                  
                  {selectedFile && (
                    <>
                      <Chip 
                        label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`} 
                        variant="outlined"
                      />
                      
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={loading || !selectedFile}
                        onClick={testDirectUpload}
                      >
                        Tester upload direct
                      </Button>
                    </>
                  )}
                </Box>
                
                {directUploadResult && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.paper', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{JSON.stringify(directUploadResult, null, 2)}</pre>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
        
        {/* Section des logs */}
        <Box sx={{ flex: { xs: '1 1 auto', md: 1 } }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 0 }}>
              <Typography variant="h6" gutterBottom>Journal de diagnostic</Typography>
              <Divider />
            </CardContent>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              p: 2,
              bgcolor: '#111',
              color: '#00ff00',
              fontFamily: 'monospace',
              minHeight: '300px',
              maxHeight: '600px',
              fontSize: '0.85rem'
            }}>
              {logs.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Aucune activité. Lancez un test pour voir les logs...
                </Typography>
              ) : (
                logs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>
                    {log}
                  </Typography>
                ))
              )}
            </Box>
            
            <CardContent sx={{ flexGrow: 0, pt: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setLogs([])}
                disabled={logs.length === 0}
                fullWidth
              >
                Effacer les logs
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  )
}