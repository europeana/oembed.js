const assert = require('assert');
const sinon = require('sinon');

const handler = require('../src/handler');

const res = {
  json: sinon.stub().returnsThis(),
  status: sinon.stub().returnsThis()
};

afterEach(() => {
  res.json.resetHistory();
  res.status.resetHistory();
});

describe('handler', () => {
  context('when request query includes `format=xml`', () => {
    const req = { query: { format: 'xml' } };

    specify('response status code is 501', () => {
      handler(req, res);

      assert(res.status.calledOnceWith(501));
    });

    specify('response is JSON', () => {
      handler(req, res);

      assert(res.json.calledOnce);
    });

    specify('response body contains error message', () => {
      const expectedErrorMessage = 'Invalid format: xml';

      handler(req, res);
      const json = res.json.args[0][0];

      assert.equal(json.error, expectedErrorMessage);
    });
  });
});
