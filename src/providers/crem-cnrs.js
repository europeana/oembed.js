export default {
  schemes: [
    'http://archives.crem-cnrs.fr/archives/items/*/'
  ],

  id: (url) => (new URL(url)).pathname.split('/').slice(-2, -1),

  src: (id) => `https://archives.crem-cnrs.fr/archives/items/${id}/player/346x130/`,

  response: {
    type: 'rich',
    width: 361,
    height: 250,
    'provider_name': 'CREM-CNRS',
    'provider_url': 'https://archives.crem-cnrs.fr/'
  }
};
