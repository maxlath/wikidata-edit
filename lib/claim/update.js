const { isGuid, getEntityIdFromGuid } = require('wikibase-sdk')
const getEntityClaims = require('./get_entity_claims')
const error_ = require('../error')
const findSnak = require('./find_snak')
const { findClaimByGuid, isGuidClaim, simplifyClaimForEdit } = require('./helpers')

module.exports = async (params, config, API) => {
  let { id, guid, property } = params
  const { oldValue, newValue, rank } = params

  if (!(rank != null || newValue != null)) {
    throw error_.new('expected a rank or a newValue', 400, params)
  }

  if (isGuid(guid)) {
    id = getEntityIdFromGuid(guid)
  } else {
    const values = { oldValue, newValue }
    if (oldValue === newValue) {
      throw error_.new("old and new claim values can't be the same", 400, values)
    }
    if (typeof oldValue !== typeof newValue) {
      throw error_.new('old and new claim should have the same type', 400, values)
    }
  }

  const claims = await getEntityClaims(id, config)

  let claim
  if (guid) {
    claim = findClaimByGuid(claims, guid)
    property = claim && claim.mainsnak.property
  } else {
    claim = findSnak(property, claims[property], oldValue)
  }

  if (!claim) {
    throw error_.new('claim not found', 400, params)
  }

  const simplifiedClaim = simplifyClaimForEdit(claim)

  guid = claim.id

  if (rank) simplifiedClaim.rank = rank

  if (newValue) {
    if (newValue.snaktype && newValue.snaktype !== 'value') {
      simplifiedClaim.snaktype = newValue.snaktype
      delete simplifiedClaim.value
    } else {
      simplifiedClaim.value = newValue
    }
  }

  const data = {
    id,
    claims: {
      [property]: simplifiedClaim
    },
    // Using wbeditentity, as the endpoint is more complete, so we need to recover the summary
    summary: params.summary || config.summary || `update ${property} claim`,
    baserevid: params.baserevid || config.baserevid,
  }

  const { entity, success } = await API.entity.edit(data, config)

  const updatedClaim = entity.claims[property].find(isGuidClaim(guid))
  // Mimick claim actions responses
  return { claim: updatedClaim, success }
}
