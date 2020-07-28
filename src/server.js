/**
 * Server to run Express app
 */

const config = require('./config');

const app = require('./app');

const server = app.listen(config.port, () => {
  console.log('Listening on port ' + server.address().port);
});
