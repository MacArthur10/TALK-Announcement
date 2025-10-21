"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Service_1 = require("../models/Service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.UserModel.findOne({ email, active: true }).populate('service', 'name');
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });
    const secret = process.env.JWT_SECRET || "dev_secret";
    const token = jsonwebtoken_1.default.sign({
        userId: String(user._id),
        role: user.role,
        serviceId: user.service ? String(user.service._id) : undefined,
    }, secret, { expiresIn: "7d" });
    res.json({
        token,
        user: {
            id: String(user._id),
            name: user.name,
            role: user.role,
            // service may be populated (object) or just an ObjectId; handle both safely
            service: user.service && typeof user.service === 'object'
                ? { id: user.service._id, name: user.service.name }
                : null
        }
    });
});
// List all users in the same service as the authenticated user
router.get("/service-members", auth_1.requireAuth, async (req, res) => {
    var _a;
    if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.serviceId))
        return res.status(400).json({ error: "No service assigned" });
    const users = await User_1.UserModel.find({ service: req.auth.serviceId, active: true })
        .select('-passwordHash')
        .populate('service', 'name');
    res.json(users);
});
// List members of a given service (for composing private announcements)
// Accessible to admin and superadmin
router.get("/members", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    const { serviceId } = req.query;
    if (!serviceId)
        return res.status(400).json({ error: "serviceId is required" });
    // Both superadmins and regular admins can view members of any service
    const users = await User_1.UserModel.find({ service: serviceId, active: true })
        .select('-passwordHash')
        .populate('service', 'name');
    res.json(users);
});
// Super Admin: create service admin or employee
router.post("/super/create-user", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { email, name, password, matricule, serviceId, role } = req.body;
    const service = await Service_1.ServiceModel.findById(serviceId);
    if (!service)
        return res.status(400).json({ error: "Service not found" });
    const exists = await User_1.UserModel.findOne({ email });
    if (exists)
        return res.status(409).json({ error: "Email already in use" });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.UserModel.create({
        email,
        name,
        passwordHash,
        matricule,
        service: service._id,
        role
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});
// Get all users - accessible to both admin and superadmin
router.get("/super/users", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    // Both superadmins and regular admins can see all users now
    const users = await User_1.UserModel.find()
        .populate('service', 'name')
        .select('-passwordHash')
        .sort({ name: 1 });
    res.json(users);
});
// Super Admin: update a user
router.put("/super/users/:id", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { id } = req.params;
    const { email, name, password, matricule, serviceId, role, active } = req.body;
    const update = { email, name, matricule, role, active };
    if (serviceId)
        update.service = serviceId;
    if (password)
        update.passwordHash = await bcryptjs_1.default.hash(password, 10);
    const updated = await User_1.UserModel.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    if (!updated)
        return res.status(404).json({ error: 'Not found' });
    res.json(updated);
});
// Super Admin: delete a user
router.delete("/super/users/:id", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { id } = req.params;
    const deleted = await User_1.UserModel.findByIdAndDelete(id);
    if (!deleted)
        return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
});
exports.default = router;
