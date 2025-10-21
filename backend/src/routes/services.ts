import { Router } from "express";
import { ServiceModel } from "../models/Service";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Allow both Admin and Super Admin to get services list
router.get("/", requireAuth, requireRole(["admin", "superadmin"]), async (_req, res) => {
  const services = await ServiceModel.find().sort({ name: 1 });
  res.json(services);
});

router.post("/", requireAuth, requireRole("superadmin"), async (req, res) => {
  const { name, description } = req.body as { name: string; description?: string };
  const exists = await ServiceModel.findOne({ name });
  if (exists) return res.status(409).json({ error: "Service already exists" });
  const service = await ServiceModel.create({ name, description });
  res.status(201).json(service);
});

router.put("/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body as { name?: string; description?: string };
  const updated = await ServiceModel.findByIdAndUpdate(id, { name, description }, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  const { id } = req.params;
  await ServiceModel.findByIdAndDelete(id);
  res.status(204).send();
});

export default router;



