const assert = require('assert');
const fixtures = require('./support/fixtures');
const { whenEmbeddingIsPermitted, whenEmbeddingIsProhibited } = require('./support/contexts');

const response = require('../src/response');

describe('response', () => {
  describe('.item()', () => {
    describe('version', () => {
      it('should be "1.0"', () => {
        const item = { ...fixtures.items.template };
        const expected = '1.0';

        const version = response.item(item).version;

        assert.equal(version, expected);
      });
    });

    describe('type', () => {
      whenEmbeddingIsPermitted((rightsStatement, mediaType) => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownBy: '',
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                { about: '',
                  ebucoreHasMimeType: mediaType }
              ]
            }
          ]
        };

        it('should be "rich"', () => {
          const expected = 'rich';

          const type = response.item(item).type;

          assert.equal(type, expected);
        });
      });

      whenEmbeddingIsProhibited((rightsStatement, mediaType) => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownBy: '',
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                { about: '',
                  ebucoreHasMimeType: mediaType }
              ]
            }
          ]
        };

        it('should be "link"', () => {
          const expected = 'link';

          const type = response.item(item).type;

          assert.equal(type, expected);
        });
      });
    });

    describe('html', () => {
      describe('width', () => {
        whenEmbeddingIsPermitted((rightsStatement, mediaType) => {
          const item = {
            ...fixtures.items.template,
            about: '/123/abc',
            aggregations: [
              {
                edmIsShownBy: '',
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: [
                  { about: '',
                    ebucoreHasMimeType: mediaType }
                ]
              }
            ]
          };

          it('should be an iframe with Europeana Media service as its source', () => {
            const expected = /<iframe src="https:\/\/embed\.europeana\.eu\/123\/abc"[^>]+><\/iframe>/;

            const html = response.item(item).html;

            assert(expected.test(html));
          });
        });

        whenEmbeddingIsProhibited((rightsStatement, mediaType) => {
          const item = {
            ...fixtures.items.template,
            about: '/123/abc',
            aggregations: [
              {
                edmIsShownBy: '',
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: [
                  { about: '',
                    ebucoreHasMimeType: mediaType }
                ]
              }
            ]
          };

          it('should be omitted', () => {
            const itemResponse = response.item(item);

            assert(!Object.keys(itemResponse).includes('html'));
          });
        });
      });
    });

    describe('width / height', () => {
      const assertWidthAndHeight = (response, expectedWidth, expectedHeight) => {
        const width = response.width;
        assert.equal(width, expectedWidth);

        const height = response.height;
        assert.equal(height, expectedHeight);
      };

      whenEmbeddingIsPermitted((rightsStatement, mediaType) => {
        context('and edm:isShownBy is present', () => {
          context('with ebucore dimensions', () => {
            const item = {
              ...fixtures.items.template,
              about: '/123/abc',
              aggregations: [
                {
                  edmIsShownBy: 'https://example.org/image.jpeg',
                  edmRights: {
                    def: [rightsStatement]
                  },
                  webResources: [
                    {
                      about: 'https://example.org/image.jpeg',
                      ebucoreWidth: 1200,
                      ebucoreHeight: 900,
                      ebucoreHasMimeType: mediaType
                    }
                  ]
                }
              ]
            };

            it('defaults to ebucore dimensions', () => {
              assertWidthAndHeight(response.item(item), 1200, 900);
            });

            it('scales to fit maxWidth', () => {
              assertWidthAndHeight(response.item(item, { maxWidth: 200, maxHeight: 225 }), 200, 150);
            });

            it('scales to fit maxHeight', () => {
              assertWidthAndHeight(response.item(item, { maxWidth: 400, maxHeight: 100 }), 133, 100);
            });
          });

          context('without ebucore dimensions', () => {
            const item = {
              ...fixtures.items.template,
              about: '/123/abc',
              aggregations: [
                {
                  edmIsShownBy: 'https://example.org/image.jpeg',
                  edmRights: {
                    def: [rightsStatement]
                  },
                  webResources: [
                    {
                      about: 'https://example.org/image.jpeg'
                    }
                  ]
                }
              ]
            };

            it('defaults to 400x225', () => {
              assertWidthAndHeight(response.item(item), 400, 225);
            });

            it('scales to fit maxWidth', () => {
              assertWidthAndHeight(response.item(item, { maxWidth: 200, maxHeight: 225 }), 200, 113);
            });

            it('scales to fit maxHeight', () => {
              assertWidthAndHeight(response.item(item, { maxWidth: 400, maxHeight: 100 }), 178, 100);
            });
          });
        });

        context('but edm:isShownBy is absent', () => {
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

          it('defaults to 400x225', () => {
            assertWidthAndHeight(response.item(item), 400, 225);
          });

          it('scales to fit maxWidth', () => {
            assertWidthAndHeight(response.item(item, { maxWidth: 200, maxHeight: 225 }), 200, 113);
          });

          it('scales to fit maxHeight', () => {
            assertWidthAndHeight(response.item(item, { maxWidth: 400, maxHeight: 100 }), 178, 100);
          });
        });
      });

      whenEmbeddingIsProhibited((rightsStatement, mediaType) => {
        const item = {
          ...fixtures.items.template,
          about: '/123/abc',
          aggregations: [
            {
              edmIsShownBy: 'https://example.org/image.jpeg',
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                {
                  about: 'https://example.org/image.jpeg',
                  ebucoreHasMimeType: mediaType
                }
              ]
            }
          ]
        };

        it('should be omitted', () => {
          const itemResponse = response.item(item);

          assert(!Object.keys(itemResponse).includes('width'));
        });
      });
    });

    describe('title', () => {
      context('when language option is provided', () => {
        const item = {
          ...fixtures.items.template,
          proxies: [
            {
              europeanaProxy: true
            },
            {
              europeanaProxy: false,
              dcTitle: {
                en: ['Title in English'],
                nl: ['Title in Dutch']
              }
            }
          ]
        };

        context('and title is available in that language', () => {
          const options = { language: 'nl' };

          it('should use title in that language', () => {
            const expected = 'Title in Dutch';

            const title = response.item(item, options).title;

            assert.equal(title, expected);
          });
        });

        context('but title is unavailable in that language', () => {
          const options = { language: 'de' };

          it('should use the first title', () => {
            const expected = 'Title in English';

            const title = response.item(item, options).title;

            assert.equal(title, expected);
          });
        });
      });

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
      const item = { ...fixtures.items.template, about: '/123/abc' };

      it('should be a Europeana website item page URL', () => {
        const expected = 'https://www.europeana.eu/item/123/abc';

        const providerUrl = response.item(item)['provider_url'];

        assert.equal(providerUrl, expected);
      });

      context('when language option is provided', () => {
        const options = { language: 'fr' };

        it('includes locale in URL', () => {
          const expected = 'https://www.europeana.eu/fr/item/123/abc';

          const providerUrl = response.item(item, options)['provider_url'];

          assert.equal(providerUrl, expected);
        });
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
