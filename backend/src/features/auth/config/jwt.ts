import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'secret-access',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'secret-refresh',
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '604800', 10),
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
}));
