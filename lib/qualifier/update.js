const validate = require('../validate')
const getEntityClaims = require('../claim/get_entity_claims')
const _ = require('../utils')
const error_ = require('../error')
const findSnak = require('../claim/find_snak')
const { getEntityIdFromGuid } = require('wikibase-sdk')

module.exports = async (params, config, API) => {
  const { guid, property, oldValue, newValue } = params

  validate.guid(guid)
  validate.property(property)
  const datatype = config.properties[property]
  validate.snakValue(property, datatype, oldValue)
  validate.snakValue(property, datatype, newValue)

  if (oldValue === newValue) {
    throw error_.new('same value', 400, oldValue, newValue)
  }

  // Get current value snak hash
  const hash = await getSnakHash(guid, property, oldValue, config)
  return API.qualifier.set({
    guid,
    hash,
    property,
    value: newValue,
    summary: params.summary || config.summary,
    baserevid: params.baserevid || config.baserevid,
  }, config)
}

const getSnakHash = async (guid, property, oldValue, config) => {
  const entityId = getEntityIdFromGuid(guid)
  const claims = await getEntityClaims(entityId, config)
  const claim = findClaim(claims, guid)

  if (!claim) throw error_.new('claim not found', 400, guid)
  if (!claim.qualifiers) throw error_.new('claim qualifiers not found', 400, guid)

  const propSnaks = claim.qualifiers[property]

  const qualifier = findSnak(property, propSnaks, oldValue)

  if (!qualifier) {
    const actualValues = propSnaks ? propSnaks.map(getSnakValue) : null
    throw error_.new('qualifier not found', 400, { guid, property, expectedValue: oldValue, actualValues })
  }
  return qualifier.hash
}

const findClaim = (claims, guid) => {
  claims = _.flatten(_.values(claims))
  for (const claim of claims) {
    if (claim.id === guid) return claim
  }
}

const getSnakValue = snak => snak.datavalue && snak.datavalue.value
