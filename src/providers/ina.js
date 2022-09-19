export default {
  schemes: [
    'http://www.ina.fr/video/*',
    'http://www.ina.fr/*/video/*'
  ],

  id: (url) => (new URL(url)).pathname.match(/\/video\/([^/]+)/)[1],

  src: (id) => `https://player.ina.fr/player/embed/${id}/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/620/349/0`,

  response: {
    type: 'video',
    width: 620,
    height: 349,
    'provider_name': 'Ina.fr',
    'provider_url': 'https://www.ina.fr/'
  }
};
