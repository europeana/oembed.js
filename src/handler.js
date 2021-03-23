/**
 * Express route handler for oEmbed requests & responses
 */

const oEmbedResponseForEuropeanaIdentifier = require('./response').identifier;

const responseForRequestQueryUrl = (url, options = {}) => {
  // TODO: move into response.js? (but renaming it to be Europeana item specific)
  const patterns = {
    // www.europeana.eu item page URLs
    'https?://(?:www\\.)?europeana\\.eu/(([a-z]{2})/)?item(/[0-9]+/[^/]+)$': (match) => {
      const identifier = match[3];
      return oEmbedResponseForEuropeanaIdentifier(identifier, { ...options, language: match[2] });
    },
    // data.europeana.eu URIs
    '^http://data\\.europeana\\.eu/item(/[0-9]+/[^/]+)$': (match) => {
      const identifier = match[1];
      return oEmbedResponseForEuropeanaIdentifier(identifier, options);
    }
  };

  for (const pattern in patterns) {
    const urlMatch = url.match(new RegExp(pattern));
    if (urlMatch) {
      return patterns[pattern](urlMatch);
    }
  }

  return null;
};

// TODO: break down into more atomic functions
module.exports = async(req, res) => {
  let status;
  let response;

  const format = req.query.format;
  if (format && format !== 'json') {
    status = 501;
    response = { error: `Invalid format: ${format}` };
  } else {
    const url = req.query.url;
    if (url) {
      try {
        response = await responseForRequestQueryUrl(url, {
          maxWidth: req.query.maxwidth ? Number(req.query.maxwidth) : undefined,
          maxHeight: req.query.maxheight ? Number(req.query.maxheight) : undefined
        });

        if (response) {
          status = 200;
        } else {
          status = 404;
          response = { error: `Invalid url: ${url}` };
        }
      // TODO: limit what is caught here, e.g. to axios errors, otherwise throw back up
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
      status = 400;
      response = { error: 'url is required' };
    }
  }

  res.status(status).json(response);
};
