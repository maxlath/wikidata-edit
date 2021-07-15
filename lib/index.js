const requestWrapper = require('./request_wrapper')
const bundleWrapper = require('./bundle_wrapper')
const GetAuthData = require('./request/get_auth_data')
const validateAndEnrichConfig = require('./validate_and_enrich_config')
const error_ = require('./error')

// Primitives: sync or async functions that return an { action, params } object
//             passed to request.post by requestWrapper
const rawRequestBuilders = {
  label: {
    set: require('./label/set')
  },
  description: {
    set: require('./description/set')
  },
  alias: {
    set: require('./alias/set'),
    add: require('./alias/add'),
    remove: require('./alias/remove')
  },
  claim: {
    set: require('./claim/set'),
    remove: require('./claim/remove')
  },
  qualifier: {
    set: require('./qualifier/set'),
    remove: require('./qualifier/remove')
  },
  reference: {
    set: require('./reference/set'),
    remove: require('./reference/remove')
  },
  entity: {
    create: require('./entity/create'),
    edit: require('./entity/edit'),
    merge: require('./entity/merge'),
    delete: require('./entity/delete')
  }
}

// Bundles: async functions that make use of the primitives to offer more sophisticated behaviors
const bundledRequestsBuilders = {
  claim: {
    create: require('./claim/create'),
    update: require('./claim/update'),
    move: require('./claim/move')
  },
  qualifier: {
    update: require('./qualifier/update'),
    move: require('./qualifier/move')
  }
}

module.exports = (generalConfig = {}) => {
  if (typeof generalConfig !== 'object') {
    throw error_.new('invalid general config object', { generalConfig, type: typeof generalConfig })
  }

  const API = {}

  for (const sectionKey in rawRequestBuilders) {
    API[sectionKey] = {}
    for (const functionName in rawRequestBuilders[sectionKey]) {
      const fn = rawRequestBuilders[sectionKey][functionName]
      API[sectionKey][functionName] = requestWrapper(fn, generalConfig)
    }
  }

  for (const sectionKey in bundledRequestsBuilders) {
    for (const functionName in bundledRequestsBuilders[sectionKey]) {
      const fn = bundledRequestsBuilders[sectionKey][functionName]
      API[sectionKey][functionName] = bundleWrapper(fn, generalConfig, API)
    }
  }

  API.getAuthData = reqConfig => {
    const config = validateAndEnrichConfig(generalConfig, reqConfig)
    return GetAuthData(config)
  }

  // Legacy aliases
  API.claim.add = API.claim.create
  API.qualifier.add = API.qualifier.set
  API.reference.add = API.reference.set

  return API
}
