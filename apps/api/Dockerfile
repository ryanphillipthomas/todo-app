FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api --ignore-scripts

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY tsconfig.base.json .

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
