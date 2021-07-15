const error_ = require('./error')
const _ = require('./utils')
const fetchUsedPropertiesDatatypes = require('./properties/fetch_used_properties_datatypes')
const resolveTitle = require('./resolve_title')
const validateAndEnrichConfig = require('./validate_and_enrich_config')
const validateParameters = require('./validate_parameters')
const post = require('./request/post')
const initializeConfigAuth = require('./request/initialize_config_auth')

module.exports = (fn, generalConfig) => async (params, reqConfig) => {
  const config = validateAndEnrichConfig(generalConfig, reqConfig)
  validateParameters(params)
  initializeConfigAuth(config)

  await fetchUsedPropertiesDatatypes(params, config)

  if (!config.properties) throw error_.new('properties not found', config)

  const { action, data } = await fn(params, config.properties, config.instance, config)

  const summary = params.summary || config.summary
  const baserevid = params.baserevid || config.baserevid

  if (_.isNonEmptyString(summary)) data.summary = summary
  if (baserevid != null) data.baserevid = baserevid

  if (!data.title) return post(action, data, config)

  const title = await resolveTitle(data.title, config.instanceApiEndpoint)
  data.title = title
  return post(action, data, config)
}
