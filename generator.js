const sw = require('swagger-parser');
const fs = require('fs');
const _  = require('lodash');

const parser = new sw();

const conf = require('./config.json');

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
      getPaths(api);
    })
    .catch(err => {
      console.log('Ha ocurrido un error');
      throw err;
    });
}

function getPaths(api) {
  setUrl(api.paths);
  setMethod(api.paths);
  setConsumes(api);
  mergeParameters(api.paths);
  normalizeKeys(api.paths);
  reorganize(api.paths);
  purgue(api.paths, conf.purgeList);

  console.log('Escribiendo archivo apiPath.json');
  fs.writeFileSync(conf.apiPathgDest, JSON.stringify(api.paths, null, 2));
}

function isObj(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

/**
 * Elimina los datos innecesarios de la especificacion swagger
 * @param obj
 * @param purgueList
 */
function purgue(obj, purgueList) {
  Object.keys(obj).forEach(key => {
    if (purgueList.indexOf(key) >= 0) {
      delete obj[key];
    } else if (isObj(obj[key])) {
      purgue(obj[key], purgueList);
    }
  });
}

/**
 * Convierte todos los paths en objetos de forma que se pueda acceder a ellos con dot notation
 * @param obj
 */
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

/**
 * Si hay parametros generales en el path se incluyen en cada metodo respetando los especificos del metodo
 * @param obj
 */
function mergeParameters(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key].parameters) {
      // si el path tiene parametros generales lo mergeo con cada metodo
      Object.keys(obj[key]).forEach(method => {
        if (method !== 'parameters') {
          if (!obj[key][method].parameters) {
            // si el method no tiene parametros y hay un general lo copio tal cual
            obj[key][method].parameters = obj[key].parameters.slice();
          } else {
            // hay un parameters general y uno en el method, copio los parametros generales que no tenga y mantengo
            // los especificos duplicados
            obj[key].parameters.forEach(generalParam => {
              let encontrado = false;
              obj[key][method].parameters.forEach(methodParam => {
                if (methodParam.name === generalParam.name) encontrado = true;
              });
              if (!encontrado) obj[key][method].parameters.push(generalParam);
            });
          }
          // por ultimo borro parameters del path pues ya no lo necesito
          delete obj[key].parameters;
        }
      });
    }
  });
}

/**
 * Crea una clave url con la url a la que hay que llamar en cada metodo
 * @param obj
 */
function setUrl(obj) {
  let urls = Object.keys(obj);
  Object.keys(obj).forEach((key, index) => {
    Object.keys(obj[key]).forEach(method => {
      obj[key][method].url = urls[index].replace(/\/{.*}$/, '');
    });
  });
}

/**
 * Crea una clave method para saber cual es el metodo del endpoint en cada metodo
 * @param obj
 */
function setMethod(obj) {
  Object.keys(obj).forEach((key) => {
    Object.keys(obj[key]).forEach(method => {
      obj[key][method].method = method.toUpperCase();
    });
  });
}

/**
 * Si hay un consumes general lo incluye en cada metodo a no ser que el metodo ya tenga un consumes propio
 * @param obj
 */
function setConsumes(obj) {
  debugger;
  if (obj.consumes) {
    Object.keys(obj.paths).forEach((path) => {
      Object.keys(obj.paths[path]).forEach((method) => {
        if (!obj.paths[path][method].consumes) obj.paths[path][method].consumes = obj.consumes.slice();
      });

    });
  }
}

/**
 * cambia la clave de los paths de /ruta/subruta/{rutaId} a ruta.subruta.rutaId
 * @param obj
 */
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

/**
 * Obtiene determinados valores generales de la especificacion swagger
 * @param api
 */
function getApiConfig(api) {
  let apiConf = {};
  if (api.host) apiConf.host = api.host;
  if (api.basePath) apiConf.basePath = api.basePath;
  console.log('Escribiendo archivo apiConf.json');
  fs.writeFileSync(conf.apiConfigDest, JSON.stringify(apiConf, null, 2));
}