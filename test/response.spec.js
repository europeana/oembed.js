const assert = require('assert');
const fixtures = require('./support/fixtures');

const response = require('../src/response');

const itemTemplate = {
  aggregations: [{ webResources: [] }],
  proxies: [{ europeanaProxy: true }, { europeanaProxy: false }]
};

describe('response', () => {
  describe('version', () => {
    it('should be "1.0"', () => {
      const item = { ...itemTemplate };
      const expected = '1.0';

      const version = response(item).version;

      assert.equal(version, expected);
    });
  });

  describe('type', () => {
    context('when embedding is permitted', () => {
      for (const rightsStatement of fixtures.rightsStatements.rich) {
        context(`because edm:rights is "${rightsStatement}"`, () => {
          const item = {
            ...itemTemplate,
            aggregations: [
              {
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: []
              }
            ]
          };

          it('should be "rich"', () => {
            const expected = 'rich';

            const type = response(item).type;

            assert.equal(type, expected);
          });
        });
      }
    });

    context('when embedding is prohibited', () => {
      for (const rightsStatement of fixtures.rightsStatements.link) {
        context(`because edm:rights is "${rightsStatement}"`, () => {
          const item = {
            ...itemTemplate,
            aggregations: [
              {
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: []
              }
            ]
          };

          it('should be "link"', () => {
            const expected = 'link';

            const type = response(item).type;

            assert.equal(type, expected);
          });
        });
      }
    });
  });

  describe('width', () => {
    it('should equal maxWidth request parameter');
  });

  describe('height', () => {
    it('should equal maxHeight request parameter');
  });

  describe('html', () => {
    context('when embedding is permitted', () => {
      for (const rightsStatement of fixtures.rightsStatements.rich) {
        context(`because edm:rights is "${rightsStatement}"`, () => {
          const item = {
            ...itemTemplate,
            about: '/123/abc',
            aggregations: [
              {
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: []
              }
            ]
          };
          
          it('should be an iframe with Europeana Media service as its source', () => {
            const expected = '<iframe src="https://embed.europeana.eu/123/abc"></iframe>';

            const html = response(item).html;

            assert.equal(html, expected);
          });
        });
      }
    });
    
    context('when embedding is prohibited', () => {
      for (const rightsStatement of fixtures.rightsStatements.link) {
        context(`because edm:rights is "${rightsStatement}"`, () => {
          const item = {
            ...itemTemplate,
            about: '/123/abc',
            aggregations: [
              {
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: []
              }
            ]
          };
          
          it('should be omitted', () => {
            const itemResponse = response(item);

            assert(!Object.keys(itemResponse).includes('title'));
          });
        });
      }
    });
  });

  describe('title', () => {
    context('when Europeana proxy has title', () => {
      const item = {
        ...itemTemplate,
        proxies: [
          {
            europeanaProxy: true,
            dcTitle: {
              en: 'Europeana proxy title'
            }
          },
          {
            europeanaProxy: false,
            dcTitle: {
              en: 'Provider proxy title'
            }
          }
        ]
      };

      it('should be title from Europeana proxy', () => {
        const expected = 'Europeana proxy title';

        const title = response(item).title;

        assert.equal(title, expected);
      });
    });

    context('when Europeana proxy lacks title', () => {
      context('when provider proxy has title', () => {
        const item = {
          ...itemTemplate,
          proxies: [
            {
              europeanaProxy: true
            },
            {
              europeanaProxy: false,
              dcTitle: {
                en: 'Provider proxy title'
              }
            }
          ]
        };

        it('should be title from provider proxy', () => {
          const expected = 'Provider proxy title';

          const title = response(item).title;

          assert.equal(title, expected);
        });
      });

      context('when provider proxy lacks title', () => {
        const item = {
          ...itemTemplate,
          proxies: [
            {
              europeanaProxy: true
            },
            {
              europeanaProxy: false
            }
          ]
        };

        it('should be omitted', () => {
          const itemResponse = response(item);

          assert(!Object.keys(itemResponse).includes('title'));
        });
      });
    });
  });

  describe('description', () => {
    context('when Europeana proxy has description', () => {
      const item = {
        ...itemTemplate,
        proxies: [
          {
            europeanaProxy: true,
            dcDescription: {
              en: 'Europeana proxy description'
            }
          },
          {
            europeanaProxy: false,
            dcDescription: {
              en: 'Provider proxy description'
            }
          }
        ]
      };

      it('should be description from Europeana proxy', () => {
        const expected = 'Europeana proxy description';

        const title = response(item).description;

        assert.equal(title, expected);
      });
    });

    context('when Europeana proxy lacks description', () => {
      context('when provider proxy has description', () => {
        const item = {
          ...itemTemplate,
          proxies: [
            {
              europeanaProxy: true
            },
            {
              europeanaProxy: false,
              dcDescription: {
                en: 'Provider proxy description'
              }
            }
          ]
        };

        it('should be description from provider proxy', () => {
          const expected = 'Provider proxy description';

          const title = response(item).description;

          assert.equal(title, expected);
        });
      });

      context('when provider proxy lacks description', () => {
        const item = {
          ...itemTemplate,
          proxies: [
            {
              europeanaProxy: true
            },
            {
              europeanaProxy: false
            }
          ]
        };

        it('should be omitted', () => {
          const itemResponse = response(item);

          assert(!Object.keys(itemResponse).includes('description'));
        });
      });
    });
  });

  describe('author_name', () => {
    it('should be edm:dataProvider from the aggregation', () => {
      const item = {
        ...itemTemplate,
        aggregations: [
          {
            edmDataProvider: {
              def: ['Data Provider']
            },
            webResources: []
          }
        ]
      };
      const expected = 'Data Provider';

      const authorName = response(item)['author_name'];

      assert.equal(authorName, expected);
    });
  });

  describe('author_url', () => {
    context('when aggregation has edm:isShownAt', () => {
      const item = {
        ...itemTemplate,
        aggregations: [
          {
            edmIsShownAt: 'https://www.example.org/123/abc',
            webResources: []
          }
        ]
      };

      it('should be edm:isShownAt from aggregation', () => {
        const expected = 'https://www.example.org/123/abc';

        const authorUrl = response(item)['author_url'];

        assert.equal(authorUrl, expected);
      });
    });

    context('when aggregation lacks edm:isShownAt', () => {
      const item = { ...itemTemplate };

      it('should be omitted', () => {
        const itemResponse = response(item);

        assert(!Object.keys(itemResponse).includes('description'));
      });
    });
  });

  describe('provider_name', () => {
    it('should be "Europeana"', () => {
      const item = { ...itemTemplate };
      const expected = 'Europeana';

      const providerName = response(item)['provider_name'];

      assert.equal(providerName, expected);
    });
  });

  describe('provider_url', () => {
    it('should be a Europeana website item page URL', () => {
      const item = { ...itemTemplate, about: '/123/abc' };
      const expected = 'https://www.europeana.eu/item/123/abc';

      const providerUrl = response(item)['provider_url'];

      assert.equal(providerUrl, expected);
    });
  });

  describe('rights_url', () => {
    context('when edm:isShownBy is present', () => {
      context('and edm:isShownBy has edm:rights', () => {
        const item = {
          ...itemTemplate,
          aggregations: [
            {
              edmIsShownBy: 'https://example.org/image.jpeg',
              edmRights: {
                def: ['http://creativecommons.org/licenses/by-sa/4.0/']
              },
              webResources: [
                {
                  about: 'https://example.org/image.jpeg',
                  webResourceEdmRights: {
                    def: ['http://rightsstatements.org/vocab/CNE/1.0/']
                  }
                }
              ]
            }
          ]
        };

        it('should be edm:rights of edm:isShownBy', () => {
          const expected = 'http://rightsstatements.org/vocab/CNE/1.0/';

          const rightsUrl = response(item)['rights_url'];

          assert.equal(rightsUrl, expected);
        });
      });

      context('and edm:isShownBy lacks edm:rights', () => {
        const item = {
          ...itemTemplate,
          aggregations: [
            {
              edmIsShownBy: 'https://example.org/image.jpeg',
              edmRights: {
                def: ['http://creativecommons.org/licenses/by-sa/4.0/']
              },
              webResources: [
                {
                  about: 'https://example.org/image.jpeg'
                }
              ]
            }
          ]
        };

        it('should be edm:rights of aggregation', () => {
          const expected = 'http://creativecommons.org/licenses/by-sa/4.0/';

          const rightsUrl = response(item)['rights_url'];

          assert.equal(rightsUrl, expected);
        });
      });
    });

    context('when edm:isShownBy is absent', () => {
      const item = {
        ...itemTemplate,
        aggregations: [
          {
            edmRights: {
              def: ['http://creativecommons.org/licenses/by-sa/4.0/']
            },
            webResources: [
              {
                about: 'https://example.org/image.jpeg'
              }
            ]
          }
        ]
      };

      it('should be edm:rights of aggregation', () => {
        const expected = 'http://creativecommons.org/licenses/by-sa/4.0/';

        const rightsUrl = response(item)['rights_url'];

        assert.equal(rightsUrl, expected);
      });
    });
  });

  describe('thumbnail_url', () => {
    context('when edm:object is absent', () => {
      const item = { ...itemTemplate };

      it('should be null', () => {
        const expected = null;

        const thumbnailUrl = response(item)['thumbnail_url'];

        assert.equal(thumbnailUrl, expected);
      });
    });

    context('when edm:object is present', () => {
      const item = {
        ...itemTemplate,
        aggregations: [
          {
            edmObject: 'https://example.org/image.jpeg',
            webResources: []
          }
        ]
      };

      it('should be Europeana Thumbnail API URL', () => {
        const expected = 'https://api.europeana.eu/thumbnail/v2/url.json?uri=https%3A%2F%2Fexample.org%2Fimage.jpeg';

        const thumbnailUrl = response(item)['thumbnail_url'];

        assert.equal(thumbnailUrl, expected);
      });

      context('when maxwidth in request params <= 200', () => {
        it('should have param size=w200');
      });

      context('when maxwidth in request params > 200', () => {
        it('should have param size=w400');
      });
    });
  });

  describe('thumbnail_width', () => {
    context('when maxwidth in request params <= 200', () => {
      it('should be 200');
    });

    context('when maxwidth in request params > 200', () => {
      it('should be 400');
    });
  });
});
