FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build

ENV NODE_ENV=production

WORKDIR /app

COPY package* ./

RUN npm ci

COPY . .


FROM gcr.io/distroless/nodejs24-debian13@sha256:78f07ef1b5ea71ad7c055df15d0dd8997f2d288f9158623c4d4ae3d765b7d50d

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

EXPOSE ${PORT}

WORKDIR /app

COPY --from=build /app .

USER 1000

CMD ["src/server.js"]
