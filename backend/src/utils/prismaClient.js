const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client configured for both local and Vercel serverless environments
 * Reuses connection in development to avoid connection leaks
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    ...(process.env.NODE_ENV === 'production' && {
      // Vercel serverless optimization - only log errors in production
      log: ['error'],
    }),
  });
};

// Reuse Prisma client to avoid connection exhaustion
const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = prisma;
