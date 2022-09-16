export default {
  schemes: [
    'http://www.ina.fr/video/*',
    'http://www.ina.fr/*/video/*'
  ],

  id: (url) => (new URL(url)).pathname.match(/\/video\/([^\/]+)/)[1],

  response: {
    type: 'video',
    src: (id) => `https://player.ina.fr/player/embed/${id}/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/620/349/0`,
    width: 620,
    height: 349,
    providerName: 'Ina.fr',
    providerUrl: 'https://www.ina.fr/'
  }
};
