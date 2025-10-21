import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { ServiceModel } from "./models/Service";
import { UserModel } from "./models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cad3";

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Base services
  const serviceNames = [
    "Affaires Générales",
    "Coopération et Partenariats",
    "État Civil",
    "Hygiène",
    "Fourrière",
    "Finances",
    "Sociale",
    "Taxes",
    "Cellule de Communication",
    "Police Municipale",
  ];

  const services = await Promise.all(
    serviceNames.map(async (name) => {
      const existing = await ServiceModel.findOne({ name });
      return existing ?? (await ServiceModel.create({ name }));
    })
  );

  // Superadmin
  const superEmail = "superadmin@cad3.local";
  const superPass = "superadmin123";
  const superExisting = await UserModel.findOne({ email: superEmail });
  if (!superExisting) {
    const passwordHash = await bcrypt.hash(superPass, 10);
    await UserModel.create({
      email: superEmail,
      name: "Super Admin",
      passwordHash,
      matricule: "SA-0001",
      role: "superadmin",
      active: true,
    });
  }

  // Create one admin for "État Civil" and one employee
  const etatCivil = services.find((s) => s.name === "État Civil");
  if (etatCivil) {
    const adminEmail = "admin.etatcivil@cad3.local";
    const adminPass = "admin12345";
    const adminExisting = await UserModel.findOne({ email: adminEmail });
    if (!adminExisting) {
      const passwordHash = await bcrypt.hash(adminPass, 10);
      await UserModel.create({
        email: adminEmail,
        name: "Admin État Civil",
        passwordHash,
        matricule: "ADM-ETC-01",
        role: "admin",
        service: etatCivil._id,
        active: true,
      });
    }

    const empEmail = "employee.etatcivil@cad3.local";
    const empPass = "employee123";
    const empExisting = await UserModel.findOne({ email: empEmail });
    if (!empExisting) {
      const passwordHash = await bcrypt.hash(empPass, 10);
      await UserModel.create({
        email: empEmail,
        name: "Employé État Civil",
        passwordHash,
        matricule: "EMP-ETC-01",
        role: "employee",
        service: etatCivil._id,
        active: true,
      });
    }
  }

  console.log("Seeding complete");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});



