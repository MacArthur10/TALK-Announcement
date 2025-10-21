"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Service_1 = require("../models/Service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Allow both Admin and Super Admin to get services list
router.get("/", auth_1.requireAuth, (0, auth_1.requireRole)(["admin", "superadmin"]), async (_req, res) => {
    const services = await Service_1.ServiceModel.find().sort({ name: 1 });
    res.json(services);
});
router.post("/", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { name, description } = req.body;
    const exists = await Service_1.ServiceModel.findOne({ name });
    if (exists)
        return res.status(409).json({ error: "Service already exists" });
    const service = await Service_1.ServiceModel.create({ name, description });
    res.status(201).json(service);
});
router.put("/:id", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await Service_1.ServiceModel.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!updated)
        return res.status(404).json({ error: "Not found" });
    res.json(updated);
});
router.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)("superadmin"), async (req, res) => {
    const { id } = req.params;
    await Service_1.ServiceModel.findByIdAndDelete(id);
    res.status(204).send();
});
exports.default = router;
