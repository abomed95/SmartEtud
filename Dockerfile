# syntax=docker/dockerfile:1.7
# Image unique : API Express + frontend React compilé (servi par Express).
# Un seul service Cloud Run, même origine → pas de CORS, cookies/CSP simples.

# ---- 1. Build du frontend ---------------------------------------------------
FROM node:22-bookworm-slim AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
ARG VITE_DEMO=false
ENV VITE_DEMO=$VITE_DEMO
RUN npm run build

# ---- 2. Dépendances de production du serveur --------------------------------
FROM node:22-bookworm-slim AS server-deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/prisma ./prisma
RUN npx prisma generate

# ---- 3. Image finale ---------------------------------------------------------
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=8080 \
    SERVE_CLIENT=true \
    CLIENT_DIST=/app/client/dist \
    UPLOAD_DIR=/tmp/uploads
WORKDIR /app/server
COPY --from=server-deps --chown=node:node /app/server/node_modules ./node_modules
COPY --chown=node:node server/package.json ./
COPY --chown=node:node server/prisma ./prisma
COPY --chown=node:node server/src ./src
COPY --from=client --chown=node:node /app/client/dist /app/client/dist
USER node
EXPOSE 8080
# tini : transmet correctement SIGTERM (arrêt propre exigé par Cloud Run)
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/app.js"]
