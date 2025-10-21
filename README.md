# TALK - Système de Gestion des Annonces

## Configuration

### Variables d'environnement

Le projet utilise un fichier `.env` pour gérer les variables d'environnement sensibles. Créez un fichier `.env` dans le dossier `backend` avec les variables suivantes :

```
# Server Configuration
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/cad3
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Configuration de Cloudinary

1. Créez un compte sur [Cloudinary](https://cloudinary.com/) si vous n'en avez pas déjà un.
2. Accédez à votre Dashboard Cloudinary pour obtenir vos credentials :
   - Cloud Name
   - API Key
   - API Secret
3. Copiez ces informations dans le fichier `.env`

# Guide de diagnostic et résolution des problèmes Cloudinary

Si vous rencontrez des erreurs 500 lors des uploads, suivez ce guide de dépannage complet pour identifier et résoudre les problèmes.

## Outil de diagnostic automatique

Nous avons créé un outil de diagnostic qui vérifie automatiquement votre configuration Cloudinary. Pour l'utiliser :

```bash
# Accéder au répertoire du backend
cd backend

# Exécuter le diagnostic
npm run diagnose
```

Cet outil vérifiera :
- Les variables d'environnement
- La connexion à l'API Cloudinary
- Les informations de votre compte
- La possibilité d'uploader des fichiers

## Étapes de dépannage manuel

### 1. Vérifier la configuration de base

```bash
# Accéder au répertoire du backend
cd backend

# Vérifier que le fichier .env existe
ls -la .env

# Afficher le contenu (sans les valeurs sensibles)
grep -i CLOUDINARY .env
```

Assurez-vous que le fichier `.env` contient ces trois variables :
```
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### 2. Tester les credentials Cloudinary

Utilisez l'une de ces méthodes :

**Méthode A**: Accédez à `http://localhost:4000/api/uploads/test-cloudinary` dans votre navigateur

**Méthode B**: Utilisez curl pour tester l'API
```bash
curl http://localhost:4000/api/uploads/test-cloudinary
```

**Méthode C**: Vérifiez directement avec votre navigateur en vous connectant au [Dashboard Cloudinary](https://cloudinary.com/console/)

### 3. Analyser les logs du serveur

Lancez le serveur backend avec une journalisation détaillée :

```bash
cd backend
npm run dev
```

Recherchez ces messages d'erreur spécifiques :
- `❌ ERREUR MULTER` - Problème avec le middleware d'upload
- `❌ ERREUR FATALE LORS DE L'UPLOAD` - Erreur pendant le traitement
- `❌ ERREUR TEST CLOUDINARY` - Problème de configuration
- `CLOUDINARY DIAGNOSTIC` - Messages du diagnostic avancé

### 4. Problèmes courants et solutions

| Problème | Symptômes | Solution |
|----------|-----------|----------|
| **Credentials incorrects** | Erreur 401, "Invalid credentials" | Vérifiez les valeurs dans le dashboard Cloudinary |
| **Compte limité** | Erreur 429, "Rate limiting" | Vérifiez votre plan et vos limites d'utilisation |
| **Taille de fichier** | Erreur 413, "Payload too large" | Réduisez la taille de l'image ou augmentez la limite |
| **Format non supporté** | Erreur "Invalid file type" | Utilisez uniquement des formats d'image supportés (jpg, png, etc.) |
| **Problèmes réseau** | Erreur "Network error", timeout | Vérifiez votre connexion internet et les pare-feux |

### 5. Utiliser l'interface de diagnostic

Une interface complète est disponible pour tester chaque étape du processus d'upload :

1. Démarrez le backend: `cd backend && npm run dev`
2. Démarrez le frontend: `cd web && npm run dev`
3. Connectez-vous en tant qu'admin ou superadmin
4. Accédez à l'URL `/upload-test`

Cette interface vous permet de tester :
- La configuration Cloudinary
- L'upload en mémoire (sans Cloudinary)
- L'upload via le middleware multer
- L'upload direct avec base64 (contournant multer)

### 6. Tests avancés

Pour les problèmes persistants, vous pouvez tester directement l'API Cloudinary sans passer par notre application :

```javascript
// Testez avec Node.js
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: "votre_cloud_name",
  api_key: "votre_api_key",
  api_secret: "votre_api_secret"
});

// Vérifiez la connexion
cloudinary.api.ping()
  .then(result => console.log("✅ Connexion réussie:", result))
  .catch(error => console.error("❌ Erreur:", error));
```

## Ressources supplémentaires

- [Documentation officielle Cloudinary](https://cloudinary.com/documentation)
- [Guide de dépannage multer](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md)
- [Limites du plan gratuit Cloudinary](https://cloudinary.com/pricing)

Si vous avez besoin d'aide supplémentaire, contactez l'équipe de support ou ouvrez un ticket.

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd web
npm install
npm run dev
```

## Fonctionnalités

- Gestion des utilisateurs (superadmin, admin, employee)
- Gestion des services
- Création et gestion des annonces
- Upload d'images via Cloudinary
- Différents tableaux de bord selon les rôles utilisateur