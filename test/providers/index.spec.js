import assert from 'assert';

import findProvider from '../../src/providers/index.js';

describe('providers', () => {
  describe('CCMA', () => {
    specify('recognises scheme http://www.ccma.cat/tv3/alacarta/programa/titol/video/*/', () => {
      const provider = findProvider('http://www.ccma.cat/tv3/alacarta/programa/titol/video/955989/');

      assert.equal(provider.response['provider_name'], 'CCMA');
    });
  });

  describe('CREM-CNRS', () => {
    specify('recognises scheme http://archives.crem-cnrs.fr/archives/items/*/', () => {
      const provider = findProvider('http://archives.crem-cnrs.fr/archives/items/9798/');

      assert.equal(provider.response['provider_name'], 'CREM-CNRS');
    });
  });

  // TODO: spec Europeana schemes

  describe('Ina.fr', () => {
    specify('recognises scheme http://www.ina.fr/video/*', () => {
      const provider = findProvider('http://www.ina.fr/video/I07337664/');

      assert.equal(provider.response['provider_name'], 'Ina.fr');
    });

    specify('recognises scheme http://www.ina.fr/*/video/*', () => {
      const provider = findProvider(
        'http://www.ina.fr/politique/elections-et-scrutins/video/CAB92011596/liste-daniel-hechter.fr.html#xtor=AL-3'
      );

      assert.equal(provider.response['provider_name'], 'Ina.fr');
    });
  });
});
