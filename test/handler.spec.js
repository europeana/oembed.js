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
  describe('request query parameters', () => {
    describe('`format`', () => {
      context('when present, but not "json"', () => {
        const req = { query: { format: 'xml' } };

        specify('response status code is 501', () => {
          handler(req, res);

          assert(res.status.calledOnce);
          const status = res.status.args[0][0];

          assert.equal(status, 501);
        });

        specify('response body is JSON containing error message', () => {
          handler(req, res);

          assert(res.json.calledOnce);
          const json = res.json.args[0][0];

          assert.equal(json.error, 'Invalid format: xml');
        });
      });
    });

    describe('`url`', () => {
      context('when present', () => {
        context('but not a known Europeana item URL', () => {
          const req = { query: { url: 'http://example.org/item/abc' } };

          specify('response status code is 501', () => {
            handler(req, res);

            assert(res.status.calledOnce);
            const status = res.status.args[0][0];

            assert.equal(status, 404);
          });

          specify('response body is JSON containing error message', () => {
            handler(req, res);

            assert(res.json.calledOnce);
            const json = res.json.args[0][0];

            assert.equal(json.error, 'Invalid url: http://example.org/item/abc');
          });
        });
      });
    });
  });
});
