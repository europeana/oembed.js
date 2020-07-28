/**
 * Express app
 */

const config = require('./config');

const elasticApmNode = require('elastic-apm-node');
const elasticApmOptions = {
  ...config.elasticApm,
  frameworkName: 'Express.js',
  frameworkVersion: require('express/package.json').version,
  serviceName: 'oembedjs',
  serviceVersion: require('../package').version
};
if (elasticApmOptions.serverUrl) elasticApmNode.start(elasticApmOptions);

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');

const handler = require('./handler');

const app = express();

if (config.enable.cors) app.use(cors());
if (config.enable.compression) app.use(compression());
if (config.enable.logging) app.use(morgan('combined'));

app.get('/', handler);

module.exports = app;
