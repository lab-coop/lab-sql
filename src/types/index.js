// @flow
export type Model = {
  sync: () => {}
}

export type ModelDefinition = {}

export type ModelDefinitionOptions = {
  timestamps?: boolean,
  paranoid?: boolean,
  underscored?: boolean,
  freezeTableName?: boolean,
  tableName?: string,
  version?: boolean
}

export type Connection = {
  define: () => Model
}

