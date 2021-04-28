const { claim: simplifyClaim } = require('wikibase-sdk').simplify
const error_ = require('../error')
const valueComparatorsByDatatype = require('./value_comparators_by_datatype')

module.exports = (property, datatype, propSnaks, searchedValue) => {
  if (!propSnaks) return

  const matchingSnaks = propSnaks.filter(isMatchingSnak(datatype, searchedValue))

  if (matchingSnaks.length === 0) return
  if (matchingSnaks.length === 1) return matchingSnaks[0]

  const context = { property, propSnaks, searchedValue }
  throw error_.new('snak not found: too many matching snaks', 400, context)
}

const isMatchingSnak = (datatype, searchedValue) => snak => {
  // Support both statements and qualifiers snaks
  const unwrappedSnak = snak.mainsnak ? snak.mainsnak : snak
  return sameValue(datatype, unwrappedSnak, searchedValue)
}

const sameValue = (datatype, snak, searchedValue) => {
  if (searchedValue.snaktype && searchedValue.snaktype !== 'value') {
    return snak.snaktype === searchedValue.snaktype
  }
  const snakSimplifiedValue = simplifyClaim(snak)
  const comparator = valueComparatorsByDatatype[datatype]
  if (comparator) {
    return comparator(snak, snakSimplifiedValue, searchedValue)
  } else {
    return snakSimplifiedValue === searchedValue
  }
}
