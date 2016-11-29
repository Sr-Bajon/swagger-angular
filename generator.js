const sw = require('swagger-parser');
const fs = require('fs');
const _  = require('lodash');

const parser = new sw();

const conf = require('./config.json');

separator();
parseSwaggerSpec();

function parseSwaggerSpec() {
  parser.validate(conf.swaggerFileSource)
    .then(() => {
      console.log('Deferencing');
      return parser.dereference(conf.swaggerFileSource);
    })
    .then(api => {
      getApiConfig(api);

      return api;
    })
    .then(api => {
      getPaths(api.paths);
    })
    .catch(err => {
      separator();
      console.log('Ha ocurrido un error');
      separator();
      throw err;
    });
}

function separator() {
  console.log(new Array(100).join("="));
}

function getPaths(paths) {
  normalizeKeys(paths);
  reorganize(paths);
  purgue(paths, conf.purgeList);

  separator();
  console.log('Escribiendo archivo apiConf.json');
  fs.writeFileSync(conf.apiPathgDest, JSON.stringify(paths, null, 2));
}

function isObj(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

function purgue(obj, purgueList) {
  Object.keys(obj).forEach(key => {
    if (purgueList.indexOf(key) >= 0) {
      delete obj[key];
    } else if (isObj(obj[key])) {
      purgue(obj[key], purgueList);
    }
  });
}

function reorganize(obj) {
  Object.keys(obj).forEach(key => {
    let newObj = {
      objIterator: {}
    };
    let auxObj = newObj.objIterator;
    key.split('.').forEach(keyPartial => {
      if (!auxObj[keyPartial]) auxObj[keyPartial] = {};
      auxObj = auxObj[keyPartial];
    });

    newObj = newObj.objIterator;
    _.assign(auxObj, obj[key]);
    delete obj[key];
    _.merge(obj, newObj);
  });
}

function normalizeKeys(obj) {
  Object.keys(obj).forEach(key => {
    let newKey  = key
      .slice(1)
      .replace(/\//g, '.')
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