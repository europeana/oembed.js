/**
 * Europeana item oEmbed response generation
 */
// TODO: rename file to indicate Europeana item handling

const axios = require('axios');
const flatten = require('lodash.flatten');
const omitBy = require('lodash.omitby');
const isNull = require('lodash.isnull');

const config = require('./config');
const constants = require('./constants');

const propertyValue = (propertyName, data, language) => {
  if (!data || !data[propertyName]) return null;

  let propertyValues;
  if (typeof data[propertyName] === 'string') {
    propertyValues = [data[propertyName]];
  // TODO: handle three-letter lang codes as property names on `data`
  } else if (language && data[propertyName][language]) {
    propertyValues = [data[propertyName][language]];
  } else {
    propertyValues = Object.values(data[propertyName]);
  }

  return flatten(propertyValues)[0];
};

const providerUrl = (identifier, language) => {
  // TODO: should this check that language is in fact one supported by the portal UI?
  const localePrefix = language ? `/${language}` : '';
  return `${constants.WWW_ORIGIN}${localePrefix}/item${identifier}`;
};

const rightsUrl = (providerAggregation, webResource) => {
  return propertyValue('webResourceEdmRights', webResource) ||
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

const oEmbedType = ({ rights, mediaType }) => {
  return embeddableMediaType(mediaType) && embeddableRights(rights) ? 'rich' : 'link';
};

const embeddableMediaType = (mediaType) => {
  return (typeof mediaType === 'string') &&
        ['audio', 'image', 'video'].includes(mediaType.split('/')[0]);
};

const embeddableRights = (rights) => {
  const embeddingPermittedRights = [
    '://creativecommons.org/publicdomain/mark/',
    '://creativecommons.org/publicdomain/zero/',
    '://creativecommons.org/licenses/by/',
    '://creativecommons.org/licenses/by-sa/'
  ];

  return (embeddingPermittedRights.some(permitted => (rights || []).includes(permitted)));
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

const fetchItem = async(identifier) => {
  const recordApiResponse = await axios.get(
    `${constants.API_ORIGIN}/record${identifier}.json`, {
      params: {
        wskey: config.europeana.recordApiKey
      }
    });
  return recordApiResponse.data.object;
};

const oEmbedResponseForIdentifier = async(identifier, options = {}) => {
  const item = await fetchItem(identifier);
  return oEmbedResponseForItem(item, options);
};

function sortByIsNextInSequence(source) {
  // Make a copy to work on
  const items = [].concat(source);

  const itemUris = items.map((item) => item.about);

  for (const uri of itemUris) {
    // It's necessary to find the item on each iteration to sort as it may have
    // been moved from its original position by a previous iteration.
    const sortItemIndex = items.findIndex((item) => item.about === uri);
    const sortItem = items[sortItemIndex];

    // If it has isNextInSequence property, move it after that item; else
    // leave it be.
    if (sortItem.isNextInSequence) {
      const isPreviousInSequenceIndex = items.findIndex((item) => item.about === sortItem.isNextInSequence);
      if (isPreviousInSequenceIndex !== -1) {
        // Remove the item from its original position.
        items.splice(sortItemIndex, 1);
        // Insert the item after its predecessor.
        items.splice(isPreviousInSequenceIndex + 1, 0, sortItem);
      }
    }
  }

  return items;
}

const oEmbedResponseForItem = (item, options = {}) => {
  const europeanaProxy = item.proxies.find(proxy => proxy.europeanaProxy);
  const providerProxy = item.proxies.find(proxy => !proxy.europeanaProxy);
  const providerAggregation = item.aggregations[0];

  const edmIsShownByOrAt = providerAggregation.edmIsShownBy || providerAggregation.edmIsShownAt;
  const unsortedMedia = new Set([edmIsShownByOrAt].concat(providerAggregation.hasView || [])
    .filter(media => media !== undefined));
  const webResource = sortByIsNextInSequence(unsortedMedia)[0];

  const title = propertyValue('dcTitle', europeanaProxy, options.language) ||
    propertyValue('dcTitle', providerProxy, options.language);
  const description = propertyValue('dcDescription', europeanaProxy, options.language)
    || propertyValue('dcDescription', providerProxy, options.language);
  const authorName = propertyValue('edmDataProvider', providerAggregation);
  const authorUrl = propertyValue('edmIsShownAt', providerAggregation);

  const thumbnailWidth = thumbnailWidthForMaxWidth(options.maxWidth);
  const itemThumbnailUrl = thumbnailUrl(providerAggregation, thumbnailWidth);
  const itemRightsUrl = rightsUrl(providerAggregation, webResource);
  const type = oEmbedType({
    rights: itemRightsUrl,
    mediaType: webResource.ebucoreHasMimeType
  });

  let dimensions;
  if (type === 'rich') dimensions = dimensionsForWebResourceDisplay(webResource, options);

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
    'provider_url': providerUrl(item.about, options.language),
    'rights_url': itemRightsUrl,
    'thumbnail_url': itemThumbnailUrl,
    'thumbnail_width': itemThumbnailUrl ? thumbnailWidth : null
  };

  return omitBy(response, isNull);
};

module.exports = {
  identifier: oEmbedResponseForIdentifier,
  item: oEmbedResponseForItem
};
