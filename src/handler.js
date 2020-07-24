const axios = require('axios');

const config = require('./config');
const constants = require('./constants');
const europeanaRecordResponse = require('./response');

const europeanaIdentifierFromUrl = (url) => {
  const patterns = [
    // www.europeana.eu item page URLs
    /^https?:\/\/(?:www\.)?europeana\.eu\/(?:[a-z]{2}\/)?item(\/[0-9]+\/[^/]+)$/,
    // data.europeana.eu URIs
    /^http:\/\/data\.europeana\.eu\/item(\/[0-9]+\/[^/]+)$/
  ];
  for (const pattern of patterns) {
    const europeanaUriMatch = url.match(pattern);
    if (europeanaUriMatch) return europeanaUriMatch[1];
  }
  return null;
};

// TODO: break down into more atomic functions
// TODO: detect `format` param present and != "json", and return error
module.exports = async(req, res) => {
  let status;
  let response;

  const url = req.query.url;
  const europeanaIdentifier = europeanaIdentifierFromUrl(url);
  if (europeanaIdentifier) {
    let recordApiResponse;
    try {
      recordApiResponse = await axios.get(
        // TODO: switch to using JSON-LD format
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
        response = error.message;
      }
    }
  } else {
    status = 400;
    response = { error: `Invalid URL: ${url}` };
  }

  res.status(status).json(response);
};
