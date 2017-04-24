// @flow
const Sequelize = require('sequelize');
const state = require('statecontainer')();
const once = require('lodash.once');

const modelDefinitions = state.store('db:modelDefinitions');
const modelRelationRegisters = state.store('db:modelRelationRegisters', []);
const connections = state.store('db:connections');
const models = state.store('db:models');

import type { ModelDefinition, ModelDefinitionOptions, Model, Connection } from './types';

module.exports = function(config: { get: (key: string) => any }, logger: { debug: (message: string) => void }) {

  const wireTogether = once(runAllRegisterRelationsCallback);

  return {
    registerModel,
    getModel,
    wireTogether
  };

  function runAllRegisterRelationsCallback(): Promise<void> {
    return Promise.all(modelRelationRegisters.get()
      .map(runRegisterRelationsCallback));
  }

  function runRegisterRelationsCallback(registerRelations: () => Promise<void>) {
    return registerRelations(getModelOnly);
  }

  async function registerModel(
    modelName: string,
    modelDefinition: ModelDefinition,
    modelDefinitionOptions: ModelDefinitionOptions = {},
    registerRelationsCallback: () => Promise<void>)
  {
    await modelRelationRegisters.push(registerRelationsCallback);
    const connection = await getConnection(getConnString(), {});
    const model = await connection.define(modelName, modelDefinition, modelDefinitionOptions);
    await model.sync();
    const modelKey = getModelKey(modelName);
    await models.set(modelKey, model);
    return model;
  }

  async function getModel(modelName: string): Promise<Model> {
    await wireTogether();
    return getModelOnly(modelName);
  }

  function getModelOnly(modelName: string): Model {
    const modelKey = getModelKey(modelName);
    return models.get(modelKey);
  }

  function getConnString(): string {
    return config.get('sql.connString');
  }

  function getConnStringKey(): string {
    return new Buffer(getConnString()).toString('base64');
  }

  function getModelKey(modelName: string): string {
    return `${getConnStringKey()}:${modelName}`;
  }

  function getConnection(connString: string, {nocache=false}): Promise<Connection> {
    const connKey = getConnStringKey();
    return connections.cachedResult(connKey, getConnectFunction(connString), {nocache, wait: false});
  }

  function getConnectFunction(connString: string): () => () => {} {
    return () => {
      logger.debug(`Connecting to SQL database at: ${connString}`);
      return new Sequelize(connString);
    }
  }
};

