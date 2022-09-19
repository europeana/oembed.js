export default {
  schemes: [
    'http://www.ccma.cat/tv3/alacarta/programa/titol/video/*/'
  ],

  id: (url) => (new URL(url)).pathname.split('/').slice(-2, -1),

  src: (id) => `http://www.ccma.cat/video/embed/${id}/`,

  response: {
    type: 'video',
    width: 500,
    height: 281,
    'provider_name': 'CCMA',
    'provider_url': 'https://www.ccma.cat/'
  }
};
