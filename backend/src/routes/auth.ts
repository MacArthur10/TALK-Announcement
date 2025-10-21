import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";
import { ServiceModel } from "../models/Service";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await UserModel.findOne({ email, active: true }).populate('service', 'name');
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const secret = process.env.JWT_SECRET || "dev_secret";
  const token = jwt.sign(
    {
      userId: String(user._id),
      role: user.role,
      serviceId: user.service ? String(user.service._id) : undefined,
    },
    secret,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      role: user.role,
      // service may be populated (object) or just an ObjectId; handle both safely
      service: user.service && typeof (user as any).service === 'object'
        ? { id: (user as any).service._id, name: (user as any).service.name }
        : null
    }
  });
});
// List all users in the same service as the authenticated user
router.get(
  "/service-members",
  requireAuth,
  async (req, res) => {
    if (!req.auth?.serviceId) return res.status(400).json({ error: "No service assigned" });
    const users = await UserModel.find({ service: req.auth.serviceId, active: true })
      .select('-passwordHash')
      .populate('service', 'name');
    res.json(users);
  }
);

// List members of a given service (for composing private announcements)
// Accessible to admin and superadmin
router.get(
  "/members",
  requireAuth,
  requireRole(["admin", "superadmin"]),
  async (req, res) => {
    const { serviceId } = req.query as { serviceId?: string };
    if (!serviceId) return res.status(400).json({ error: "serviceId is required" });
    
    // Both superadmins and regular admins can view members of any service
    const users = await UserModel.find({ service: serviceId, active: true })
      .select('-passwordHash')
      .populate('service', 'name');
    res.json(users);
  }
);

// Super Admin: create service admin or employee
router.post(
  "/super/create-user",
  requireAuth,
  requireRole("superadmin"),
  async (req, res) => {
    const { email, name, password, matricule, serviceId, role } = req.body as {
      email: string;
      name: string;
      password: string;
      matricule: string;
      serviceId: string;
      role: "admin" | "employee";
    };
    const service = await ServiceModel.findById(serviceId);
    if (!service) return res.status(400).json({ error: "Service not found" });
    const exists = await UserModel.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already in use" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ 
      email, 
      name, 
      passwordHash, 
      matricule, 
      service: service._id, 
      role 
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  }
);

// Get all users - accessible to both admin and superadmin
router.get(
  "/super/users",
  requireAuth,
  requireRole(["admin", "superadmin"]),
  async (req, res) => {
    // Both superadmins and regular admins can see all users now
    const users = await UserModel.find()
      .populate('service', 'name')
      .select('-passwordHash')
      .sort({ name: 1 });
    res.json(users);
  }
);

// Super Admin: update a user
router.put(
  "/super/users/:id",
  requireAuth,
  requireRole("superadmin"),
  async (req, res) => {
    const { id } = req.params;
    const { email, name, password, matricule, serviceId, role, active } = req.body as any;
    const update: any = { email, name, matricule, role, active };
    if (serviceId) update.service = serviceId;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);
    const updated = await UserModel.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  }
);

// Super Admin: delete a user
router.delete(
  "/super/users/:id",
  requireAuth,
  requireRole("superadmin"),
  async (req, res) => {
    const { id } = req.params;
    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  }
);

export default router;


