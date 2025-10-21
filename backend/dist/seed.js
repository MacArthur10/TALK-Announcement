"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Service_1 = require("./models/Service");
const User_1 = require("./models/User");
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cad3";
async function seed() {
    await mongoose_1.default.connect(MONGO_URI);
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
    const services = await Promise.all(serviceNames.map(async (name) => {
        const existing = await Service_1.ServiceModel.findOne({ name });
        return existing !== null && existing !== void 0 ? existing : (await Service_1.ServiceModel.create({ name }));
    }));
    // Superadmin
    const superEmail = "superadmin@cad3.local";
    const superPass = "superadmin123";
    const superExisting = await User_1.UserModel.findOne({ email: superEmail });
    if (!superExisting) {
        const passwordHash = await bcryptjs_1.default.hash(superPass, 10);
        await User_1.UserModel.create({
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
        const adminExisting = await User_1.UserModel.findOne({ email: adminEmail });
        if (!adminExisting) {
            const passwordHash = await bcryptjs_1.default.hash(adminPass, 10);
            await User_1.UserModel.create({
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
        const empExisting = await User_1.UserModel.findOne({ email: empEmail });
        if (!empExisting) {
            const passwordHash = await bcryptjs_1.default.hash(empPass, 10);
            await User_1.UserModel.create({
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
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
