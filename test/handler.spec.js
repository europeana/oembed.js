const assert = require('assert');
const sinon = require('sinon');
const nock = require('nock');

const fixtures = require('./support/fixtures');

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
      context('when absent', () => {
        const req = { query: {} };

        specify('response status code is 400', () => {
          handler(req, res);

          assert(res.status.calledOnce);
          const status = res.status.args[0][0];

          assert.equal(status, 400);
        });

        specify('response body is JSON containing error message', () => {
          handler(req, res);

          assert(res.json.calledOnce);
          const json = res.json.args[0][0];

          assert.equal(json.error, 'url is required');
        });
      });

      context('when present', () => {
        context('and a known Europeana item URL', () => {
          const item = fixtures.items.milkmaid;

          beforeEach(() => {
            nock('https://api.europeana.eu')
              .get(`/record${item.identifier}.json`)
              .query(true)
              .reply(200, { object: fixtures.items.template });
          });

          for (const url of item.urls) {
            context(`like "${url}"`, () => {
              const req = { query: { url } };

              specify('response status code is 200', async() => {
                await handler(req, res);

                assert(res.status.calledOnce);
                const status = res.status.args[0][0];

                assert.equal(status, 200);
              });

              specify('response body is JSON containing oEmbed response', async() => {
                await handler(req, res);

                assert(res.json.calledOnce);
                const json = res.json.args[0][0];

                assert.equal(json.version, '1.0');
              });

              it('queried the Europeana Record API', async() => {
                await handler(req, res);

                assert(nock.isDone());
              });
            });
          }
        });

        context('but not a recognised Europeana item URL', () => {
          const req = { query: { url: 'http://example.org/item/abc' } };

          specify('response status code is 404', async() => {
            await handler(req, res);

            assert(res.status.calledOnce);
            const status = res.status.args[0][0];

            assert.equal(status, 404);
          });

          specify('response body is JSON containing error message', async() => {
            await handler(req, res);

            assert(res.json.calledOnce);
            const json = res.json.args[0][0];

            assert.equal(json.error, 'Invalid url: http://example.org/item/abc');
          });
        });
      });
    });
  });
});
