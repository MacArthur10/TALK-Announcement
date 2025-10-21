import { Router } from "express";
import { AnnouncementModel } from "../models/Announcement";
import { ReadStatusModel } from "../models/ReadStatus";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Admin: create internal or public (public -> pending)
router.post("/", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { title, content, type, targetService, attachments, serviceId, recipient, targetRole, targetScope, links } = req.body as {
    title: string;
    content: string;
    type: "internal" | "public" | "private";
    targetService?: string;
    attachments?: string[];
    serviceId?: string;
    recipient?: string;
    targetRole?: "admin" | "all";
    targetScope?: "all" | "specific";
    links?: { url: string; title: string }[];
  };
  // For superadmin, require serviceId in body; for admin, use auth serviceId
  const finalServiceId = req.auth?.role === "superadmin" ? serviceId : req.auth?.serviceId;
  if (!finalServiceId) {
    return res.status(400).json({ error: "Service ID is required" });
  }
  
  // Pour les annonces internes, les admins ne peuvent envoyer qu'à leur propre service
  if (type === "internal" && req.auth?.role === "admin") {
    // Vérifier que le service cible est bien le service de l'admin
    if (targetService && targetService !== req.auth.serviceId) {
      return res.status(403).json({ 
        error: "Les annonces internes doivent être envoyées uniquement à votre propre service" 
      });
    }
  }
  
  const createdBy = req.auth?.userId!;
  
  // Vérifier si l'admin fait partie de la Cellule de Communication
  let isCommAdmin = false;
  if (req.auth?.role === 'admin') {
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
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
  } else if (type === "internal") {
    // Pour les annonces internes, targetService est toujours le service de l'admin
    // Pour un admin: forcer l'utilisation de son propre service
    finalTargetService = req.auth?.role === "admin" ? req.auth.serviceId : (targetService || finalServiceId);
  } else if (type === "public" && isCommAdmin && targetScope === "specific") {
    // Pour les annonces publiques de la Cellule de Communication avec scope spécifique
    finalTargetService = targetService;
  }
  
  const ann = await AnnouncementModel.create({
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
router.get("/pending", requireAuth, requireRole(["superadmin", "admin"]), async (req, res) => {
  // If admin, restrict to Communication service only
  if (req.auth?.role === 'admin') {
    // Fetch the name of the service for this admin via populated query, or enforce in code
    // Here we enforce by querying the admin's service membership name == 'Cellule de Communication'
    // In production, prefer a service flag/role rather than name match
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
    if (!comm || String(comm._id) !== req.auth.serviceId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const list = await AnnouncementModel.find({ type: "public", status: "pending" })
    .sort({ createdAt: -1 })
    .populate('service', 'name')
    .populate('createdBy', 'name email');
  res.json(list);
});

router.post("/:id/approve", requireAuth, requireRole(["superadmin", "admin"]), async (req, res) => {
  const { id } = req.params;
  
  // Pour les admins, vérifier s'ils sont de la Cellule de Communication
  if (req.auth?.role === 'admin') {
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
    if (!comm || String(comm._id) !== req.auth.serviceId) {
      return res.status(403).json({ error: 'Seule la Cellule de Communication peut approuver les annonces' });
    }
  }
  
  const updated = await AnnouncementModel.findByIdAndUpdate(id, { status: "approved" }, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.post("/:id/reject", requireAuth, requireRole(["superadmin", "admin"]), async (req, res) => {
  const { id } = req.params;
  
  // Pour les admins, vérifier s'ils sont de la Cellule de Communication
  if (req.auth?.role === 'admin') {
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
    if (!comm || String(comm._id) !== req.auth.serviceId) {
      return res.status(403).json({ error: 'Seule la Cellule de Communication peut rejeter les annonces' });
    }
  }
  
  const updated = await AnnouncementModel.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// Endpoint pour afficher toutes les annonces publiques (approuvées, en attente, rejetées)
// Accessible uniquement par la Cellule de Communication et les superadmins
router.get("/public", requireAuth, requireRole(["superadmin", "admin"]), async (req, res) => {
  // Pour les admins, vérifier s'ils sont de la Cellule de Communication
  if (req.auth?.role === 'admin') {
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
    if (!comm || String(comm._id) !== req.auth.serviceId) {
      return res.status(403).json({ error: 'Seule la Cellule de Communication peut accéder à toutes les annonces publiques' });
    }
  }
  
  // Récupérer toutes les annonces publiques, quel que soit leur statut
  const publicAnnouncements = await AnnouncementModel.find({ type: "public" })
    .sort({ createdAt: -1 })
    .populate('service', 'name')
    .populate('createdBy', 'name email');
  
  res.json(publicAnnouncements);
});

// Employee/mobile: fetch internal for own service, public approved, and private sent to their service
router.get("/feed", requireAuth, async (req, res) => {
  const serviceId = req.auth?.serviceId;
  const userId = req.auth?.userId;
  
  // Construire une requête qui prend en compte notre nouveau modèle
  const isAdmin = req.auth?.role === 'admin' || req.auth?.role === 'superadmin';
  
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
  } as any;
  
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
  } else {
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
  const announcements = await AnnouncementModel.find(query)
    .sort({ createdAt: -1 })
    .populate('service', 'name')
    .populate('createdBy', 'name email');
  
  // Récupérer les statuts de lecture pour cet utilisateur
  const readStatusRecords = await ReadStatusModel.find({ 
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

export default router;

// List announcements created by the current user (sent)
router.get("/sent", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  const list = await AnnouncementModel.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .populate('service', 'name')
    .populate('createdBy', 'name email service');
  res.json(list);
});

// List announcements received for current user's service (received)
router.get("/received", requireAuth, async (req, res) => {
  const serviceId = req.auth?.serviceId;
  const userId = req.auth?.userId;
  
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
  } as any;
  
  // Get all announcements
  const announcements = await AnnouncementModel.find(query)
    .sort({ createdAt: -1 })
    .populate('service', 'name')
    .populate('createdBy', 'name email service');
  
  // Get read status records for this user
  const readStatusRecords = await ReadStatusModel.find({ 
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
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  
  const ann = await AnnouncementModel.findById(id)
    .populate('service', 'name')
    .populate('createdBy', 'name email service');
  
  if (!ann) return res.status(404).json({ error: 'Not found' });
  
  // Vérifier si l'annonce a été supprimée par cet utilisateur
  const readStatus = await ReadStatusModel.findOne({
    user: userId,
    announcement: id
  });
  
  if (readStatus?.isDeleted) {
    return res.status(404).json({ error: 'Not found or deleted' });
  }
  
  const serviceId = req.auth?.serviceId;
  const isCreator = String(ann.createdBy?._id || ann.createdBy) === userId;
  const canView =
    ann.type === 'public' && ann.status === 'approved' ||
    (ann.type === 'internal' && (String(ann.service) === serviceId || String(ann.targetService) === serviceId)) ||
    (ann.type === 'private' && (String(ann.targetService) === serviceId || String(ann.recipient) === userId)) ||
    isCreator || req.auth?.role === 'superadmin';
    
  if (!canView) return res.status(403).json({ error: 'Forbidden' });
  
  // Marquer comme lue si ce n'est pas déjà fait
  if (!readStatus?.isRead) {
    await ReadStatusModel.findOneAndUpdate(
      { user: userId, announcement: id },
      { isRead: true },
      { upsert: true, new: true }
    );
  }
  
  res.json(ann);
});

// Update announcement (title/content/attachments). Only creator, service admin, or superadmin can edit
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, content, attachments, links } = req.body as { 
    title?: string; 
    content?: string; 
    attachments?: string[];
    links?: { url: string; title: string }[];
  };
  const ann = await AnnouncementModel.findById(id);
  if (!ann) return res.status(404).json({ error: 'Not found' });
  
  const isCreator = String(ann.createdBy) === req.auth?.userId;
  const isServiceAdmin = req.auth?.role === 'admin' && String(ann.service) === req.auth?.serviceId;
  const isSuper = req.auth?.role === 'superadmin';
  
  // Allow Communication Service admins to edit pending public announcements
  let canEdit = isCreator || isServiceAdmin || isSuper;
  if (!canEdit && req.auth?.role === 'admin' && ann.type === 'public' && ann.status === 'pending') {
    const comm = await (await import('../models/Service')).ServiceModel.findOne({ name: 'Cellule de Communication' });
    if (comm && String(comm._id) === req.auth.serviceId) {
      canEdit = true;
    }
  }
  
  if (!canEdit) return res.status(403).json({ error: 'Forbidden' });
  
  const update: any = {
    modifiedBy: req.auth?.userId,
    modifiedAt: new Date()
  };
  
  if (typeof title !== 'undefined') update.title = title;
  if (typeof content !== 'undefined') update.content = content;
  if (typeof attachments !== 'undefined') update.attachments = attachments;
  if (typeof links !== 'undefined') update.links = links;
  
  const updated = await AnnouncementModel.findByIdAndUpdate(id, update, { new: true })
    .populate('service', 'name')
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email');
  res.json(updated);
});

// Delete announcement. Only creator, service admin, or superadmin can delete completely, others just mark as deleted for themselves
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  const ann = await AnnouncementModel.findById(id);
  
  if (!ann) return res.status(404).json({ error: 'Not found' });
  
  const isCreator = String(ann.createdBy) === userId;
  const isServiceAdmin = req.auth?.role === 'admin' && String(ann.service) === req.auth?.serviceId;
  const isSuper = req.auth?.role === 'superadmin';
  
  // Modifier le comportement de suppression
  // Uniquement les créateurs, admin du service, ou superadmin peuvent supprimer complètement
  // Pour tous les autres cas, on marque simplement comme supprimé pour cet utilisateur
  if (isCreator || isServiceAdmin || isSuper) {
    // Pour les annonces internes, nous ne les supprimons jamais réellement
    // sauf si c'est un superadmin qui le fait
    if (ann.type === 'internal' && !isSuper) {
      // Marquer comme supprimée uniquement pour cet utilisateur, même si c'est un créateur ou admin
      await ReadStatusModel.findOneAndUpdate(
        { user: userId, announcement: id },
        { isDeleted: true },
        { upsert: true, new: true }
      );
    } else {
      // Pour les autres types d'annonces ou si c'est un superadmin
      await AnnouncementModel.findByIdAndDelete(id);
      // Supprimer également tous les statuts de lecture pour cette annonce
      await ReadStatusModel.deleteMany({ announcement: id });
    }
  } else {
    // Pour les utilisateurs réguliers, simplement marquer comme supprimé pour cet utilisateur
    await ReadStatusModel.findOneAndUpdate(
      { user: userId, announcement: id },
      { isDeleted: true },
      { upsert: true, new: true }
    );
  }
  
  res.status(204).send();
});


