const flatten = require('lodash.flatten');
const omitBy = require('lodash.omitby');
const isNull = require('lodash.isnull');

const config = require('./config');
const constants = require('./constants');

// TODO: i18n
const propertyValue = (propertyName, data) => {
  if (!data || !data[propertyName]) return null;

  const propertyValues = typeof data[propertyName] === 'string' ?
    [data[propertyName]] : Object.values(data[propertyName]);

  return flatten(propertyValues)[0];
};

// TODO: i18n
const providerUrl = (identifier) => {
  return `${constants.WWW_ORIGIN}/item${identifier}`;
};

const rightsUrl = (providerAggregation, edmIsShownByWebResource) => {
  return propertyValue('webResourceEdmRights', edmIsShownByWebResource) ||
    propertyValue('edmRights', providerAggregation);
};

const thumbnailUrl = (providerAggregation, width) => {
  if (!providerAggregation.edmObject) return null;

  const url = new URL(`${constants.API_ORIGIN}/thumbnail/v2/url.json`);

  const params = new URLSearchParams();
  params.append('uri', providerAggregation.edmObject);
  params.append('size', `w${width}`);

  url.search = params.toString();

  return url.toString();
};

const typeForRights = (rights) => {
  if (!rights) return 'link';

  const embeddingPermittedRights = [
    '://creativecommons.org/publicdomain/mark/',
    '://creativecommons.org/publicdomain/zero/',
    '://creativecommons.org/licenses/by/',
    '://creativecommons.org/licenses/by-sa/'
  ];

  if (embeddingPermittedRights.some(permitted => rights.includes(permitted))) {
    return 'rich';
  }
  return 'link';
};

const richHtml = (identifier, { width, height }) => {
  return `<iframe src="${constants.EMBED_ORIGIN}${identifier}" width="${width}" height="${height}"></iframe>`;
};

const thumbnailWidthForMaxWidth = (maxWidth) => {
  return (maxWidth && (maxWidth > 200)) ? 400 : 200;
};

const dimensionsForWebResourceDisplay = (webResource = {}, { maxWidth, maxHeight }) => {
  const dimensions = (webResource.ebucoreWidth && webResource.ebucoreHeight) ?
    {
      width: webResource.ebucoreWidth,
      height: webResource.ebucoreHeight
    } : { ...config.iframe };

  const ratio = dimensions.width / dimensions.height;
  if (maxWidth && (dimensions.width > maxWidth)) {
    dimensions.width = maxWidth;
    dimensions.height = Math.round(maxWidth / ratio);
  }
  if (maxHeight && dimensions.height > maxHeight) {
    dimensions.height = maxHeight;
    dimensions.width = Math.round(maxHeight * ratio);
  }

  return dimensions;
};

const response = (item, options = {}) => {
  const europeanaProxy = item.proxies.find(proxy => proxy.europeanaProxy);
  const providerProxy = item.proxies.find(proxy => !proxy.europeanaProxy);
  const providerAggregation = item.aggregations[0];
  const edmIsShownByWebResource = providerAggregation.webResources
    .find(webResource => webResource.about === providerAggregation.edmIsShownBy);

  const title = propertyValue('dcTitle', europeanaProxy) || propertyValue('dcTitle', providerProxy);
  const description = propertyValue('dcDescription', europeanaProxy) || propertyValue('dcDescription', providerProxy);
  const authorName = propertyValue('edmDataProvider', providerAggregation);
  const authorUrl = propertyValue('edmIsShownAt', providerAggregation);

  const thumbnailWidth = thumbnailWidthForMaxWidth(options.maxWidth);
  const itemThumbnailUrl = thumbnailUrl(providerAggregation, thumbnailWidth);
  const itemRightsUrl = rightsUrl(providerAggregation, edmIsShownByWebResource);
  const type = typeForRights(itemRightsUrl);

  let dimensions;
  if (type === 'rich') dimensions = dimensionsForWebResourceDisplay(edmIsShownByWebResource, options);

  const response = {
    version: '1.0',
    type,
    html: type === 'rich' ? richHtml(item.about, dimensions) : null,
    width: type === 'rich' ? dimensions.width : null,
    height: type === 'rich' ? dimensions.height : null,
    title,
    description,
    'author_name': authorName,
    'author_url': authorUrl,
    'provider_name': 'Europeana',
    'provider_url': providerUrl(item.about),
    'rights_url': itemRightsUrl,
    'thumbnail_url': itemThumbnailUrl,
    'thumbnail_width': itemThumbnailUrl ? thumbnailWidth : null
  };

  return omitBy(response, isNull);
};

module.exports = response;
