/**
 * Simple storage-cloudinary.js - Version de diagnostic pour multer-storage-cloudinary
 * Fichier de remplacement pour simplifier et diagnostiquer les problèmes
 */

const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * Crée un wrapper de diagnostic pour CloudinaryStorage avec plus de logs
 * @param {Object} options - Options de configuration
 * @returns {CloudinaryStorage} Instance de CloudinaryStorage avec diagnostics améliorés
 */
function createDiagnosticStorage(options) {
  console.log('🔍 CLOUDINARY DIAGNOSTIC: Création du storage avec les options:', 
    JSON.stringify({ 
      cloud_name: options.cloudinary?.config()?.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
      api_key_exists: !!options.cloudinary?.config()?.api_key || !!process.env.CLOUDINARY_API_KEY,
      api_secret_exists: !!options.cloudinary?.config()?.api_secret || !!process.env.CLOUDINARY_API_SECRET,
      resource_type: options.params?.resource_type || 'auto',
      folder: options.params?.folder
    }, null, 2)
  );

  // Vérifie la config de Cloudinary
  if (!cloudinary.config().cloud_name) {
    console.warn('⚠️ CLOUDINARY DIAGNOSTIC: cloud_name manquant!');
  }
  
  if (!cloudinary.config().api_key) {
    console.warn('⚠️ CLOUDINARY DIAGNOSTIC: api_key manquant!');
  }
  
  if (!cloudinary.config().api_secret) {
    console.warn('⚠️ CLOUDINARY DIAGNOSTIC: api_secret manquant!');
  }

  // Créer un storage avec méthodes de diagnostic améliorées
  const originalStorage = new CloudinaryStorage(options);
  
  // Wrapper le _handleFile original pour ajouter des logs
  const originalHandleFile = originalStorage._handleFile;
  
  originalStorage._handleFile = function(req, file, callback) {
    console.log('🔍 CLOUDINARY DIAGNOSTIC: Début du traitement du fichier:', file.originalname);
    console.log('🔍 CLOUDINARY DIAGNOSTIC: Type MIME:', file.mimetype);
    console.log('🔍 CLOUDINARY DIAGNOSTIC: Taille:', file.size || 'inconnue');

    try {
      originalHandleFile.call(this, req, file, function(err, info) {
        if (err) {
          console.error('❌ CLOUDINARY DIAGNOSTIC: Erreur lors du traitement:', err);
          
          // Analyse détaillée de l'erreur pour aider au diagnostic
          if (err.http_code === 401) {
            console.error('❌ CLOUDINARY DIAGNOSTIC: Erreur d\'authentification - Vérifiez vos credentials');
          } else if (err.http_code === 413) {
            console.error('❌ CLOUDINARY DIAGNOSTIC: Fichier trop volumineux pour votre plan Cloudinary');
          } else if (err.message && err.message.includes('network')) {
            console.error('❌ CLOUDINARY DIAGNOSTIC: Problème de connexion réseau à Cloudinary');
          }
          
          return callback(err);
        }
        
        console.log('✅ CLOUDINARY DIAGNOSTIC: Fichier traité avec succès');
        console.log('🔍 CLOUDINARY DIAGNOSTIC: URL:', info.secure_url || info.url || '(non disponible)');
        
        callback(null, info);
      });
    } catch (err) {
      console.error('❌ CLOUDINARY DIAGNOSTIC: Exception non gérée:', err);
      callback(err);
    }
  };
  
  return originalStorage;
}

module.exports = {
  createDiagnosticStorage,
  CloudinaryStorage // Exporter aussi la classe originale
};