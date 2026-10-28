FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV DATABASE_URL=file:/tmp/build.db
ENV ALLOW_DEMO_SEED=false
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/distinto.db
ENV UPLOAD_DIR=/app/public/uploads
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app ./
RUN mkdir -p data public/uploads && chown -R node:node data public/uploads
USER node
EXPOSE 3001
CMD ["npm", "run", "start"]
