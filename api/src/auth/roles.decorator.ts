import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Tags a route with the role(s) allowed to call it. RolesGuard reads this back.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
