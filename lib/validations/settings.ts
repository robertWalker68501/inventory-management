import { z } from 'zod';

export const updateTenantSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
