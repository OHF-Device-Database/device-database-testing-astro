# syntax=docker/dockerfile:1

# Build the Astro app with the standalone Node adapter.
FROM node:24-alpine AS build
ENV DEPLOY_TARGET=node
WORKDIR /app

# Enable pnpm via corepack, pinned to the version in package.json.
RUN corepack enable

# Install dependencies (cached unless the lockfile changes).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build the standalone server output into dist/.
COPY . .
RUN pnpm build

# Reinstall only production dependencies for a lean runtime image.
RUN pnpm prune --prod

# Runtime image: just Node + the built server and its production deps.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Host/port the standalone server binds to. HOST=0.0.0.0 is required in a container.
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 4321

# Run as the built-in unprivileged node user.
USER node

CMD ["node", "./dist/server/entry.mjs"]
