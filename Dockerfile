FROM node:16-alpine AS build

ENV NODE_ENV=production

WORKDIR /app

COPY package* ./

RUN npm ci

COPY . .


FROM gcr.io/distroless/nodejs:16

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

EXPOSE ${PORT}

WORKDIR /app

COPY --from=build /app .

USER 1000

CMD ["src/server.js"]
