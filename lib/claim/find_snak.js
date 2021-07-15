const error_ = require('../error')
const isMatchingSnak = require('./is_matching_snak')

module.exports = (property, propSnaks, searchedValue) => {
  if (!propSnaks) return

  const matchingSnaks = propSnaks.filter(snak => isMatchingSnak(snak, searchedValue))

  if (matchingSnaks.length === 0) return
  if (matchingSnaks.length === 1) return matchingSnaks[0]

  const context = { property, propSnaks, searchedValue }
  throw error_.new('snak not found: too many matching snaks', 400, context)
}
