const axios = require('axios');

const config = require('./config');
const constants = require('./constants');
const europeanaRecordResponse = require('./response');

// TODO: break down into more atomic functions
// TODO: detect `format` param present and != "json", and return error
module.exports = async(req, res) => {
  let status;
  let response;

  const format = req.query.format;
  if (format && format !== 'json') {
    status = 501;
    response = { error: `Invalid format: ${format}` };
  } else {
    const url = req.query.url;
    // TODO: consider what other patterns this needs to accept.
    //       see what youtube, soundcloud, vimeo, etc. do
    const europeanaUriPattern = new RegExp('^http://data.europeana.eu/item(/[0-9]+/[a-zA-Z0-9_]+)$');
    const europeanaUriMatch = url.match(europeanaUriPattern);
    if (europeanaUriMatch) {
      const europeanaIdentifier = europeanaUriMatch[1];

      let recordApiResponse;
      try {
        recordApiResponse = await axios.get(
          // TODO: switch to using JSON-LD format?
          // TODO: or even use search.json which is much faster than record.json?
          `${constants.API_ORIGIN}/record${europeanaIdentifier}.json`,
          {
            params: {
              wskey: config.europeana.recordApiKey
            }
          }
        );

        status = 200;
        response = europeanaRecordResponse(recordApiResponse.data.object);
      } catch (error) {
        if (error.response) {
          status = error.response.status;
          response = {
            error: error.response.data.error
          };
        } else {
          status = 500;
          response = {
            error: error.message
          };
        }
      }
    } else {
      status = 404;
      response = { error: `Invalid url: ${url}` };
    }
  }

  res.status(status).json(response);
};
