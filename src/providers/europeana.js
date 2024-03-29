/**
 * Europeana item oEmbed response generation
 */

import axios from 'axios';
import flatten from 'lodash.flatten';

import config from '../config.js';
import constants from '../constants.js';
import { responseHtml } from '../response.js';

const propertyValue = (propertyName, data, language) => {
  if (!data || !data[propertyName]) {
    return null;
  }

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
  if (!providerAggregation.edmObject) {
    return null;
  }

  const url = new URL(`${constants.API_ORIGIN}/thumbnail/v2/url.json`);

  const params = new URLSearchParams();
  params.append('uri', providerAggregation.edmObject);
  params.append('size', `w${width}`);

  url.search = params.toString();

  return url.toString();
};

const oEmbedType = ({ rights, mediaType }) => {
  return mediaTypeEmbeddable(mediaType) && embeddingPermitted(rights) ? 'rich' : 'link';
};

const oEmbedSrc = (id) => `${constants.EMBED_ORIGIN}${id}`;

// eslint-disable-next-line max-len
// Source logic: https://github.com/europeana/metis-framework/blob/v2.1/metis-common/src/main/java/eu/europeana/metis/utils/MediaType.java#L41-L64
const mediaTypeEmbeddable = (mediaType) => {
  return (typeof mediaType === 'string') &&
    ['audio/', 'image/', 'video/', 'application/dash+xml'].some(prefix => mediaType.startsWith(prefix));
};

const embeddingPermitted = (rights) => {
  const embeddingPermittedRights = [
    '://creativecommons.org/publicdomain/mark/',
    '://creativecommons.org/publicdomain/zero/',
    '://creativecommons.org/licenses/by/',
    '://creativecommons.org/licenses/by-sa/'
  ];

  return (embeddingPermittedRights.some(permitted => (rights || []).includes(permitted)));
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
      const isPreviousInSequenceIndex = items
        .findIndex((item) => item.about === sortItem.isNextInSequence);
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

  const mediaUris = [providerAggregation.edmIsShownBy]
    .concat(providerAggregation.hasView || [])
    .filter(media => media !== undefined);

  // Filter web resources to isShownBy and hasView, respecting the ordering
  const media = providerAggregation.webResources.map(webResource =>
    mediaUris.includes(webResource.about) ? webResource : undefined)
    .filter(media => media !== undefined);

  const webResource = sortByIsNextInSequence(media)[0];

  const title = propertyValue('dcTitle', europeanaProxy, options.language) ||
    propertyValue('dcTitle', providerProxy, options.language);
  const description = propertyValue('dcDescription', europeanaProxy, options.language)
    || propertyValue('dcDescription', providerProxy, options.language);
  // TODO: lookup native org name from entity
  const authorName = propertyValue('edmDataProvider', providerAggregation);
  const authorUrl = propertyValue('edmIsShownAt', providerAggregation);

  const thumbnailWidth = thumbnailWidthForMaxWidth(options.maxWidth);
  const itemThumbnailUrl = thumbnailUrl(providerAggregation, thumbnailWidth);
  const itemRightsUrl = rightsUrl(providerAggregation, webResource);
  const type = oEmbedType({
    rights: itemRightsUrl,
    // fallback in case no webResource (no isShownBy nor hasView)
    mediaType: webResource ? webResource.ebucoreHasMimeType : ''
  });

  let dimensions;
  if (type === 'rich') {
    dimensions = dimensionsForWebResourceDisplay(webResource, options);
  }

  return {
    type,
    html: type === 'rich' ? responseHtml({ src: oEmbedSrc(item.about), ...dimensions }) : null,
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
};

export default {
  schemes: [
    'https://www.europeana.eu/*/item/*',
    'http://www.europeana.eu/*/item/*',
    'https://europeana.eu/*/item/*',
    'http://europeana.eu/*/item/*',
    'https://www.europeana.eu/item/*',
    'http://www.europeana.eu/item/*',
    'https://europeana.eu/item/*',
    'http://europeana.eu/item/*',
    'http://data.europeana.eu/item/*'
  ],

  id: (url) => '/' + (new URL(url)).pathname.split('/').slice(-2).join('/'),

  language: (url) => (new URL(url)).pathname.match(/^\/([a-z]{2})\//)?.[1],

  src: oEmbedSrc,

  response(url, options = {}) {
    const id = this.id(url);
    const language = this.language(url);

    return oEmbedResponseForIdentifier(id, { ...options, language });
  }
};
