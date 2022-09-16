export default {
  schemes: [
    'https://www.europeana.eu/*/item/*',
    'http://www.europeana.eu/*/item/*',
    'https://europeana.eu/*/item/*',
    'http://europeana.eu/*/item/*',
    'https://www.europeana.eu/item/*',
    'http://www.europeana.eu/item/*',
    'https://europeana.eu/item/*',
    'http://europeana.eu/item/*',
    'http://data.europeana.eu/item/*'
  ],

  id: (url) => (new URL(url)).pathname.split('/').slice(-2),

  response: {
    type: 'rich',
    src: (id) => `https://www.europeana.eu/item${id}`,
    width: 620,
    height: 349,
    providerName: 'Europeana Foundation',
    providerUrl: 'https://www.europeana.eu/'
  }
};
