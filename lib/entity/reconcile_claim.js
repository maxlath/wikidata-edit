const error_ = require('../error')
const { inviteToOpenAFeatureRequest } = require('../issues')

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
      existingClaim.references.push(...claim.references)
    }
  }
  return existingClaim
}

const isMatchingClaim = (claim, matchingQualifiers) => ({ mainsnak, qualifiers = {} }) => {
  if (mainsnak.datavalue.value !== claim.mainsnak.datavalue.value) return false
  if (matchingQualifiers) {
    for (const property of matchingQualifiers) {
      if (claim.qualifiers[property] != null && qualifiers[property] == null) return false
      if (claim.qualifiers[property] == null && qualifiers[property] != null) return false
      const { datatype } = qualifiers[property][0]
      for (const qualifier of claim.qualifiers[property]) {
        for (const existingQualifier of qualifiers[property]) {
          if (!isMatchingSnak(datatype, qualifier, existingQualifier)) return false
        }
      }
    }
  }
  return true
}

const isMatchingSnak = (datatype, snakA, snakB) => {
  if (snakA.snaktype !== snakB.snaktype) return false
  if (isMatchingSnakByDatatype[datatype] == null) {
    const context = { datatype }
    const featureRequestMessage = inviteToOpenAFeatureRequest({
      title: `claim reconciliation: add support for ${datatype} datatype`,
      context
    })
    throw error_.new(`unsupported datatype: ${datatype}\n${featureRequestMessage}`, context)
  }
  return isMatchingSnakByDatatype[datatype](snakA, snakB)
}

const isMatchingSnakByDatatype = {
  string: (snakA, snakB) => {
    return snakA.datavalue.value === snakB.datavalue.value
  }
}

const addMissingQualifiers = (existingQualifiers, newQualifiers) => {
  for (const property in newQualifiers) {
    existingQualifiers[property] = existingQualifiers[property] || []
    existingQualifiers[property].push(...newQualifiers[property])
  }
}
