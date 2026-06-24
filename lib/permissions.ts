import type { MembershipRole } from '@/app/generated/prisma/client';

const ROLE_RANK: Record<MembershipRole, number> = {
  VIEWER: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

export function hasMinimumRole(
  role: MembershipRole,
  minimumRole: MembershipRole
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function canManageTeam(role: MembershipRole): boolean {
  return hasMinimumRole(role, 'ADMIN');
}

export function canManageTenantSettings(role: MembershipRole): boolean {
  return hasMinimumRole(role, 'ADMIN');
}

export function canManageTenantSlug(role: MembershipRole): boolean {
  return role === 'OWNER';
}

export function canAssignRole(
  actorRole: MembershipRole,
  role: MembershipRole
): boolean {
  if (role === 'OWNER') {
    return false;
  }

  if (actorRole === 'OWNER') {
    return true;
  }

  if (actorRole === 'ADMIN') {
    return role === 'MANAGER' || role === 'STAFF' || role === 'VIEWER';
  }

  return false;
}

export function canManageMember(
  actorRole: MembershipRole,
  actorUserId: string,
  targetUserId: string,
  targetRole: MembershipRole
): boolean {
  if (!canManageTeam(actorRole)) {
    return false;
  }

  if (actorUserId === targetUserId) {
    return false;
  }

  if (targetRole === 'OWNER' && actorRole !== 'OWNER') {
    return false;
  }

  if (actorRole !== 'OWNER' && ROLE_RANK[targetRole] >= ROLE_RANK[actorRole]) {
    return false;
  }

  return true;
}

export function getAssignableRoles(actorRole: MembershipRole): MembershipRole[] {
  const roles: MembershipRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'];
  return roles.filter((role) => canAssignRole(actorRole, role));
}

export function canManageOperations(role: MembershipRole): boolean {
  return hasMinimumRole(role, 'STAFF');
}

export function canManageInventory(role: MembershipRole): boolean {
  return hasMinimumRole(role, 'STAFF');
}

export function canManageWarehouses(role: MembershipRole): boolean {
  return hasMinimumRole(role, 'STAFF');
}

export function canViewOnly(role: MembershipRole): boolean {
  return role === 'VIEWER';
}
