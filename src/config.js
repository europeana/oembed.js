require('dotenv').config();

module.exports = {
  elasticApm: {
    environment: process.env.ELASTIC_APM_ENVIRONMENT || 'development',
    logLevel: process.env.ELASTIC_APM_LOG_LEVEL || 'info',
    serverUrl: process.env.ELASTIC_APM_SERVER_URL
  },
  enable: {
    compression: !Number(process.env.DISABLE_COMPRESSION),
    cors: !Number(process.env.DISABLE_CORS),
    logging: !Number(process.env.DISABLE_LOGGING)
  },
  europeana: {
    recordApiKey: process.env.EUROPEANA_RECORD_API_KEY
  },
  port: process.env.PORT || 3000
};
