import { z } from 'zod';

export const membershipRoles = [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'STAFF',
  'VIEWER',
] as const;

export const invitableRoles = [
  'ADMIN',
  'MANAGER',
  'STAFF',
  'VIEWER',
] as const;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(invitableRoles),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(invitableRoles),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const inviteSignUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type InviteSignUpInput = z.infer<typeof inviteSignUpSchema>;
