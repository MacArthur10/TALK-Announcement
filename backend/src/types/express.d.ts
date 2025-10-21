import "express";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: string;
      role: "superadmin" | "admin" | "employee";
      serviceId?: string;
    };
    file?: any;
  }
}



