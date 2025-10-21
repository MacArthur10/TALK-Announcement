/**
 * Script de diagnostic Cloudinary pour TALK
 * 
 * Ce script vérifie la configuration et les accès à Cloudinary.
 * Il peut être exécuté en standalone pour tester la configuration.
 * 
 * Utilisation:
 * node cloudinary-diagnostic.js
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
const axios = require('axios');

// Charger les variables d'environnement
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log(`📋 Chargement des variables d'environnement depuis ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`⚠️ Fichier .env non trouvé à ${envPath}`);
  dotenv.config();
}

// Configuration du diagnostic
async function runDiagnostic() {
  console.log("\n=== DIAGNOSTIC CLOUDINARY POUR TALK ===\n");
  
  // Étape 1: Vérification des variables d'environnement
  console.log("📋 Étape 1: Vérification des variables d'environnement");
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  let envErrors = 0;
  
  if (!cloudName) {
    console.error("❌ Variable CLOUDINARY_CLOUD_NAME manquante dans .env");
    envErrors++;
  } else {
    console.log(`✅ CLOUDINARY_CLOUD_NAME: ${cloudName}`);
  }
  
  if (!apiKey) {
    console.error("❌ Variable CLOUDINARY_API_KEY manquante dans .env");
    envErrors++;
  } else {
    console.log(`✅ CLOUDINARY_API_KEY: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  
  if (!apiSecret) {
    console.error("❌ Variable CLOUDINARY_API_SECRET manquante dans .env");
    envErrors++;
  } else {
    console.log(`✅ CLOUDINARY_API_SECRET: ${apiSecret.substring(0, 2)}...${apiSecret.substring(apiSecret.length - 2)}`);
  }
  
  if (envErrors > 0) {
    console.error(`\n⚠️ ${envErrors} problème(s) de configuration détecté(s). Vérifiez votre fichier .env.`);
    return;
  }
  
  // Étape 2: Configuration de Cloudinary
  console.log("\n📋 Étape 2: Configuration de Cloudinary");
  
  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    console.log("✅ Configuration de Cloudinary appliquée");
  } catch (error) {
    console.error("❌ Erreur lors de la configuration de Cloudinary:", error);
    return;
  }
  
  // Étape 3: Test de connexion à l'API Cloudinary
  console.log("\n📋 Étape 3: Test de connexion à l'API Cloudinary");
  
  try {
    const pingResult = await cloudinary.api.ping();
    console.log("✅ Connexion à l'API Cloudinary établie:", pingResult);
  } catch (error) {
    console.error("❌ Échec de connexion à l'API Cloudinary:", error);
    console.error("\n⚠️ Vérifiez vos credentials et votre connexion Internet.");
    return;
  }
  
  // Étape 4: Vérification des informations du compte
  console.log("\n📋 Étape 4: Vérification des informations du compte");
  
  try {
    const accountInfo = await cloudinary.api.usage();
    console.log("✅ Récupération des informations du compte réussie");
    console.log(`   - Plan: ${accountInfo.plan}`);
    console.log(`   - Crédits: ${accountInfo.credits?.usage || 0}/${accountInfo.credits?.limit || 'illimité'}`);
    console.log(`   - Transformations: ${accountInfo.transformations?.usage || 0}/${accountInfo.transformations?.limit || 'illimité'}`);
    console.log(`   - Objets: ${accountInfo.objects?.usage || 0}/${accountInfo.objects?.limit || 'illimité'}`);
  } catch (error) {
    console.error("❌ Échec de récupération des informations du compte:", error);
    return;
  }
  
  // Étape 5: Test d'upload simple
  console.log("\n📋 Étape 5: Test d'upload simple");
  
  try {
    // Créer une image de test simple
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Si l'image existe déjà, l'utiliser; sinon, créer une nouvelle
    if (!fs.existsSync(testImagePath)) {
      console.log("   - Création d'une image de test...");
      // Utiliser une image base64 minimale
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5gMBDSEoHuREHQAAAu5JREFUOE99lM9rXFUUxz/n3vveezOZTJKJSUw6idEkpqixVSMuxFIX1YqCuBFcCroquHMjrgQR/wFBXIgLcSEVRKqtiEARjaYVTaxJ2tgf6bRNM5OZvJn33r3HxbzJTGJ74PLevefe8z3f8z3nKQBFC7WXI9r3IsN3Hf03t4UdU9i+B3OL0O6C8zCXQr3SouImJPEWDFwQnENhQOHEzxA+jwbnPW9F7/H8VEqNrENrQOVAB0XE/hbT2sDD308ZYKKfd+84sVpUBJTUjYUG8Z6Qzxdfo5NpVCB7Kb6OigQvrRKl73D1m1M6MBnCQXcVRn4F8CIEIsxGTxC7W8jkgsW4gjG29xgXChEBEFQ4xrt3n1bAL0AFogAlOMCLRTCE7iH82FZP91pCB9BVePYZ5cW9jsSF5bQJtAu+15gIxh7i46nDdJIVkrWFVQwQQKnCTnbr2EhLVn2KYqcJsSVg3SccFJQt7E4UttxjlW/C+zwYtKkhUgXXBAmJKmVWJO9yhOwqIQHqKMnp7iCxAwH8VIJYodUBXVd0BrBhNANFQYwi98uF1BZl+E2xwCnAtQVXEDdHuPoEJsxwogijnJoqM1o6SBjAqvDFUcOeyRXB2Rqoa5APS0VJFgyFuQYDG1NuN4mHAsZNHT/xLMtRheGdHbY0U75sV3k1HiOo7iKM9qHUS5QkL+m7ggQFmcctCc3pBn78G8I3pzj3W5vz1w0tbRnbrrk4Y9CFQzwm0BLI+lYHu2MN0ECzLnRmVhStvYrWaz1CSJCAbqDpnj6FfuQQunIHx385Qbvj6OJQxU8vp1njy5R4uE62tEr2Xx9YHoahLZAdO0b5nXfhwCvondtJMsGlcWw3REch1u9iqn8J5TKE8/5GfhvvsT/A7FNM7j+M3T5N1l0hExiohgzVG0ghU4Vhc4BrLAZdNWgynDZ71z1fT5AJPXp4XZbCnCtcB/EBSu3P+V/sL/0L0yb1vFbN3+sAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDMtMDFUMTM6MzM6NDArMDA6MDDmnQIAAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTAzLTAxVDEzOjMzOjQwKzAwOjAwl8C6vAAAAABJRU5ErkJggg==';
      
      // Extraire la partie base64 (supprimer le préfixe data:image/png;base64,)
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(testImagePath, buffer);
      console.log(`   - Image de test créée à ${testImagePath}`);
    }
    
    // Uploader l'image de test
    console.log("   - Upload de l'image de test...");
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      folder: "talk_diagnostic",
      resource_type: "image"
    });
    
    console.log("✅ Upload réussi!");
    console.log(`   - URL: ${uploadResult.secure_url}`);
    console.log(`   - Format: ${uploadResult.format}`);
    console.log(`   - Taille: ${uploadResult.bytes} octets`);
    console.log(`   - ID: ${uploadResult.public_id}`);
    
  } catch (error) {
    console.error("❌ Échec de l'upload:", error);
    console.error("\n⚠️ Vérifiez les permissions de votre compte et les limites d'upload.");
    return;
  }
  
  // Étape 6: Vérification du serveur API
  console.log("\n📋 Étape 6: Vérification du serveur API");
  
  try {
    console.log("   - Tentative de connexion à l'API locale...");
    const response = await axios.get('http://localhost:4000/api');
    console.log(`✅ API accessible: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error("❌ API inaccessible:", error.message);
    console.error("\n⚠️ Assurez-vous que le serveur est en cours d'exécution sur le port 4000.");
  }
  
  // Résumé final
  console.log("\n=== RÉSUMÉ DU DIAGNOSTIC ===");
  console.log("✅ Variables d'environnement: OK");
  console.log("✅ Configuration de Cloudinary: OK");
  console.log("✅ Connexion à l'API Cloudinary: OK");
  console.log("✅ Informations du compte: OK");
  console.log("✅ Test d'upload: OK");
  console.log("\n🎉 Diagnostic complet: Tout fonctionne correctement!");
  console.log("\nVous pouvez maintenant utiliser l'outil de diagnostic d'upload dans l'application web.");
  console.log("URL: http://localhost:5173/upload-test");
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  console.error("\n❌ ERREUR FATALE LORS DU DIAGNOSTIC:", error);
  console.error("\nVérifiez votre connexion Internet et vos credentials Cloudinary.");
  process.exit(1);
});