/**
 * Express route handler for oEmbed requests & responses
 */

import oembedResponse from './response.js';

const errorResponse = (error) => ({ error });

// TODO: break down into more atomic functions
export default async({ query }, res) => {
  let status;
  let response;

  const format = query.format;
  if (format && format !== 'json') {
    status = 501;
    response = { error: `Invalid format: ${format}` };
  } else {
    const url = query.url;
    if (url) {
      try {
        response = await oembedResponse(url, { query });
        if (response) {
          status = 200;
        } else {
          status = 404;
          response = { error: `Invalid url: ${url}` };
        }
      // TODO: limit what is caught here, e.g. to axios errors, otherwise throw back up
      } catch (error) {
        if (error.response) {
          status = error.response.status || 500;
          response = errorResponse(error.response.data.error || error.message);
        } else {
          status = 500;
          response = errorResponse(error.message);
        }
      }
    } else {
      status = 400;
      response = errorResponse('url is required');
    }
  }

  res.status(status).json(response);
};
