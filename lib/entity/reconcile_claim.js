const error_ = require('../error')
const { simplify } = require('wikibase-sdk')
const { snak: simplifySnak } = simplify
const isEqual = require('lodash.isequal')
const isMatchingSnak = require('../claim/is_matching_snak')
const validateReconciliationObject = require('./validate_reconciliation_object')

module.exports = (reconciliation, existingPropertyClaims) => claim => {
  validateReconciliationObject(reconciliation)
  if (typeof reconciliation !== 'object') throw error_.new('reconciliation should be an object', { reconciliation })
  const { mode, matchingQualifiers, matchingReferences } = reconciliation
  if (!mode) throw error_.new('reconciliation expected a mode', { reconciliation })
  const existingClaim = existingPropertyClaims.find(isMatchingClaim(claim, matchingQualifiers))
  if (!existingClaim) return claim

  if (mode === 'skip') {
    console.warn(`[wikibase-edit] skipping claim: a similar claim already exists\n${JSON.stringify({ claim, existingClaim })}`)
    return existingClaim
  }
  if (mode === 'merge') {
    if (claim.qualifiers != null) {
      existingClaim.qualifiers = existingClaim.qualifiers || {}
      addMissingQualifiers(existingClaim.qualifiers, claim.qualifiers)
    }
    if (claim.references != null) {
      existingClaim.references = existingClaim.references || []
      if (matchingReferences) {
        mergeReferences(existingClaim.references, claim.references, matchingReferences)
      } else {
        const currentRecords = simplify.references(existingClaim.references)
        const newReferenceRecord = claim.references.filter(isNewReferenceRecord(currentRecords))
        existingClaim.references.push(...newReferenceRecord)
      }
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
  const simplifiedRecord = aggregateReferenceSnaks(record.snaks, true)
  return !currentRecords.some(currentRecord => {
    return isEqual(currentRecord, simplifiedRecord)
  })
}

const mergeReferences = (existingRecords, newRecords, matchingReferences) => {
  const newReferences = []
  for (const newRecord of newRecords) {
    const matchingRecord = existingRecords.find(isMatchingReference(newRecord, matchingReferences))
    if (matchingRecord) {
      mergeMatchingReference(matchingRecord, newRecord)
    } else {
      newReferences.push(newRecord)
    }
  }
  existingRecords.push(...newReferences)
}

const mergeMatchingReference = (matchingRecord, newRecord) => {
  for (const property in newRecord.snaks) {
    // Add only snaks from property not already defined on the existing record
    if (!(property in matchingRecord.snaks)) {
      matchingRecord.snaks[property] = newRecord.snaks[property]
    }
  }
}

const isMatchingReference = (newRecord, matchingReferences) => existingRecord => {
  const newReferenceSnaks = aggregateReferenceSnaks(newRecord.snaks)
  const existingReferenceSnaks = existingRecord.snaks
  for (const property of matchingReferences) {
    const newPropertySnaks = newReferenceSnaks[property]
    const existingPropertySnaks = existingReferenceSnaks[property]
    if (newPropertySnaks == null && existingPropertySnaks == null) return false
    if (newPropertySnaks != null && existingPropertySnaks == null) return false
    if (newPropertySnaks == null && existingPropertySnaks != null) return false
    const everyNewSnakHasAnExistingMatch = newPropertySnaks.every(hasAMatchingSnak(existingPropertySnaks))
    if (!everyNewSnakHasAnExistingMatch) return false
  }
  return true
}

const aggregateReferenceSnaks = (snaksArray, simplify) => {
  return snaksArray.reduce((aggregatedSnaks, snak) => {
    const { property } = snak
    aggregatedSnaks[property] = aggregatedSnaks[property] || []
    if (simplify) snak = simplifySnak(snak)
    aggregatedSnaks[property].push(snak)
    return aggregatedSnaks
  }, {})
}

const hasAMatchingSnak = existingPropertySnaks => snak => {
  const matchingSnak = existingPropertySnaks.find(existingSnak => isMatchingSnak(existingSnak, snak))
  return matchingSnak != null
}
