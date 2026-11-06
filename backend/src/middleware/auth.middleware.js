import jwt from "jsonwebtoken";

export const ROLES = {
  ADMIN: "ADMIN",
  WAREHOUSE_MANAGER: "WAREHOUSE_MANAGER",
  STAFF: "STAFF",
};

export const normalizeRole = (role) => {
  if (!role) return ROLES.STAFF;
  const clean = String(role).trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (clean === "ADMIN" || clean === "ROLE_ADMIN") return ROLES.ADMIN;
  if (
    clean === "WAREHOUSE_MANAGER" ||
    clean === "WAREHOUSEMANAGER" ||
    clean === "MANAGER" ||
    clean === "ROLE_WAREHOUSE_MANAGER"
  ) {
    return ROLES.WAREHOUSE_MANAGER;
  }
  if (clean === "STAFF" || clean === "ROLE_STAFF") return ROLES.STAFF;
  return clean;
};

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    decoded.role = normalizeRole(decoded.role);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export const requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions for this operation.",
        requiredRoles: normalizedAllowed,
        currentRole: userRole,
      });
    }

    next();
  };
};