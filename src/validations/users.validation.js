import { z } from 'zod';

// Coerce id from params to a positive integer
export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Allow updating name, email, and role (role restricted in controller)
export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().max(255).toLowerCase().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
    path: ['name'],
  });
