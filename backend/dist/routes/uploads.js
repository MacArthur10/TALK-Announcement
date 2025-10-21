"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
// @ts-ignore - fichier js personnalisé pour le diagnostic
const storage_cloudinary_js_1 = require("../utils/storage-cloudinary.js");
const auth_1 = require("../middleware/auth");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Charger explicitement les variables d'environnement dans ce module
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Afficher les informations précises de la configuration Cloudinary
console.log("==== CLOUDINARY CONFIGURATION ====");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "NON DÉFINI");
console.log("CLOUDINARY_API_KEY présent:", process.env.CLOUDINARY_API_KEY ? "OUI" : "NON");
console.log("CLOUDINARY_API_SECRET présent:", process.env.CLOUDINARY_API_SECRET ? "OUI" : "NON");
console.log("================================");
// Essayons d'exécuter une requête simple pour vérifier les credentials
try {
    // Afficher les valeurs (partielles) pour le débogage
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
        console.error("❌ Variables d'environnement Cloudinary manquantes:");
        if (!cloudName)
            console.error("- CLOUDINARY_CLOUD_NAME manquant");
        if (!apiKey)
            console.error("- CLOUDINARY_API_KEY manquant");
        if (!apiSecret)
            console.error("- CLOUDINARY_API_SECRET manquant");
        throw new Error("Configuration Cloudinary incomplète");
    }
    // Configurer Cloudinary avec les credentials
    cloudinary_1.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
    console.log("✅ Configuration Cloudinary appliquée:");
    console.log(`- Cloud name: ${cloudName}`);
    console.log(`- API key: ${apiKey === null || apiKey === void 0 ? void 0 : apiKey.substring(0, 4)}...${apiKey === null || apiKey === void 0 ? void 0 : apiKey.substring(apiKey.length - 4)}`);
    // Test des credentials immédiatement
    console.log("Tentative de test des credentials Cloudinary...");
    cloudinary_1.v2.api.ping()
        .then(result => {
        console.log("✅ Connexion Cloudinary réussie:", result);
    })
        .catch(error => {
        console.error("❌ Échec de la connexion Cloudinary:", error);
        console.error("Détails:", JSON.stringify(error, null, 2));
    });
}
catch (error) {
    console.error("❌ Erreur lors de la configuration de Cloudinary:", error);
}
// Utiliser notre version de diagnostic de CloudinaryStorage pour plus d'informations
let storage;
try {
    console.log("Création du storage avec diagnostic...");
    storage = (0, storage_cloudinary_js_1.createDiagnosticStorage)({
        cloudinary: cloudinary_1.v2,
        params: {
            // Configuration minimale pour réduire les points d'erreur
            resource_type: "auto",
            folder: "talk_uploads", // Utiliser un dossier pour organiser les uploads
        },
    });
    console.log("✅ CloudinaryStorage avec diagnostic initialisé avec succès");
}
catch (error) {
    console.error("❌ Erreur lors de l'initialisation de CloudinaryStorage:", error);
    // Fallback en cas d'erreur - utiliser un stockage temporaire en mémoire
    storage = multer_1.default.memoryStorage();
    console.log("⚠️ Utilisation du stockage en mémoire comme solution de secours");
}
const upload = (0, multer_1.default)({ storage });
const router = (0, express_1.Router)();
// Route pour tester l'upload sans Cloudinary (juste stocker en mémoire)
router.post("/test-upload", auth_1.requireAuth, (req, res) => {
    console.log("=== TEST D'UPLOAD EN MÉMOIRE ===");
    console.log("Headers Content-Type:", req.headers["content-type"]);
    console.log("Content-Length:", req.headers["content-length"], "octets");
    // Vérifier le content-type
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
        console.warn("⚠️ Content-Type incorrect:", contentType);
        console.warn("Attendu: multipart/form-data");
    }
    const memoryStorage = multer_1.default.memoryStorage();
    const memoryUpload = (0, multer_1.default)({
        storage: memoryStorage,
        limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
    });
    console.log("Préparation de multer avec stockage en mémoire...");
    memoryUpload.single("file")(req, res, (err) => {
        if (err) {
            console.error("❌ Erreur d'upload en mémoire:", err);
            console.error("Type d'erreur:", err.constructor.name);
            console.error("Message:", err.message);
            return res.status(500).json({
                error: `Test d'upload en mémoire échoué: ${err.message}`,
                errorType: err.constructor.name
            });
        }
        const file = req.file;
        if (!file) {
            console.error("❌ Aucun fichier dans la requête");
            return res.status(400).json({ error: "Aucun fichier fourni" });
        }
        console.log("✅ Fichier reçu en mémoire avec succès");
        console.log("Nom:", file.originalname);
        console.log("Type:", file.mimetype);
        console.log("Taille:", file.size, "octets");
        // Le fichier est en mémoire, nous pouvons renvoyer des infos sans le stocker
        res.json({
            status: "Succès - Fichier chargé en mémoire",
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            sizeKB: (file.size / 1024).toFixed(2) + " KB",
            buffer: "Buffer disponible mais non affiché"
        });
        console.log("=== TEST D'UPLOAD EN MÉMOIRE TERMINÉ AVEC SUCCÈS ===");
    });
});
// Route pour tester la configuration Cloudinary avec diagnostics détaillés
router.get("/test-cloudinary", async (_req, res) => {
    var _a, _b, _c, _d;
    console.log("=== TEST CLOUDINARY DÉMARRÉ ===");
    try {
        // Vérifier la présence des credentials
        const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
        const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
        const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;
        console.log("Vérification des credentials:");
        console.log("- CLOUDINARY_CLOUD_NAME:", hasCloudName ? "Présent" : "MANQUANT");
        console.log("- CLOUDINARY_API_KEY:", hasApiKey ? "Présent" : "MANQUANT");
        console.log("- CLOUDINARY_API_SECRET:", hasApiSecret ? "Présent" : "MANQUANT");
        if (!hasCloudName || !hasApiKey || !hasApiSecret) {
            console.log("❌ Configuration incomplète");
            return res.status(500).json({
                error: "Configuration Cloudinary incomplète",
                config: {
                    cloud_name: hasCloudName,
                    api_key: hasApiKey,
                    api_secret: hasApiSecret
                },
                requiredSteps: [
                    "Vérifier que le fichier .env contient les variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET",
                    "S'assurer que le serveur a bien chargé les variables d'environnement (redémarrer peut être nécessaire)"
                ]
            });
        }
        // Afficher la configuration actuelle (sans secrets)
        console.log("Configuration actuelle:");
        console.log("- Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
        console.log("- API Key (premières lettres):", ((_a = process.env.CLOUDINARY_API_KEY) === null || _a === void 0 ? void 0 : _a.substring(0, 4)) + "..." +
            ((_b = process.env.CLOUDINARY_API_KEY) === null || _b === void 0 ? void 0 : _b.substring(process.env.CLOUDINARY_API_KEY.length - 4)));
        console.log("Test de connexion à l'API Cloudinary...");
        // Test 1: Ping simple
        const pingResult = await cloudinary_1.v2.api.ping();
        console.log("✅ Ping réussi:", pingResult);
        // Test 2: Récupérer les infos du compte
        console.log("Tentative de récupération des informations du compte...");
        const accountInfo = await cloudinary_1.v2.api.usage();
        console.log("✅ Récupération des informations du compte réussie");
        // Test 3: Vérifier les limites
        const planInfo = {
            plan: accountInfo.plan,
            usage: {
                credits: accountInfo.credits.usage,
                limit: accountInfo.credits.limit
            },
            objects: {
                usage: accountInfo.objects.usage,
                limit: accountInfo.objects.limit
            }
        };
        console.log("Informations sur le plan:", planInfo);
        res.json({
            status: "OK - Tous les tests ont réussi",
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key_masked: ((_c = process.env.CLOUDINARY_API_KEY) === null || _c === void 0 ? void 0 : _c.substring(0, 4)) + "..." +
                    ((_d = process.env.CLOUDINARY_API_KEY) === null || _d === void 0 ? void 0 : _d.substring(process.env.CLOUDINARY_API_KEY.length - 4)),
                api_secret_present: !!process.env.CLOUDINARY_API_SECRET
            },
            tests: {
                ping: "Réussi",
                account_info: "Réussi"
            },
            plan: planInfo,
            recommendations: [
                "Votre configuration Cloudinary semble correcte."
            ]
        });
        console.log("=== TEST CLOUDINARY TERMINÉ AVEC SUCCÈS ===");
    }
    catch (error) {
        console.error("❌ ERREUR TEST CLOUDINARY:", error);
        // Analyser l'erreur pour donner des conseils spécifiques
        const errorMessage = error.message || "";
        const errorDetails = error.error || {};
        let recommendations = [];
        if (errorMessage.includes("authentication")) {
            recommendations.push("Vos credentials Cloudinary semblent incorrects. Vérifiez votre cloud_name, api_key et api_secret.");
        }
        else if (errorMessage.includes("network") || errorMessage.includes("connect")) {
            recommendations.push("Problème de connexion réseau. Vérifiez votre connexion internet.");
        }
        else {
            recommendations.push("Vérifiez vos credentials et l'état de votre compte Cloudinary.");
        }
        res.status(500).json({
            error: `Erreur de connexion à Cloudinary: ${error.message}`,
            errorType: error.constructor.name,
            details: errorDetails,
            recommendations
        });
        console.log("=== TEST CLOUDINARY TERMINÉ AVEC ERREUR ===");
    }
});
// Route pour tester l'upload direct via base64 (contourne multer)
router.post("/test-direct-cloudinary", auth_1.requireAuth, async (req, res) => {
    console.log("=== TEST UPLOAD DIRECT CLOUDINARY ===");
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({
                error: "Aucune image base64 fournie",
                suggestion: "Assurez-vous d'envoyer un objet JSON avec la propriété 'imageBase64'"
            });
        }
        console.log("Image base64 reçue, longueur:", imageBase64.length);
        if (!imageBase64.startsWith('data:')) {
            return res.status(400).json({
                error: "Format base64 incorrect",
                suggestion: "L'image doit être au format 'data:image/[format];base64,[data]'"
            });
        }
        console.log("Upload direct vers Cloudinary...");
        const uploadResult = await cloudinary_1.v2.uploader.upload(imageBase64, {
            folder: "talk_direct",
            resource_type: "auto"
        });
        console.log("✅ Upload direct réussi!");
        console.log("- URL:", uploadResult.secure_url);
        console.log("- Format:", uploadResult.format);
        console.log("- Taille:", uploadResult.bytes, "octets");
        res.status(200).json({
            success: true,
            message: "Upload direct réussi",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height
        });
    }
    catch (error) {
        console.error("❌ ERREUR UPLOAD DIRECT:", error);
        let errorMessage = "Erreur lors de l'upload direct";
        let suggestion = "Vérifiez les logs du serveur pour plus de détails";
        if (error.message) {
            errorMessage = error.message;
            if (error.message.includes("Upload preset")) {
                suggestion = "Vérifiez la configuration de votre compte Cloudinary";
            }
            else if (error.message.includes("resource_type")) {
                suggestion = "Le format de l'image peut ne pas être supporté";
            }
        }
        res.status(500).json({
            error: errorMessage,
            suggestion,
            details: error.toString()
        });
    }
});
// Restrict uploads to admins and superadmins
router.post("/image", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    console.log("=== DÉBUT TRAITEMENT UPLOAD ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    try {
        // Approche en une seule étape avec gestion d'erreur intégrée
        console.log("Préparation upload fichier...");
        const uploadHandler = new Promise((resolve, reject) => {
            upload.single("file")(req, res, (err) => {
                if (err) {
                    console.error("❌ ERREUR MULTER:", err);
                    console.error("Type d'erreur:", err.constructor.name);
                    console.error("Message:", err.message);
                    if (err.stack)
                        console.error("Stack:", err.stack);
                    return reject(err);
                }
                if (!req.file) {
                    console.error("❌ Aucun fichier dans la requête après traitement multer");
                    return reject(new Error("No file uploaded"));
                }
                console.log("✅ Upload réussi via multer");
                resolve(req.file);
            });
        });
        // Attendre la fin du processus d'upload
        const file = await uploadHandler;
        // Afficher les informations complètes du fichier
        console.log("=== INFORMATIONS FICHIER UPLOADÉ ===");
        console.log("Fichier:", file);
        console.log("Chemin:", file.path);
        console.log("URL:", file.secure_url || file.url || file.path);
        console.log("===================================");
        // Réponse au client
        res.status(201).json({
            url: file.secure_url || file.url || file.path,
            publicId: file.public_id || file.filename,
            bytes: file.size || file.bytes,
            width: file.width,
            height: file.height,
            format: file.format,
            success: true
        });
        console.log("✅ Réponse envoyée avec succès au client");
        console.log("=== FIN TRAITEMENT UPLOAD ===");
    }
    catch (error) {
        console.error("❌ ERREUR FATALE LORS DE L'UPLOAD:");
        console.error("Message:", error.message);
        if (error.stack)
            console.error("Stack:", error.stack);
        // Envoyer une réponse d'erreur détaillée
        res.status(500).json({
            error: `Upload failed: ${error.message || "Unknown error"}`,
            errorType: error.constructor.name,
            details: error.toString(),
            success: false
        });
        console.log("⚠️ Réponse d'erreur envoyée au client");
        console.log("=== FIN TRAITEMENT UPLOAD (AVEC ERREUR) ===");
    }
});
// Route pour tester directement l'API Cloudinary sans utiliser multer
router.post("/test-direct-cloudinary", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    console.log("=== TEST D'UPLOAD DIRECT CLOUDINARY ===");
    try {
        // Récupération de la chaîne base64 depuis le body
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({
                error: "Aucune image base64 fournie",
                required: "Envoyez un objet JSON avec la propriété 'imageBase64' contenant l'image encodée en base64"
            });
        }
        console.log("Image base64 reçue, longueur:", imageBase64.length);
        // Essayer d'uploader directement via l'API Cloudinary
        console.log("Tentative d'upload direct à Cloudinary...");
        try {
            const startTime = Date.now();
            const result = await cloudinary_1.v2.uploader.upload(imageBase64, {
                resource_type: "auto",
                folder: "talk_direct_test"
            });
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Upload direct réussi en ${duration}s`);
            console.log("URL:", result.secure_url);
            res.status(201).json({
                success: true,
                message: `Upload direct réussi en ${duration}s`,
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                width: result.width,
                height: result.height
            });
        }
        catch (cloudinaryError) {
            console.error("❌ Erreur d'upload direct Cloudinary:", cloudinaryError);
            // Analyser l'erreur pour des détails spécifiques
            let errorDetails = "Erreur inconnue";
            let suggestionMessage = "";
            if (cloudinaryError.message) {
                errorDetails = cloudinaryError.message;
                if (errorDetails.includes("auth")) {
                    suggestionMessage = "Vérifiez vos credentials Cloudinary";
                }
                else if (errorDetails.includes("network") || errorDetails.includes("connect")) {
                    suggestionMessage = "Problème de connexion réseau à Cloudinary";
                }
                else if (errorDetails.includes("rate limiting")) {
                    suggestionMessage = "Votre compte Cloudinary est soumis à des limitations de débit";
                }
            }
            res.status(500).json({
                success: false,
                error: `Upload direct échoué: ${errorDetails}`,
                suggestion: suggestionMessage,
                cloudinaryError: JSON.stringify(cloudinaryError)
            });
        }
    }
    catch (error) {
        console.error("❌ Erreur globale lors du test direct:", error);
        res.status(500).json({
            success: false,
            error: `Erreur lors du test direct: ${error.message}`
        });
    }
    console.log("=== TEST D'UPLOAD DIRECT CLOUDINARY TERMINÉ ===");
});
exports.default = router;
