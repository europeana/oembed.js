const flatten = require('lodash.flatten');
const omitBy = require('lodash.omitby');
const isNull = require('lodash.isnull');

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

const rightsUrl = (providerAggregation) => {
  const edmIsShownByWebResource = providerAggregation.webResources
    .find(webResource => webResource.about === providerAggregation.edmIsShownBy);

  return propertyValue('webResourceEdmRights', edmIsShownByWebResource) ||
    propertyValue('edmRights', providerAggregation);
};

// TODO: supply size based on maxWidth in request
const thumbnailUrl = (providerAggregation) => {
  if (!providerAggregation.edmObject) return null;

  const url = new URL(`${constants.API_ORIGIN}/thumbnail/v2/url.json`);
  const params = new URLSearchParams();
  params.append('uri', providerAggregation.edmObject);
  url.search = params.toString();
  return url.toString();
};

const response = (item) => {
  const europeanaProxy = item.proxies.find(proxy => proxy.europeanaProxy);
  const providerProxy = item.proxies.find(proxy => !proxy.europeanaProxy);
  const providerAggregation = item.aggregations[0];

  const title = propertyValue('dcTitle', europeanaProxy) || propertyValue('dcTitle', providerProxy);
  const description = propertyValue('dcDescription', europeanaProxy) || propertyValue('dcDescription', providerProxy);
  const authorName = propertyValue('edmDataProvider', providerAggregation);
  const authorUrl = propertyValue('edmIsShownAt', providerAggregation);

  const response = {
    version: '1.0',
    type: 'rich',
    html: `<iframe src="${constants.EMBED_ORIGIN}${item.about}"></iframe>`,
    // width: 640,
    // height: 480,
    title,
    description,
    'author_name': authorName,
    'author_url': authorUrl,
    'provider_name': 'Europeana',
    'provider_url': providerUrl(item.about),
    'rights_url': rightsUrl(providerAggregation),
    'thumbnail_url': thumbnailUrl(providerAggregation)
    // 'thumbnail_width''
  };

  return omitBy(response, isNull);
};

module.exports = response;
