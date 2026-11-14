export const ROLES = {
  ADMIN: 'ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  STAFF: 'STAFF',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES] | string;

export const normalizeRole = (role?: string | null): string => {
  if (!role) {
    return ROLES.STAFF;
  }
  const clean = String(role).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (clean === 'ADMIN' || clean === 'ROLE_ADMIN') {
    return ROLES.ADMIN;
  }
  if (
    clean === 'WAREHOUSE_MANAGER' ||
    clean === 'WAREHOUSEMANAGER' ||
    clean === 'MANAGER' ||
    clean === 'ROLE_WAREHOUSE_MANAGER'
  ) {
    return ROLES.WAREHOUSE_MANAGER;
  }
  if (clean === 'STAFF' || clean === 'ROLE_STAFF') {
    return ROLES.STAFF;
  }
  return clean;
};

export const hasRole = (
  userRole: string | undefined | null,
  allowedRoles: readonly string[] | string[],
): boolean => {
  const normalized = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
  return normalizedAllowed.includes(normalized);
};

export const isStaff = (role?: string | null): boolean => {
  return normalizeRole(role) === ROLES.STAFF;
};

export const isWarehouseManager = (role?: string | null): boolean => {
  return normalizeRole(role) === ROLES.WAREHOUSE_MANAGER;
};

export const isAdmin = (role?: string | null): boolean => {
  return normalizeRole(role) === ROLES.ADMIN;
};
