# syntax=docker/dockerfile:1

# --- Stage 1: install production dependencies ----------------------------------
# Debian slim over alpine: bcrypt and other native deps ship glibc prebuilds,
# so we avoid pulling a full build toolchain just to compile them.
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Copy only the manifests first so this layer is cached unless deps change.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# --- Stage 2: runtime ---------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Bring in the already-resolved modules, then the source.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

# Drop root. The node image ships an unprivileged "node" user.
USER node

EXPOSE 5000

# Hit the health endpoint the app already exposes. No curl in slim, so use node.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
