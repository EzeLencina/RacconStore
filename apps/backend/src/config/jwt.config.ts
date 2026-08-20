import { registerAs } from '@nestjs/config';

function requiredSecret(name: string, fallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return fallback;
}

export default registerAs('jwt', () => ({
  secret: requiredSecret('JWT_SECRET', 'dev-secret'),
  expiresIn: process.env['JWT_EXPIRES_IN'] ?? '15m',
  refreshSecret: requiredSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
}));
