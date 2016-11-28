const sw = require('swagger-parser');
// const YAML     = require('yamljs');
const fs = require('fs');
const _  = require('lodash');
// const chokidar = require('chokidar');

const parser = new sw();

const conf = require('./config.json');

separator();
parseSwaggerSpec();

function separator() {
  console.log(new Array(100).join("="));
}

function parseSwaggerSpec() {
  parser.validate(conf.swaggerFileSource)
    .then(function (resolve) {
      console.log('Deferencing');
      return parser.dereference(conf.swaggerFileSource);
    })
    .then(function (api) {
      getApiConfig(api);

      let paths = api.paths;
      normalizeKeys(paths);
      reorganize(paths);

      separator();
      console.log('Escribiendo archivo apiConf.json');
      fs.writeFileSync(conf.apiPathgDest, JSON.stringify(paths, null, 2));


    })
    .catch((err) => {
      separator();
      console.log('Ha ocurrido un error');
      separator();
      console.log(err);
      separator();
    });
}

function reorganize(obj) {
  Object.keys(obj).forEach(key => {
    // "stores.order.orderId"
    let keySplit = key.split('.');
    // ['stores', 'order', 'orderId']
    let newObject = {};
    let objectIterator;

  });
}


function normalizeKeys(obj) {
  Object.keys(obj).forEach(key => {
    let newKey  = key
      .slice(1)
      .replace(/\//g, '.')
      // .replace('/', '.')
      .replace('{', '')
      .replace('}', '');
    obj[newKey] = {};
    _.assign(obj[newKey], obj[key]);
    delete obj[key];
  })
}


function getApiConfig(api) {
  let apiConf = {};
  if (api.host) apiConf.host = api.host;
  if (api.basePath) apiConf.basePath = api.basePath;
  separator();
  console.log('Escribiendo archivo apiConf.json');
  fs.writeFileSync(conf.apiConfigDest, JSON.stringify(apiConf, null, 2));
}