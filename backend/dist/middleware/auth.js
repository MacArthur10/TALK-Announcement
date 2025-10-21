"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const secret = process.env.JWT_SECRET || "dev_secret";
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.auth = payload;
        next();
    }
    catch (_a) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
function requireRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.auth)
            return res.status(401).json({ error: "Unauthorized" });
        if (!roleArray.includes(req.auth.role))
            return res.status(403).json({ error: "Forbidden" });
        next();
    };
}
