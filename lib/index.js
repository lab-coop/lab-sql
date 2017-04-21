const Sequelize = require('sequelize');
const state = require('statecontainer')();
const once = require('lodash.once');

const modelDefinitions = state.store('db:modelDefinitions');
const modelRelationRegisters = state.store('db:modelRelationRegisters', []);
const connections = state.store('db:connections');
const models = state.store('db:models');

module.exports = function (config, logger) {

  const wireTogether = once(runAllRegisterRelationsCallback);

  return {
    registerModel,
    getModel,
    wireTogether
  };

  function runAllRegisterRelationsCallback() {
    return Promise.all(modelRelationRegisters.get().map(runRegisterRelationsCallback));
  }

  function runRegisterRelationsCallback(registerRelations) {
    return registerRelations(getModelOnly);
  }

  async function registerModel(modelName, modelDefinition, registerRelationsCallback) {
    await modelRelationRegisters.push(registerRelationsCallback);
    const connection = await getConnection(getConnString(), {});
    const model = await connection.define(modelName, modelDefinition);
    await model.sync();
    const modelKey = getModelKey(modelName);
    await models.set(modelKey, model);
    return model;
  }

  async function getModel(modelName) {
    await wireTogether();
    return getModelOnly(modelName);
  }

  function getModelOnly(modelName) {
    const modelKey = getModelKey(modelName);
    return models.get(modelKey);
  }

  function getConnString() {
    return config.get('sql.connString');
  }

  function getConnStringKey() {
    return new Buffer(getConnString()).toString('base64');
  }

  function getModelKey(modelName) {
    return `${getConnStringKey()}:${modelName}`;
  }

  function getConnection(connString, { nocache = false }) {
    const connKey = getConnStringKey();
    return connections.cachedResult(connKey, getConnectFunction(connString), { nocache, wait: false });
  }

  function getConnectFunction(connString) {
    return () => {
      logger.debug(`Connecting to SQL database at: ${connString}`);
      return new Sequelize(connString);
    };
  }
};