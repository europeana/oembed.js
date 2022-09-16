export default {
  items: {
    template: {
      aggregations: [{ edmIsShownBy: 'https://example.org/image.jpeg',
        webResources: [
          { about: 'https://example.org/image.jpeg',
            ebucoreHasMimeType: '' }
        ] }],
      proxies: [{ europeanaProxy: true }, { europeanaProxy: false }]
    },
    milkmaid: {
      identifier: '/90402/SK_A_2344',
      urls: [
        'http://data.europeana.eu/item/90402/SK_A_2344',
        'https://www.europeana.eu/item/90402/SK_A_2344',
        'https://europeana.eu/item/90402/SK_A_2344',
        'http://www.europeana.eu/item/90402/SK_A_2344',
        'http://www.europeana.eu/de/item/90402/SK_A_2344'
      ]
    }
  },
  rightsStatements: {
    rich: [
      'http://creativecommons.org/licenses/by-sa/4.0/',
      'http://creativecommons.org/licenses/by/4.0/',
      'http://creativecommons.org/publicdomain/mark/1.0/',
      'http://creativecommons.org/publicdomain/zero/1.0/'
    ],
    link: [
      'http://creativecommons.org/licenses/by-nc-nd/4.0/',
      'http://creativecommons.org/licenses/by-nc-sa/4.0/',
      'http://creativecommons.org/licenses/by-nd/4.0/',
      'http://rightsstatements.org/vocab/CNE/1.0/',
      'http://rightsstatements.org/vocab/InC-EDU/1.0/',
      'http://rightsstatements.org/vocab/InC/1.0/',
      'http://rightsstatements.org/vocab/NoC-NC/1.0/',
      'http://rightsstatements.org/vocab/NoC-OKLR/1.0/'
    ]
  },
  mediaTypes: {
    supported: [
      'image/jpeg',
      'audio/flac',
      'video/mp4',
      'application/dash+xml'
    ],
    unsupported: [
      'text'
    ]
  },
  webResource: 'https://example.org/image.jpeg'
};
