export default {
  schemes: [
    'http://www.ina.fr/video/*',
    'http://www.ina.fr/*/video/*'
  ],

  id: (url) => (new URL(url)).pathname.match(/\/video\/([^/]+)/)[1],

  src: (id) => `https://player.ina.fr/embed/${id}`,

  response: {
    type: 'video',
    width: 768,
    height: 576,
    'provider_name': 'Ina.fr',
    'provider_url': 'https://www.ina.fr/'
  }
};
