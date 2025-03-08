FROM node:16.15.1-alpine3.16 As build

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN yarn install --frozen-lockfile --cache-folder .yarn --prefer-offline

# Copy source files into the image except for files listed in .dockerignore
COPY --chown=node:node . .

RUN yarn run build

USER node

FROM node:16.15.1-alpine3.16 As production

WORKDIR /app

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

CMD [ "node", "dist/main" ]