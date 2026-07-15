import { JwtPayload } from '../auth/auth.service';

/**
 * Scopes models with a direct `branchId` column (SalesOrder, ExportShipment).
 */
export function buildBranchScopeFilter(user: JwtPayload) {
  if (user.roleName === 'Super Admin') {
    return { branch: { country: { companyId: user.companyId } } };
  }
  if (user.roleName === 'Country Admin') {
    if (!user.countryId) return { branch: { countryId: { in: [] as number[] } } };
    return { branch: { countryId: user.countryId } };
  }
  if (!user.branchId) return { branchId: { in: [] as number[] } };
  return { branchId: user.branchId };
}

/**
 * Scopes models linked via a `userId` FK (Attendance).
 */
export function buildUserScopeFilter(user: JwtPayload) {
  if (user.roleName === 'Super Admin') {
    return { user: { companyId: user.companyId } };
  }
  if (user.roleName === 'Country Admin') {
    if (!user.countryId) return { userId: { in: [] as number[] } };
    return { user: { countryId: user.countryId } };
  }
  if (user.roleName === 'Manager' || user.roleName === 'Team Lead') {
    if (!user.branchId) return { userId: { in: [] as number[] } };
    return { user: { branchId: user.branchId } };
  }
  return { userId: user.sub };
}

/**
 * Scopes the Country entity itself.
 */
export function buildCountryScopeFilter(user: JwtPayload) {
  if (user.roleName === 'Super Admin') return { companyId: user.companyId };
  if (!user.countryId) return { id: { in: [] as number[] } };
  return { id: user.countryId };
}

/**
 * Scopes the Branch entity itself.
 */
export function buildBranchEntityScopeFilter(user: JwtPayload) {
  if (user.roleName === 'Super Admin') {
    return { country: { companyId: user.companyId } };
  }
  if (user.roleName === 'Country Admin') {
    if (!user.countryId) return { id: { in: [] as number[] } };
    return { countryId: user.countryId };
  }
  if (!user.branchId) return { id: { in: [] as number[] } };
  return { id: user.branchId };
}