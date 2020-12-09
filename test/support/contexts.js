const fixtures = require('./fixtures');

const whenEmbeddingIsPermitted = (callback) => {
  context('when embedding is permitted', () => {
    for (const rightsStatement of fixtures.rightsStatements.rich) {
      for (const mediaType of fixtures.mediaTypes.supported) {
        context(`because edm:rights is "${rightsStatement}" 
      and ebucoreHasMimeType is "${mediaType}"`, () => {
          callback(rightsStatement, mediaType);
        });
      }
    }
  });
};

const whenEmbeddingIsProhibited = (callback) => {
  context('when embedding is prohibited', () => {
    for (const rightsStatement of fixtures.rightsStatements.link) {
      for (const mediaType of fixtures.mediaTypes.unsupported) {
        context(`because edm:rights is "${rightsStatement}" 
        and ebucoreHasMimeType is "${mediaType}"`, () => {
          callback(rightsStatement, mediaType);
        });
      }
    }
  });
};

module.exports = {
  whenEmbeddingIsPermitted,
  whenEmbeddingIsProhibited
};
