const isMatchingSnak = require('./is_matching_snak')

module.exports = (newClaim, matchingQualifiers) => existingClaim => {
  const { mainsnak, qualifiers = {} } = existingClaim
  if (!isMatchingSnak(mainsnak, newClaim.mainsnak)) return false
  if (matchingQualifiers) {
    for (const property of matchingQualifiers) {
      const [ pid, option = 'all' ] = property.split(':')
      if (newClaim.qualifiers[pid] != null && qualifiers[pid] == null) return false
      if (newClaim.qualifiers[pid] == null && qualifiers[pid] != null) return false
      const propertyQualifiersMatch = matchFunctions[option](newClaim.qualifiers[pid], qualifiers[pid])
      if (!propertyQualifiersMatch) return false
    }
  }
  return true
}

const matchFunctions = {
  all: (newPropertyQualifiers, existingPropertyQualifiers) => {
    for (const newQualifier of newPropertyQualifiers) {
      for (const existingQualifier of existingPropertyQualifiers) {
        if (!isMatchingSnak(existingQualifier, newQualifier)) return false
      }
    }
    return true
  },
  any: (newPropertyQualifiers, existingPropertyQualifiers) => {
    for (const newQualifier of newPropertyQualifiers) {
      for (const existingQualifier of existingPropertyQualifiers) {
        if (isMatchingSnak(existingQualifier, newQualifier)) return true
      }
    }
    return false
  },
}
