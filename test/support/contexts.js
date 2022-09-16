import fixtures from './fixtures.js';

export const whenEmbeddingIsPermittedAndSupported = (callback) => {
  context('when embedding is permitted', () => {
    for (const rightsStatement of fixtures.rightsStatements.rich) {
      for (const mediaType of fixtures.mediaTypes.supported) {
        context(`because webResource is "${fixtures.webResource}" and edm:rights is "${rightsStatement}"
      and ebucoreHasMimeType is "${mediaType}"`, () => {
          callback(rightsStatement, mediaType, fixtures.webResource);
        });
      }
    }
  });
};

export const whenEmbeddingIsProhibitedOrUnsupported = (callback) => {
  context('when embedding is prohibited', () => {
    for (const rightsStatement of fixtures.rightsStatements.link) {
      context(`because edm:rights is "${rightsStatement}"`, () => {
        callback(rightsStatement, fixtures.mediaTypes.supported[0], fixtures.webResource);
      });
    }
  }),
  context('when webResource is absent', () => {
    callback(fixtures.rightsStatements.rich[0], fixtures.mediaTypes.supported[0], undefined);
  }),
  context('when embedding is not supported', () => {
    for (const mediaType of fixtures.mediaTypes.unsupported) {
      context(`because ebucoreHasMimeType is "${mediaType}"`, () => {
        callback(fixtures.rightsStatements.rich[0], mediaType, fixtures.webResource);
      });
    }
  });
};
