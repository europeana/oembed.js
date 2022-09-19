import ccma from './ccma.js';
import cremCnrs from './crem-cnrs.js';
import europeana from './europeana.js';
import ina from './ina.js';

const find = (url) => {
  const providers = [ccma, cremCnrs, europeana, ina];

  return providers.find((provider) => {
    return provider.schemes.find((scheme) => {
      return (new RegExp(scheme.replace('*', '.+'))).test(url);
    });
  });
};

export default find;
