import { UserRole } from '@prisma/client';

import { hasRoleAccess, isAdministrator, isManagerOrAbove } from './authorization';

describe('authorization role helpers', () => {
  it('allows higher roles to satisfy a lower requirement', () => {
    expect(hasRoleAccess(UserRole.ADMIN, [UserRole.MANAGER])).toBe(true);
    expect(hasRoleAccess(UserRole.SUPER_ADMIN, [UserRole.MANAGER])).toBe(true);
    expect(hasRoleAccess(UserRole.MANAGER, [UserRole.MANAGER])).toBe(true);
    expect(hasRoleAccess(UserRole.EMPLOYEE, [UserRole.MANAGER])).toBe(false);
  });

  it('treats admin and super admin as administrators', () => {
    expect(isAdministrator(UserRole.ADMIN)).toBe(true);
    expect(isAdministrator(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isAdministrator(UserRole.MANAGER)).toBe(false);
  });

  it('treats manager and above as manager-level access', () => {
    expect(isManagerOrAbove(UserRole.MANAGER)).toBe(true);
    expect(isManagerOrAbove(UserRole.ADMIN)).toBe(true);
    expect(isManagerOrAbove(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isManagerOrAbove(UserRole.EMPLOYEE)).toBe(false);
  });
});
