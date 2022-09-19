import assert from 'assert';
import nock from 'nock';

import fixtures from '../support/fixtures.js';
import { whenEmbeddingIsPermittedAndSupported, whenEmbeddingIsProhibitedOrUnsupported } from '../support/contexts.js';

import provider from '../../src/providers/europeana.js';

describe('providers/europeana', () => {
  before(() => {
    nock.disableNetConnect();
  });
  after(() => {
    nock.enableNetConnect();
  });

  describe('response', () => {
    const europeanaResponse = (item, options = {}) => {
      nock('https://api.europeana.eu')
        .get(`/record${item.about}.json`)
        .query(true)
        .reply(200, { object: item });

      let url;
      if (options.language) {
        url = `https://www.europeana.eu/${options.language}/item${item.about}`;
      } else {
        url = `http://data.europeana.eu${item.about}`;
      }

      return provider.response(url, options);
    };

    describe('type', () => {
      whenEmbeddingIsPermittedAndSupported((rightsStatement, mediaType, webResource) => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownBy: webResource,
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                { about: webResource,
                  ebucoreHasMimeType: mediaType }
              ]
            }
          ]
        };

        it('should be "rich"', async() => {
          const expected = 'rich';

          const response = await europeanaResponse(item);

          assert.equal(response.type, expected);
        });
      });

      whenEmbeddingIsProhibitedOrUnsupported((rightsStatement, mediaType, webResource) => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownBy: webResource,
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                { about: webResource,
                  ebucoreHasMimeType: mediaType }
              ]
            }
          ]
        };

        it('should be "link"', async() => {
          const expected = 'link';

          const response = await europeanaResponse(item);

          assert.equal(response.type, expected);
        });
      });
    });

    describe('html', () => {
      describe('width', () => {
        whenEmbeddingIsPermittedAndSupported((rightsStatement, mediaType, webResource) => {
          const item = {
            ...fixtures.items.template,
            about: '/123/abc',
            aggregations: [
              {
                edmIsShownBy: webResource,
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: [
                  { about: webResource,
                    ebucoreHasMimeType: mediaType }
                ]
              }
            ]
          };

          it('should be an iframe with Europeana Media service as its source', async() => {
            const expected = /<iframe src="https:\/\/embed\.europeana\.eu\/123\/abc"[^>]+><\/iframe>/;

            const response = await europeanaResponse(item);

            assert(expected.test(response.html));
          });
        });

        whenEmbeddingIsProhibitedOrUnsupported((rightsStatement, mediaType, webResource) => {
          const item = {
            ...fixtures.items.template,
            about: '/123/abc',
            aggregations: [
              {
                edmIsShownBy: webResource,
                edmRights: {
                  def: [rightsStatement]
                },
                webResources: [
                  { about: webResource,
                    ebucoreHasMimeType: mediaType }
                ]
              }
            ]
          };

          it('should be null', async() => {
            const response = await europeanaResponse(item);

            assert.equal(response.html, null);
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

      whenEmbeddingIsPermittedAndSupported((rightsStatement, mediaType, webResource) => {
        context('and edm:isShownBy is present', () => {
          context('with ebucore dimensions', () => {
            const item = {
              ...fixtures.items.template,
              about: '/123/abc',
              aggregations: [
                {
                  edmIsShownBy: webResource,
                  edmRights: {
                    def: [rightsStatement]
                  },
                  webResources: [
                    {
                      about: webResource,
                      ebucoreWidth: 1200,
                      ebucoreHeight: 900,
                      ebucoreHasMimeType: mediaType
                    }
                  ]
                }
              ]
            };

            it('defaults to ebucore dimensions', async() => {
              assertWidthAndHeight(await europeanaResponse(item), 1200, 900);
            });

            it('scales to fit maxwidth', async() => {
              assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 200, maxheight: 225 }), 200, 150);
            });

            it('scales to fit maxheight', async() => {
              assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 400, maxheight: 100 }), 133, 100);
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
                      about: 'https://example.org/image.jpeg',
                      ebucoreHasMimeType: mediaType
                    }
                  ]
                }
              ]
            };

            it('defaults to 400x225', async() => {
              assertWidthAndHeight(await europeanaResponse(item), 400, 225);
            });

            it('scales to fit maxwidth', async() => {
              assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 200, maxheight: 225 }), 200, 113);
            });

            it('scales to fit maxheight', async() => {
              assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 400, maxheight: 100 }), 178, 100);
            });
          });
        });

        context('and hasView is present, but edm:isShownBy is absent', () => {
          const item = {
            ...fixtures.items.template,
            about: '/123/abc',
            aggregations: [
              {
                edmRights: {
                  def: [rightsStatement]
                },
                hasView: ['https://example.org/image.jpeg'],
                webResources: [
                  {
                    about: 'https://example.org/image.jpeg',
                    ebucoreHasMimeType: mediaType
                  }
                ]
              }
            ]
          };

          it('defaults to 400x225', async() => {
            assertWidthAndHeight(await europeanaResponse(item), 400, 225);
          });

          it('scales to fit maxwidth', async() => {
            assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 200, maxheight: 225 }), 200, 113);
          });

          it('scales to fit maxheight', async() => {
            assertWidthAndHeight(await europeanaResponse(item, { maxwidth: 400, maxheight: 100 }), 178, 100);
          });
        });
      });

      whenEmbeddingIsProhibitedOrUnsupported((rightsStatement, mediaType, webResource) => {
        const item = {
          ...fixtures.items.template,
          about: '/123/abc',
          aggregations: [
            {
              edmIsShownBy: webResource,
              edmRights: {
                def: [rightsStatement]
              },
              webResources: [
                {
                  about: webResource,
                  ebucoreHasMimeType: mediaType
                }
              ]
            }
          ]
        };

        it('should be null', async() => {
          const response = await europeanaResponse(item);

          assert.equal(response.width, null);
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

          it('should use title in that language', async() => {
            const expected = 'Title in Dutch';

            const response = await europeanaResponse(item, options);

            assert.equal(response.title, expected);
          });
        });

        context('but title is unavailable in that language', () => {
          const options = { language: 'de' };

          it('should use the first title', async() => {
            const expected = 'Title in English';

            const response = await europeanaResponse(item, options);

            assert.equal(response.title, expected);
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

        it('should be title from Europeana proxy', async() => {
          const expected = 'Europeana proxy title';

          const response = await europeanaResponse(item);

          assert.equal(response.title, expected);
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

          it('should be title from provider proxy', async() => {
            const expected = 'Provider proxy title';

            const response = await europeanaResponse(item);

            assert.equal(response.title, expected);
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

          it('should be null', async() => {
            const response = await europeanaResponse(item);

            assert.equal(response.title, null);
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

        it('should be description from Europeana proxy', async() => {
          const expected = 'Europeana proxy description';

          const response = await europeanaResponse(item);

          assert.equal(response.description, expected);
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

          it('should be description from provider proxy', async() => {
            const expected = 'Provider proxy description';

            const response = await europeanaResponse(item);

            assert.equal(response.description, expected);
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

          it('should be null', async() => {
            const response = await europeanaResponse(item);

            assert.equal(response.description, null);
          });
        });
      });
    });

    describe('author_name', () => {
      it('should be edm:dataProvider from the aggregation', async() => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmDataProvider: {
                def: ['Data Provider']
              },
              edmIsShownBy: 'https://example.org/image.jpeg',
              webResources: [
                { about: 'https://example.org/image.jpeg',
                  ebucoreHasMimeType: '' }
              ]
            }
          ]
        };
        const expected = 'Data Provider';

        const response = await europeanaResponse(item);

        assert.equal(response['author_name'], expected);
      });
    });

    describe('author_url', () => {
      context('when aggregation has edm:isShownAt', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmIsShownAt: 'https://www.example.org/123/abc',
              edmIsShownBy: 'https://example.org/image.jpeg',
              webResources: [
                { about: 'https://example.org/image.jpeg',
                  ebucoreHasMimeType: '' }
              ]
            }
          ]
        };

        it('should be edm:isShownAt from aggregation', async() => {
          const expected = 'https://www.example.org/123/abc';

          const response = await europeanaResponse(item);

          assert.equal(response['author_url'], expected);
        });
      });

      context('when aggregation lacks edm:isShownAt', () => {
        const item = { ...fixtures.items.template };

        it('should be null', async() => {
          const response = await europeanaResponse(item);

          assert.equal(response.description, null);
        });
      });
    });

    describe('provider_name', () => {
      it('should be "Europeana"', async() => {
        const item = { ...fixtures.items.template };
        const expected = 'Europeana';

        const response = await europeanaResponse(item);

        assert.equal(response['provider_name'], expected);
      });
    });

    describe('provider_url', () => {
      const item = { ...fixtures.items.template, about: '/123/abc' };

      it('should be a Europeana website item page URL', async() => {
        const expected = 'https://www.europeana.eu/item/123/abc';

        const response = await europeanaResponse(item);

        assert.equal(response['provider_url'], expected);
      });

      context('when language option is provided', () => {
        const options = { language: 'fr' };

        it('includes locale in URL', async() => {
          const expected = 'https://www.europeana.eu/fr/item/123/abc';

          const response = await europeanaResponse(item, options);

          assert.equal(response['provider_url'], expected);
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

          it('should be edm:rights of edm:isShownBy', async() => {
            const expected = 'http://rightsstatements.org/vocab/CNE/1.0/';

            const response = await europeanaResponse(item);

            assert.equal(response['rights_url'], expected);
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

          it('should be edm:rights of aggregation', async() => {
            const expected = 'http://creativecommons.org/licenses/by-sa/4.0/';

            const response = await europeanaResponse(item);

            assert.equal(response['rights_url'], expected);
          });
        });
      });

      context('when hasView is present, but edm:isShownBy is absent', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {

              edmRights: {
                def: ['http://creativecommons.org/licenses/by-sa/4.0/']
              },
              hasView: ['https://example.org/image.jpeg'],
              webResources: [
                {
                  about: 'https://example.org/image.jpeg'
                }
              ]
            }
          ]
        };

        it('should be edm:rights of aggregation', async() => {
          const expected = 'http://creativecommons.org/licenses/by-sa/4.0/';

          const response = await europeanaResponse(item);

          assert.equal(response['rights_url'], expected);
        });
      });
    });

    describe('thumbnail_url', () => {
      context('when edm:object is absent', () => {
        const item = { ...fixtures.items.template };

        it('is null', async() => {
          const response = await europeanaResponse(item);

          assert.equal(response['thumbnail_url'], null);
        });
      });

      context('when edm:object is present', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmObject: 'https://example.org/image.jpeg',
              edmIsShownBy: 'https://example.org/image.jpeg',
              webResources: [
                { about: 'https://example.org/image.jpeg',
                  ebucoreHasMimeType: '' }
              ]
            }
          ]
        };

        it('should be Europeana Thumbnail API URL', async() => {
          const expected = 'https://api.europeana.eu/thumbnail/v2/url.json?uri=https%3A%2F%2Fexample.org%2Fimage.jpeg';

          const response = await europeanaResponse(item);

          assert(response['thumbnail_url'].includes(expected));
        });

        describe('size', () => {
          context('when maxwidth is present in options', () => {
            context('and maxwidth <= 200', () => {
              const options = { maxwidth: 150 };

              it('should be "w200"', async() => {
                const expected = 'size=w200';

                const response = await europeanaResponse(item, options);

                assert(response['thumbnail_url'].includes(expected));
              });
            });

            context('and maxwidth > 200', () => {
              const options = { maxwidth: 500 };

              it('should be "w400"', async() => {
                const expected = 'size=w400';

                const response = await europeanaResponse(item, options);

                assert(response['thumbnail_url'].includes(expected));
              });
            });
          });

          context('when maxwidth is absent from options', () => {
            const options = { maxwidth: undefined };

            it('should be "w200"', async() => {
              const expected = 'size=w200';

              const response = await europeanaResponse(item, options);

              assert(response['thumbnail_url'].includes(expected));
            });
          });
        });
      });
    });

    describe('thumbnail_width', () => {
      context('when edm:object is absent', () => {
        const item = { ...fixtures.items.template };

        it('should be null', async() => {
          const response = await europeanaResponse(item);

          assert.equal(response['thumbnail_width'], null);
        });
      });

      context('when edm:object is present', () => {
        const item = {
          ...fixtures.items.template,
          aggregations: [
            {
              edmObject: 'https://example.org/image.jpeg',
              edmIsShownBy: 'https://example.org/image.jpeg',
              webResources: [
                { about: 'https://example.org/image.jpeg',
                  ebucoreHasMimeType: '' }
              ]
            }
          ]
        };

        context('when maxwidth is present in options', () => {
          context('and maxwidth <= 200', () => {
            const options = { maxwidth: 150 };

            it('should be 200', async() => {
              const expected = 200;

              const response = await europeanaResponse(item, options);

              assert.equal(response['thumbnail_width'], expected);
            });
          });

          context('and maxwidth > 200', () => {
            const options = { maxwidth: 500 };

            it('should be 400', async() => {
              const expected = 400;

              const response = await europeanaResponse(item, options);

              assert.equal(response['thumbnail_width'], expected);
            });
          });
        });

        context('when maxwidth is absent from options', () => {
          const options = { maxwidth: undefined };

          it('should be 200', async() => {
            const expected = 200;

            const response = await europeanaResponse(item, options);

            assert.equal(response['thumbnail_width'], expected);
          });
        });
      });
    });
  });
});
