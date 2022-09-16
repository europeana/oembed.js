export default {
  schemes: [
    'http://archives.crem-cnrs.fr/archives/items/*/'
  ],

  id: (url) => (new URL(url)).pathname.split('/').slice(-2, -1),

  response: {
    type: 'rich',
    src: (id) => `http://archives.crem-cnrs.fr/archives/items/${id}/player/346x130/`,
    width: 361,
    height: 251,
    providerName: 'CREM-CNRS',
    providerUrl: 'https://archives.crem-cnrs.fr/'
  }
};
