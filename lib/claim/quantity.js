const _ = require('../utils')
const { isItemId } = require('wikibase-sdk')
const error_ = require('../error')
const itemUnitPattern = /^http.*\/entity\/(Q\d+)$/

module.exports = {
  parseQuantity: (amount, instance) => {
    let unit, upperBound, lowerBound
    if (_.isPlainObject(amount)) ({ amount, unit, upperBound, lowerBound } = amount)
    if (isItemId(unit)) unit = `${forceHttp(instance)}/entity/${unit}`
    validateNumber('amount', amount)
    validateNumber('upperBound', upperBound)
    validateNumber('lowerBound', lowerBound)
    unit = unit || '1'
    return { amount: signAmount(amount), unit, upperBound, lowerBound }
  },
  parseUnit: unit => {
    if (unit.match(itemUnitPattern)) unit = unit.replace(itemUnitPattern, '$1')
    return unit
  }
}

const signAmount = amount => {
  if (_.isSignedStringNumber(amount)) return `${amount}`
  if (_.isStringNumber(amount)) amount = parseFloat(amount)
  if (amount === 0) return '0'
  return amount > 0 ? `+${amount}` : `${amount}`
}

const forceHttp = instance => instance.replace('https:', 'http:')

const validateNumber = (label, num) => {
  if (_.isString(num) && !_.isStringNumber(num)) {
    throw error_.new('invalid string number', { [label]: num })
  }
}
