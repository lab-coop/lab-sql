// @flow
export type Model = {
  sync: () => {}
}

export type ModelDefinition = {}

export type Connection = {
  define: () => Model
}

