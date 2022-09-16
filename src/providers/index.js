import ccma from './ccma.js';
import cremCnrs from './crem-cnrs.js';
import ina from './ina.js';

const providers = [ccma, cremCnrs, ina];

const find = (url) => {
  return providers.find((provider) => {
    return provider.schemes.find((scheme) => {
      return (new RegExp(scheme.replace('*', '.+'))).test(url);
    });
  });
};

export default find;
