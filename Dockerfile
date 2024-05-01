ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-bullseye as build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json reset.d.ts ./
COPY prisma/ ./prisma/
RUN set -ex; npm ci
COPY ./src ./src/
RUN set -ex; npm run build

ENTRYPOINT ["tail"]
CMD ["-f","/dev/null"]

FROM node:${NODE_VERSION}-bullseye as deps
WORKDIR /app
COPY --from=build /root/.npm /root/.npm
COPY ./package.json ./package-lock.json ./
RUN set -ex; npm ci --production

FROM node:${NODE_VERSION}-bullseye-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/package.json ./

RUN apt-get -y update && apt-get install -y openssl

EXPOSE 4000

CMD ["npm", "run", "start:migrate:prod"]