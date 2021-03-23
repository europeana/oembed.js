# Europeana oEmbed.js

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=europeana_oembed.js&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=europeana_oembed.js)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=europeana_oembed.js&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=europeana_oembed.js)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=europeana_oembed.js&metric=security_rating)](https://sonarcloud.io/dashboard?id=europeana_oembed.js)

Europeana oEmbed provider service as an [Express](https://expressjs.com/) web
app.

## Configure

Copy [.env.example](.env.example) to .env and
adapt for your environment.

## Run

### Single process

```
npm run start
```

### Cluster

```
npm run start:cluster
```

## NPM

### Install

```
npm install --save @europeana/oembed
```

### Run

```
npx europeana-oembed
```

## Docker

### Build

```
docker build -t europeana/oembed .
```

### Run

```
docker run -it \
  --env-file .env \
  -p 3000:3000 \
  europeana/oembed
```

## Testing

```
npm run test
```

## License

Licensed under the EUPL v1.2.

For full details, see [LICENSE.md](LICENSE.md).
