/**
 * Express app
 */

import elasticApmNode from 'elastic-apm-node';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';

import config from './config.js';
import handler from './handler.js';

import packageLock from '../package-lock.json' assert { type: 'json' };
const frameworkVersion = packageLock.packages['node_modules/express'].version;
const serviceVersion = packageLock.version;

const elasticApmOptions = {
  ...config.elasticApm,
  frameworkName: 'Express.js',
  frameworkVersion,
  serviceName: 'oembedjs',
  serviceVersion
};
if (elasticApmOptions.serverUrl) {
  elasticApmNode.start(elasticApmOptions);
}

const app = express();

if (config.enable.cors) {
  app.use(cors());
}
if (config.enable.compression) {
  app.use(compression());
}
if (config.enable.logging) {
  app.use(morgan('combined'));
}

app.get('/', handler);

export default app;
