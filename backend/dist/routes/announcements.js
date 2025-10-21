"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Announcement_1 = require("../models/Announcement");
const ReadStatus_1 = require("../models/ReadStatus");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Admin: create internal or public (public -> pending)
router.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    const { title, content, type, targetService, attachments, serviceId, recipient, targetRole, targetScope, links } = req.body;
    // For superadmin, require serviceId in body; for admin, use auth serviceId
    const finalServiceId = ((_a = req.auth) === null || _a === void 0 ? void 0 : _a.role) === "superadmin" ? serviceId : (_b = req.auth) === null || _b === void 0 ? void 0 : _b.serviceId;
    if (!finalServiceId) {
        return res.status(400).json({ error: "Service ID is required" });
    }
    // Pour les annonces internes, les admins ne peuvent envoyer qu'à leur propre service
    if (type === "internal" && ((_c = req.auth) === null || _c === void 0 ? void 0 : _c.role) === "admin") {
        // Vérifier que le service cible est bien le service de l'admin
        if (targetService && targetService !== req.auth.serviceId) {
            return res.status(403).json({
                error: "Les annonces internes doivent être envoyées uniquement à votre propre service"
            });
        }
    }
    const createdBy = (_d = req.auth) === null || _d === void 0 ? void 0 : _d.userId;
    // Vérifier si l'admin fait partie de la Cellule de Communication
    let isCommAdmin = false;
    if (((_e = req.auth) === null || _e === void 0 ? void 0 : _e.role) === 'admin') {
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        isCommAdmin = !!(comm && String(comm._id) === req.auth.serviceId);
    }
    // Les annonces publiques de la Cellule de Communication sont auto-approuvées
    // Les annonces publiques des autres services restent en attente
    const status = (type === "public" && !isCommAdmin) ? "pending" : "approved";
    // Pour les annonces internes, utiliser targetService aussi
    // Pour que chaque service puisse avoir ses propres annonces internes
    let finalTargetService = undefined;
    if (type === "private") {
        finalTargetService = targetService;
    }
    else if (type === "internal") {
        // Pour les annonces internes, targetService est toujours le service de l'admin
        // Pour un admin: forcer l'utilisation de son propre service
        finalTargetService = ((_f = req.auth) === null || _f === void 0 ? void 0 : _f.role) === "admin" ? req.auth.serviceId : (targetService || finalServiceId);
    }
    else if (type === "public" && isCommAdmin && targetScope === "specific") {
        // Pour les annonces publiques de la Cellule de Communication avec scope spécifique
        finalTargetService = targetService;
    }
    const ann = await Announcement_1.AnnouncementModel.create({
        title,
        content,
        type,
        status,
        service: finalServiceId,
        targetService: finalTargetService,
        recipient: type === "private" ? recipient : undefined,
        targetRole: type === "internal" ? targetRole || "all" : undefined,
        targetScope: type === "public" && isCommAdmin ? targetScope : undefined,
        attachments,
        links,
        createdBy,
    });
    res.status(201).json(ann);
});
// Cellule de Communication (superadmin acts as validator): list pending and approve/reject
// Cellule de Communication (Communication service admins) validate public announcements
// Superadmins can also view
router.get("/pending", auth_1.requireAuth, (0, auth_1.requireRole)(["superadmin", "admin"]), async (req, res) => {
    var _a;
    // If admin, restrict to Communication service only
    if (((_a = req.auth) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
        // Fetch the name of the service for this admin via populated query, or enforce in code
        // Here we enforce by querying the admin's service membership name == 'Cellule de Communication'
        // In production, prefer a service flag/role rather than name match
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        if (!comm || String(comm._id) !== req.auth.serviceId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    const list = await Announcement_1.AnnouncementModel.find({ type: "public", status: "pending" })
        .sort({ createdAt: -1 })
        .populate('service', 'name')
        .populate('createdBy', 'name email');
    res.json(list);
});
router.post("/:id/approve", auth_1.requireAuth, (0, auth_1.requireRole)(["superadmin", "admin"]), async (req, res) => {
    var _a;
    const { id } = req.params;
    // Pour les admins, vérifier s'ils sont de la Cellule de Communication
    if (((_a = req.auth) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        if (!comm || String(comm._id) !== req.auth.serviceId) {
            return res.status(403).json({ error: 'Seule la Cellule de Communication peut approuver les annonces' });
        }
    }
    const updated = await Announcement_1.AnnouncementModel.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!updated)
        return res.status(404).json({ error: "Not found" });
    res.json(updated);
});
router.post("/:id/reject", auth_1.requireAuth, (0, auth_1.requireRole)(["superadmin", "admin"]), async (req, res) => {
    var _a;
    const { id } = req.params;
    // Pour les admins, vérifier s'ils sont de la Cellule de Communication
    if (((_a = req.auth) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        if (!comm || String(comm._id) !== req.auth.serviceId) {
            return res.status(403).json({ error: 'Seule la Cellule de Communication peut rejeter les annonces' });
        }
    }
    const updated = await Announcement_1.AnnouncementModel.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    if (!updated)
        return res.status(404).json({ error: "Not found" });
    res.json(updated);
});
// Endpoint pour afficher toutes les annonces publiques (approuvées, en attente, rejetées)
// Accessible uniquement par la Cellule de Communication et les superadmins
router.get("/public", auth_1.requireAuth, (0, auth_1.requireRole)(["superadmin", "admin"]), async (req, res) => {
    var _a;
    // Pour les admins, vérifier s'ils sont de la Cellule de Communication
    if (((_a = req.auth) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        if (!comm || String(comm._id) !== req.auth.serviceId) {
            return res.status(403).json({ error: 'Seule la Cellule de Communication peut accéder à toutes les annonces publiques' });
        }
    }
    // Récupérer toutes les annonces publiques, quel que soit leur statut
    const publicAnnouncements = await Announcement_1.AnnouncementModel.find({ type: "public" })
        .sort({ createdAt: -1 })
        .populate('service', 'name')
        .populate('createdBy', 'name email');
    res.json(publicAnnouncements);
});
// Employee/mobile: fetch internal for own service, public approved, and private sent to their service
router.get("/feed", auth_1.requireAuth, async (req, res) => {
    var _a, _b, _c, _d;
    const serviceId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.serviceId;
    const userId = (_b = req.auth) === null || _b === void 0 ? void 0 : _b.userId;
    // Construire une requête qui prend en compte notre nouveau modèle
    const isAdmin = ((_c = req.auth) === null || _c === void 0 ? void 0 : _c.role) === 'admin' || ((_d = req.auth) === null || _d === void 0 ? void 0 : _d.role) === 'superadmin';
    // Base query for all users
    const query = {
        $or: [
            // For public announcements, filter based on targetScope
            {
                type: "public",
                status: "approved",
                $or: [
                    { targetScope: "all" }, // Show to all services
                    { targetScope: "specific", targetService: serviceId }, // Show only to specific service
                    { targetScope: { $exists: false } } // Show to all services (regular service announcements)
                ]
            },
            // Pour les annonces privées
            { type: "private", targetService: serviceId },
            { type: "private", recipient: userId },
        ],
    };
    // For internal announcements, respect targetRole
    // All admins can see admin-targeted announcements in their service
    // Regular employees can only see "all"-targeted announcements
    if (isAdmin) {
        // Admins can see all internal announcements for their service
        query.$or.push({
            type: "internal",
            $or: [
                { service: serviceId },
                { targetService: serviceId }
            ]
        });
    }
    else {
        // Employees can only see internal announcements targeted to "all"
        query.$or.push({
            type: "internal",
            $or: [
                { service: serviceId, targetRole: "all" },
                { targetService: serviceId, targetRole: "all" }
            ]
        });
    }
    // Récupérer les annonces
    const announcements = await Announcement_1.AnnouncementModel.find(query)
        .sort({ createdAt: -1 })
        .populate('service', 'name')
        .populate('createdBy', 'name email');
    // Récupérer les statuts de lecture pour cet utilisateur
    const readStatusRecords = await ReadStatus_1.ReadStatusModel.find({
        user: userId,
        announcement: { $in: announcements.map(a => a._id) }
    });
    // Créer une carte pour une recherche rapide
    const deletedMap = new Map();
    readStatusRecords.forEach(record => {
        if (record.isDeleted) {
            deletedMap.set(String(record.announcement), true);
        }
    });
    // Filtrer les annonces supprimées
    const filteredList = announcements.filter(a => !deletedMap.has(String(a._id)));
    res.json(filteredList);
});
exports.default = router;
// List announcements created by the current user (sent)
router.get("/sent", auth_1.requireAuth, async (req, res) => {
    var _a;
    const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const list = await Announcement_1.AnnouncementModel.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .populate('service', 'name')
        .populate('createdBy', 'name email service');
    res.json(list);
});
// List announcements received for current user's service (received)
router.get("/received", auth_1.requireAuth, async (req, res) => {
    var _a, _b;
    const serviceId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.serviceId;
    const userId = (_b = req.auth) === null || _b === void 0 ? void 0 : _b.userId;
    // First, find all announcements that match the criteria
    const query = {
        $or: [
            // For public announcements, filter based on targetScope
            {
                type: "public",
                status: "approved",
                $or: [
                    { targetScope: "all" }, // Show to all services
                    { targetScope: "specific", targetService: serviceId }, // Show only to specific service
                    { targetScope: { $exists: false } } // Show to all services (regular service announcements)
                ]
            },
            // Pour les annonces internes, vérifier soit service ou targetService
            { type: "internal", $or: [{ service: serviceId }, { targetService: serviceId }] },
            { type: "private", targetService: serviceId },
            { type: "private", recipient: userId },
        ],
    };
    // Get all announcements
    const announcements = await Announcement_1.AnnouncementModel.find(query)
        .sort({ createdAt: -1 })
        .populate('service', 'name')
        .populate('createdBy', 'name email service');
    // Get read status records for this user
    const readStatusRecords = await ReadStatus_1.ReadStatusModel.find({
        user: userId,
        announcement: { $in: announcements.map(a => a._id) }
    });
    // Create a map for quick lookup
    const deletedMap = new Map();
    readStatusRecords.forEach(record => {
        if (record.isDeleted) {
            deletedMap.set(String(record.announcement), true);
        }
    });
    // Filter out deleted announcements
    const filteredList = announcements.filter(a => !deletedMap.has(String(a._id)));
    res.json(filteredList);
});
// Get one announcement by id (must be creator or receiver or public approved)
router.get("/:id", auth_1.requireAuth, async (req, res) => {
    var _a, _b, _c, _d;
    const { id } = req.params;
    const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const ann = await Announcement_1.AnnouncementModel.findById(id)
        .populate('service', 'name')
        .populate('createdBy', 'name email service');
    if (!ann)
        return res.status(404).json({ error: 'Not found' });
    // Vérifier si l'annonce a été supprimée par cet utilisateur
    const readStatus = await ReadStatus_1.ReadStatusModel.findOne({
        user: userId,
        announcement: id
    });
    if (readStatus === null || readStatus === void 0 ? void 0 : readStatus.isDeleted) {
        return res.status(404).json({ error: 'Not found or deleted' });
    }
    const serviceId = (_b = req.auth) === null || _b === void 0 ? void 0 : _b.serviceId;
    const isCreator = String(((_c = ann.createdBy) === null || _c === void 0 ? void 0 : _c._id) || ann.createdBy) === userId;
    const canView = ann.type === 'public' && ann.status === 'approved' ||
        (ann.type === 'internal' && (String(ann.service) === serviceId || String(ann.targetService) === serviceId)) ||
        (ann.type === 'private' && (String(ann.targetService) === serviceId || String(ann.recipient) === userId)) ||
        isCreator || ((_d = req.auth) === null || _d === void 0 ? void 0 : _d.role) === 'superadmin';
    if (!canView)
        return res.status(403).json({ error: 'Forbidden' });
    // Marquer comme lue si ce n'est pas déjà fait
    if (!(readStatus === null || readStatus === void 0 ? void 0 : readStatus.isRead)) {
        await ReadStatus_1.ReadStatusModel.findOneAndUpdate({ user: userId, announcement: id }, { isRead: true }, { upsert: true, new: true });
    }
    res.json(ann);
});
// Update announcement (title/content/attachments). Only creator, service admin, or superadmin can edit
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    const { id } = req.params;
    const { title, content, attachments, links } = req.body;
    const ann = await Announcement_1.AnnouncementModel.findById(id);
    if (!ann)
        return res.status(404).json({ error: 'Not found' });
    const isCreator = String(ann.createdBy) === ((_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId);
    const isServiceAdmin = ((_b = req.auth) === null || _b === void 0 ? void 0 : _b.role) === 'admin' && String(ann.service) === ((_c = req.auth) === null || _c === void 0 ? void 0 : _c.serviceId);
    const isSuper = ((_d = req.auth) === null || _d === void 0 ? void 0 : _d.role) === 'superadmin';
    // Allow Communication Service admins to edit pending public announcements
    let canEdit = isCreator || isServiceAdmin || isSuper;
    if (!canEdit && ((_e = req.auth) === null || _e === void 0 ? void 0 : _e.role) === 'admin' && ann.type === 'public' && ann.status === 'pending') {
        const comm = await (await Promise.resolve().then(() => __importStar(require('../models/Service')))).ServiceModel.findOne({ name: 'Cellule de Communication' });
        if (comm && String(comm._id) === req.auth.serviceId) {
            canEdit = true;
        }
    }
    if (!canEdit)
        return res.status(403).json({ error: 'Forbidden' });
    const update = {
        modifiedBy: (_f = req.auth) === null || _f === void 0 ? void 0 : _f.userId,
        modifiedAt: new Date()
    };
    if (typeof title !== 'undefined')
        update.title = title;
    if (typeof content !== 'undefined')
        update.content = content;
    if (typeof attachments !== 'undefined')
        update.attachments = attachments;
    if (typeof links !== 'undefined')
        update.links = links;
    const updated = await Announcement_1.AnnouncementModel.findByIdAndUpdate(id, update, { new: true })
        .populate('service', 'name')
        .populate('createdBy', 'name email')
        .populate('modifiedBy', 'name email');
    res.json(updated);
});
// Delete announcement. Only creator, service admin, or superadmin can delete completely, others just mark as deleted for themselves
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    var _a, _b, _c, _d;
    const { id } = req.params;
    const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
    const ann = await Announcement_1.AnnouncementModel.findById(id);
    if (!ann)
        return res.status(404).json({ error: 'Not found' });
    const isCreator = String(ann.createdBy) === userId;
    const isServiceAdmin = ((_b = req.auth) === null || _b === void 0 ? void 0 : _b.role) === 'admin' && String(ann.service) === ((_c = req.auth) === null || _c === void 0 ? void 0 : _c.serviceId);
    const isSuper = ((_d = req.auth) === null || _d === void 0 ? void 0 : _d.role) === 'superadmin';
    // Modifier le comportement de suppression
    // Uniquement les créateurs, admin du service, ou superadmin peuvent supprimer complètement
    // Pour tous les autres cas, on marque simplement comme supprimé pour cet utilisateur
    if (isCreator || isServiceAdmin || isSuper) {
        // Pour les annonces internes, nous ne les supprimons jamais réellement
        // sauf si c'est un superadmin qui le fait
        if (ann.type === 'internal' && !isSuper) {
            // Marquer comme supprimée uniquement pour cet utilisateur, même si c'est un créateur ou admin
            await ReadStatus_1.ReadStatusModel.findOneAndUpdate({ user: userId, announcement: id }, { isDeleted: true }, { upsert: true, new: true });
        }
        else {
            // Pour les autres types d'annonces ou si c'est un superadmin
            await Announcement_1.AnnouncementModel.findByIdAndDelete(id);
            // Supprimer également tous les statuts de lecture pour cette annonce
            await ReadStatus_1.ReadStatusModel.deleteMany({ announcement: id });
        }
    }
    else {
        // Pour les utilisateurs réguliers, simplement marquer comme supprimé pour cet utilisateur
        await ReadStatus_1.ReadStatusModel.findOneAndUpdate({ user: userId, announcement: id }, { isDeleted: true }, { upsert: true, new: true });
    }
    res.status(204).send();
});
