import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Email inválido');
const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'Contraseña demasiado larga');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Nombre demasiado largo'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;