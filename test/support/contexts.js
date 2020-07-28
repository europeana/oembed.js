const fixtures = require('./fixtures');

const whenEmbeddingIsPermitted = (callback) => {
  context('when embedding is permitted', () => {
    for (const rightsStatement of fixtures.rightsStatements.rich) {
      context(`because edm:rights is "${rightsStatement}"`, () => {
        callback(rightsStatement);
      });
    }
  });
};

const whenEmbeddingIsProhibited = (callback) => {
  context('when embedding is prohibited', () => {
    for (const rightsStatement of fixtures.rightsStatements.link) {
      context(`because edm:rights is "${rightsStatement}"`, () => {
        callback(rightsStatement);
      });
    }
  });
};

module.exports = {
  whenEmbeddingIsPermitted,
  whenEmbeddingIsProhibited
};
