const error_ = require('../error')
const { simplify } = require('wikibase-sdk')
const { snak: simplifySnak } = simplify
const isEqual = require('lodash.isequal')
const isMatchingSnak = require('../claim/is_matching_snak')
const validateReconciliationObject = require('./validate_reconciliation_object')
const isMatchingClaim = require('../claim/is_matching_claim')

module.exports = (reconciliation, existingPropertyClaims) => claim => {
  reconciliation = claim.reconciliation || reconciliation
  if (!reconciliation) return claim
  validateReconciliationObject(reconciliation, claim)
  const { mode, matchingQualifiers, matchingReferences } = reconciliation
  const existingClaims = existingPropertyClaims.filter(isMatchingClaim(claim, matchingQualifiers))

  if (claim.remove) {
    if (existingClaims.length > 0) {
      return existingClaims.map(({ id }) => ({ id, remove: true }))
    } else {
      throw error_.new("can't remove claim: claim not found", claim)
    }
  }

  if (existingClaims.length === 0) return claim

  if (mode === 'skip') {
    console.warn(`[wikibase-edit] skipping claim: a similar claim already exists\n${JSON.stringify({ claim, existingClaims })}`)
  } else if (mode === 'merge') {
    if (existingClaims.length > 1) {
      throw error_.new('too many matching claims found', { claim, existingClaims })
    }
    const existingClaim = existingClaims[0]

    if (claim.qualifiers != null) {
      existingClaim.qualifiers = existingClaim.qualifiers || {}
      addMissingQualifiers(existingClaim.qualifiers, claim.qualifiers)
    }
    if (claim.references != null) {
      existingClaim.references = existingClaim.references || []
      if (matchingReferences) {
        mergeReferences(existingClaim.references, claim.references, matchingReferences)
      } else {
        const currentReference = simplify.references(existingClaim.references)
        const newReferenceReference = claim.references.filter(isNewReference(currentReference))
        existingClaim.references.push(...newReferenceReference)
      }
    }
    return existingClaim
  } else {
    throw error_.new('unexpected reconciliation mode', 500, { reconciliation })
  }
}

const addMissingQualifiers = (existingQualifiers, newQualifiers) => {
  for (const property in newQualifiers) {
    existingQualifiers[property] = existingQualifiers[property] || []
    existingQualifiers[property].push(...newQualifiers[property])
  }
}

const isNewReference = currentReference => reference => {
  const simplifiedReference = aggregateReferenceSnaks(reference.snaks, true)
  return !currentReference.some(currentReference => {
    return isEqual(currentReference, simplifiedReference)
  })
}

const mergeReferences = (existingReferences, newReferences, matchingReferences) => {
  const addedReferences = []
  for (const newReference of newReferences) {
    const matchingReference = existingReferences.find(isMatchingReference(newReference, matchingReferences))
    if (matchingReference) {
      mergeMatchingReference(matchingReference, newReference)
    } else {
      addedReferences.push(newReference)
    }
  }
  existingReferences.push(...addedReferences)
}

const mergeMatchingReference = (matchingReference, newReference) => {
  for (const property in newReference.snaks) {
    // Add only snaks from property not already defined on the existing reference
    if (!(property in matchingReference.snaks)) {
      matchingReference.snaks[property] = newReference.snaks[property]
    }
  }
}

const isMatchingReference = (newReference, matchingReferences) => existingReference => {
  const newReferenceSnaks = aggregateReferenceSnaks(newReference.snaks)
  const existingReferenceSnaks = existingReference.snaks
  for (const property of matchingReferences) {
    const newPropertySnaks = newReferenceSnaks[property]
    const existingPropertySnaks = existingReferenceSnaks[property]
    if (newPropertySnaks == null && existingPropertySnaks == null) return false
    if (newPropertySnaks != null && existingPropertySnaks == null) return false
    if (newPropertySnaks == null && existingPropertySnaks != null) return false
    const everyNewSnakHasAnExistingMatch = newPropertySnaks.every(hasSomeMatch(existingPropertySnaks))
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

const hasSomeMatch = existingPropertySnaks => snak => {
  return existingPropertySnaks.some(existingSnak => isMatchingSnak(existingSnak, snak))
}
