const error_ = require('../error')
const { simplify } = require('wikibase-sdk')
const isEqual = require('lodash.isequal')
const isMatchingSnak = require('../claim/is_matching_snak')

module.exports = (reconciliation, existingPropertyClaims) => claim => {
  if (typeof reconciliation !== 'object') throw error_.new('reconciliation should be an object', { reconciliation })
  const { mode, matchingQualifiers } = reconciliation
  if (!mode) throw error_.new('reconciliation expected a mode', { reconciliation })
  const existingClaim = existingPropertyClaims.find(isMatchingClaim(claim, matchingQualifiers))
  if (!existingClaim) return claim

  if (mode === 'skip') return existingClaim
  if (mode === 'merge') {
    if (claim.qualifiers != null) {
      existingClaim.qualifiers = existingClaim.qualifiers || {}
      addMissingQualifiers(existingClaim.qualifiers, claim.qualifiers)
    }
    if (claim.references != null) {
      existingClaim.references = existingClaim.references || []
      const currentRecords = simplify.references(existingClaim.references)
      const newReferenceRecord = claim.references.filter(isNewReferenceRecord(currentRecords))
      existingClaim.references.push(...newReferenceRecord)
    }
  }
  return existingClaim
}

const isMatchingClaim = (claim, matchingQualifiers) => ({ mainsnak, qualifiers = {} }) => {
  if (!isMatchingSnak(mainsnak, claim.mainsnak)) return false
  if (matchingQualifiers) {
    for (const property of matchingQualifiers) {
      if (claim.qualifiers[property] != null && qualifiers[property] == null) return false
      if (claim.qualifiers[property] == null && qualifiers[property] != null) return false
      for (const qualifier of claim.qualifiers[property]) {
        for (const existingQualifier of qualifiers[property]) {
          if (!isMatchingSnak(existingQualifier, qualifier)) return false
        }
      }
    }
  }
  return true
}

const addMissingQualifiers = (existingQualifiers, newQualifiers) => {
  for (const property in newQualifiers) {
    existingQualifiers[property] = existingQualifiers[property] || []
    existingQualifiers[property].push(...newQualifiers[property])
  }
}

const isNewReferenceRecord = currentRecords => record => {
  const simplifiedRecord = simplifyRecord(record)
  return !currentRecords.some(currentRecord => {
    return isEqual(currentRecord, simplifiedRecord)
  })
}

const simplifyRecord = record => {
  return record.snaks.reduce((aggregatedSnaks, snak) => {
    aggregatedSnaks[snak.property] = aggregatedSnaks[snak.property] || []
    aggregatedSnaks[snak.property].push(simplify.snak(snak))
    return aggregatedSnaks
  }, {})
}
