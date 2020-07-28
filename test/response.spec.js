const assert = require('assert');
const fixtures = require('./support/fixtures');

const response = require('../src/response');

describe('response', () => {
  describe('.identifier()', () => {
    describe('version', () => {
      it('should be "1.0"', () => {
        const item = { ...fixtures.items.template };
        const expected = '1.0';

        const version = response.item(item).version;

        assert.equal(version, expected);
      });
    });

    describe('type', () => {
      context('when embedding is permitted', () => {
        for (const rightsStatement of fixtures.rightsStatements.rich) {
          context(`because edm:rights is "${rightsStatement}"`, () => {
            const item = {
              ...fixtures.items.template,
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

              const type = response.item(item).type;

              assert.equal(type, expected);
            });
          });
        }
      });

      context('when embedding is prohibited', () => {
        for (const rightsStatement of fixtures.rightsStatements.link) {
          context(`because edm:rights is "${rightsStatement}"`, () => {
            const item = {
              ...fixtures.items.template,
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

              const type = response.item(item).type;

              assert.equal(type, expected);
            });
          });
        }
      });
    });

    describe('width', () => {
      it('should respect maxwidth request parameter');
    });

    describe('height', () => {
      it('should respect maxheight request parameter');
    });

    describe('html', () => {
      context('when embedding is permitted', () => {
        for (const rightsStatement of fixtures.rightsStatements.rich) {
          context(`because edm:rights is "${rightsStatement}"`, () => {
            const item = {
              ...fixtures.items.template,
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

              const html = response.item(item).html;

              assert.equal(html, expected);
            });
          });
        }
      });

      context('when embedding is prohibited', () => {
        for (const rightsStatement of fixtures.rightsStatements.link) {
          context(`because edm:rights is "${rightsStatement}"`, () => {
            const item = {
              ...fixtures.items.template,
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
              const itemResponse = response.item(item);

              assert(!Object.keys(itemResponse).includes('title'));
            });
          });
        }
      });
    });

    describe('title', () => {
      context('when Europeana proxy has title', () => {
        const item = {
          ...fixtures.items.template,
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

          const title = response.item(item).title;

          assert.equal(title, expected);
        });
      });

      context('when Europeana proxy lacks title', () => {
        context('when provider proxy has title', () => {
          const item = {
            ...fixtures.items.template,
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

            const title = response.item(item).title;

            assert.equal(title, expected);
          });
        });

        context('when provider proxy lacks title', () => {
          const item = {
            ...fixtures.items.template,
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
            const itemResponse = response.item(item);

            assert(!Object.keys(itemResponse).includes('title'));
          });
        });
      });
    });

    describe('description', () => {
      context('when Europeana proxy has description', () => {
        const item = {
          ...fixtures.items.template,
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

          const title = response.item(item).description;

          assert.equal(title, expected);
        });
      });

      context('when Europeana proxy lacks description', () => {
        context('when provider proxy has description', () => {
          const item = {
            ...fixtures.items.template,
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

            const title = response.item(item).description;

            assert.equal(title, expected);
          });
        });

        context('when provider proxy lacks description', () => {
          const item = {
            ...fixtures.items.template,
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
            const itemResponse = response.item(item);

            assert(!Object.keys(itemResponse).includes('description'));
          });
        });
      });
    });

    describe('author_name', () => {
      it('should be edm:dataProvider from the aggregation', () => {
        const item = {
          ...fixtures.items.template,
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

        const authorName = response.item(item)['author_name'];

        assert.equal(authorName, expected);
      });
    });

    describe('author_url', () => {
      context('when aggregation has edm:isShownAt', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownAt: 'https://www.example.org/123/abc',
              webResources: []
            }
          ]
        };

        it('should be edm:isShownAt from aggregation', () => {
          const expected = 'https://www.example.org/123/abc';

          const authorUrl = response.item(item)['author_url'];

          assert.equal(authorUrl, expected);
        });
      });

      context('when aggregation lacks edm:isShownAt', () => {
        const item = { ...fixtures.items.template };

        it('should be omitted', () => {
          const itemResponse = response.item(item);

          assert(!Object.keys(itemResponse).includes('description'));
        });
      });
    });

    describe('provider_name', () => {
      it('should be "Europeana"', () => {
        const item = { ...fixtures.items.template };
        const expected = 'Europeana';

        const providerName = response.item(item)['provider_name'];

        assert.equal(providerName, expected);
      });
    });

    describe('provider_url', () => {
      it('should be a Europeana website item page URL', () => {
        const item = { ...fixtures.items.template, about: '/123/abc' };
        const expected = 'https://www.europeana.eu/item/123/abc';

        const providerUrl = response.item(item)['provider_url'];

        assert.equal(providerUrl, expected);
      });
    });

    describe('rights_url', () => {
      context('when edm:isShownBy is present', () => {
        context('and edm:isShownBy has edm:rights', () => {
          const item = {
            ...fixtures.items.template,
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

            const rightsUrl = response.item(item)['rights_url'];

            assert.equal(rightsUrl, expected);
          });
        });

        context('and edm:isShownBy lacks edm:rights', () => {
          const item = {
            ...fixtures.items.template,
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

            const rightsUrl = response.item(item)['rights_url'];

            assert.equal(rightsUrl, expected);
          });
        });
      });

      context('when edm:isShownBy is absent', () => {
        const item = {
          ...fixtures.items.template,
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

          const rightsUrl = response.item(item)['rights_url'];

          assert.equal(rightsUrl, expected);
        });
      });
    });

    describe('thumbnail_url', () => {
      context('when edm:object is absent', () => {
        const item = { ...fixtures.items.template };

        it('should be omitted', () => {
          const itemResponse = response.item(item);

          assert(!Object.keys(itemResponse).includes('thumbnail_url'));
        });
      });

      context('when edm:object is present', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmObject: 'https://example.org/image.jpeg',
              webResources: []
            }
          ]
        };

        it('should be Europeana Thumbnail API URL', () => {
          const expected = 'https://api.europeana.eu/thumbnail/v2/url.json?uri=https%3A%2F%2Fexample.org%2Fimage.jpeg';

          const thumbnailUrl = response.item(item)['thumbnail_url'];

          assert(thumbnailUrl.includes(expected));
        });

        describe('size', () => {
          context('when maxWidth is present in options', () => {
            context('and maxWidth <= 200', () => {
              const options = { maxWidth: 150 };

              it('should be "w200"', () => {
                const expected = 'size=w200';

                const thumbnailUrl = response.item(item, options)['thumbnail_url'];

                assert(thumbnailUrl.includes(expected));
              });
            });

            context('and maxWidth > 200', () => {
              const options = { maxWidth: 500 };

              it('should be "w400"', () => {
                const expected = 'size=w400';

                const thumbnailUrl = response.item(item, options)['thumbnail_url'];

                assert(thumbnailUrl.includes(expected));
              });
            });
          });

          context('when maxWidth is absent from options', () => {
            const options = { maxWidth: undefined };

            it('should be "w200"', () => {
              const expected = 'size=w200';

              const thumbnailUrl = response.item(item, options)['thumbnail_url'];

              assert(thumbnailUrl.includes(expected));
            });
          });
        });
      });
    });

    describe('thumbnail_width', () => {
      context('when edm:object is absent', () => {
        const item = { ...fixtures.items.template };

        it('should be omitted', () => {
          const itemResponse = response.item(item);

          assert(!Object.keys(itemResponse).includes('thumbnail_width'));
        });
      });

      context('when edm:object is present', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmObject: 'https://example.org/image.jpeg',
              webResources: []
            }
          ]
        };

        context('when maxWidth is present in options', () => {
          context('and maxWidth <= 200', () => {
            const options = { maxWidth: 150 };

            it('should be 200', () => {
              const expected = 200;

              const thumbnailWidth = response.item(item, options)['thumbnail_width'];

              assert.equal(thumbnailWidth, expected);
            });
          });

          context('and maxWidth > 200', () => {
            const options = { maxWidth: 500 };

            it('should be 400', () => {
              const expected = 400;

              const thumbnailWidth = response.item(item, options)['thumbnail_width'];

              assert.equal(thumbnailWidth, expected);
            });
          });
        });

        context('when maxWidth is absent from options', () => {
          const options = { maxWidth: undefined };

          it('should be 200', () => {
            const expected = 200;

            const thumbnailWidth = response.item(item, options)['thumbnail_width'];

            assert.equal(thumbnailWidth, expected);
          });
        });
      });
    });
  });
});
