# Node version can be supplied from Jenkins
ARG NODE_VERSION=22

# ---- 1. Dependencies: cached until package.json / package-lock.json change ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci installs exactly the committed lockfile (no re-resolving on every
# build). --legacy-peer-deps avoids the Arborist peer-dependency crashes seen
# in Jenkins.
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ---- 2. Build ----
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# These arguments are supplied by Jenkins during docker build
ARG MODE=prod
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_NOTIFY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

# NEXT_PUBLIC variables must exist before npm run build
ENV MODE=${MODE}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_NOTIFY=${NEXT_PUBLIC_API_NOTIFY}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}

# Stop deployment if Firebase build configuration is missing
RUN test -n "${NEXT_PUBLIC_FIREBASE_API_KEY}" \
    && test -n "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
    && test -n "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
    && test -n "${NEXT_PUBLIC_FIREBASE_APP_ID}"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prebuild runs lint; next build type-checks (so tsc is not run twice).
RUN npm run build

# ---- 3. Runtime: only the standalone server, public files and static chunks ----
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ARG MODE=prod
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    MODE=${MODE} \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN npm install -g pm2 --no-audit --no-fund

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["pm2-runtime", "start", "server.js"]
