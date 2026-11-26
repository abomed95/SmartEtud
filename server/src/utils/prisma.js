const { PrismaClient } = require('@prisma/client');

// Instance unique partagée (une seule pool de connexions).
// Important sur Cloud Run + Cloud SQL : chaque PrismaClient ouvre sa propre pool.
const prisma = global.__prisma || new PrismaClient({
  log: process.env.PRISMA_LOG === 'query' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
