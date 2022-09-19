import omitBy from 'lodash.omitby';
import isNull from 'lodash.isnull';

import findProvider from './providers/index.js';

export const responseHtml = ({ src, width, height }) => {
  return `<iframe src="${src}" width="${width}" height="${height}"></iframe>`;
};

export default async(url, { query = {} } = {}) => {
  const provider = findProvider(url);
  if (!provider) {
    return null;
  }

  const response = {
    version: '1.0',
    ...(typeof provider.response === 'function' ? await provider.response(url, query) : provider.response)
  };

  if (!Object.keys(response).includes('html')) {
    const mediaId = provider.id(url);
    const embedSrc = provider.src(mediaId);

    response.html = responseHtml({ src: embedSrc, width: response.width, height: response.height });
  }

  return omitBy(response, isNull);
};
