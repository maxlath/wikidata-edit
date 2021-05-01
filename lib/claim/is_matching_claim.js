const isMatchingSnak = require('./is_matching_snak')

module.exports = (claim, matchingQualifiers) => ({ mainsnak, qualifiers = {} }) => {
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
