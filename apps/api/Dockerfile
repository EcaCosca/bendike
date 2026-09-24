# Production image for the API. Built and run from the repo root:
#   docker build -f apps/api/Dockerfile -t bendike-api .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci --ignore-scripts
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @bendike/shared && npm run build -w @bendike/api

# The build stage keeps its dev dependencies and the scripts/ folder, so `--target build` is also the image that
# runs seeds and one-off maintenance against a deployed database. See the `tools` service in docker-compose.prod.yml.
FROM build AS pruned
RUN npm prune --omit=dev --ignore-scripts

FROM node:24-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=pruned /repo/node_modules node_modules
COPY --from=pruned /repo/packages/shared/dist packages/shared/dist
COPY --from=pruned /repo/packages/shared/package.json packages/shared/package.json
COPY --from=pruned /repo/apps/api/dist apps/api/dist
COPY --from=pruned /repo/apps/api/package.json apps/api/package.json
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
