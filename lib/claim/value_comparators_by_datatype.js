const { snak: simplifySnak } = require('wikibase-sdk').simplify
const _ = require('../utils')
const { parseUnit } = require('./quantity')

const simpleValueComparision = (snak, snakSimplifiedValue, searchedValue) => snakSimplifiedValue === searchedValue

module.exports = {
  'external-id': simpleValueComparision,
  'globe-coordinate': (snak, snakSimplifiedValue, searchedValue) => {
    if (_.isPlainObject(searchedValue)) {
      const { latitude, longitude, altitude, precision, globe } = snak.datavalue.value
      if (latitude !== searchedValue.latitude) return false
      if (longitude !== searchedValue.longitude) return false
      if (precision !== searchedValue.precision) return false
      if (globe !== searchedValue.globe) return false
      if (!(altitude === null && searchedValue.altitude === undefined)) {
        if (altitude !== searchedValue.altitude) return false
      }
      return true
    } else {
      return snakSimplifiedValue[0] === searchedValue[0] && snakSimplifiedValue[1] === searchedValue[1]
    }
  },
  monolingualtext: (snak, snakSimplifiedValue, searchedValue) => {
    const { language } = snak.datavalue.value
    if (language !== searchedValue.language) return false
    return snakSimplifiedValue === searchedValue.text
  },
  quantity: (snak, snakSimplifiedValue, searchedValue) => {
    if (_.isPlainObject(searchedValue)) {
      if (searchedValue.unit !== getUnit(snak)) return false
      return parseAmount(searchedValue.amount) === parseAmount(snakSimplifiedValue)
    } else {
      return parseAmount(snakSimplifiedValue) === parseAmount(searchedValue)
    }
  },
  string: simpleValueComparision,
  time: (snak, snakSimplifiedValue, searchedValue) => {
    if (searchedValue.time != null) {
      const snakFullValue = snak.datavalue.value
      if (searchedValue.timezone != null && searchedValue.timezone !== snakFullValue.timezone) return false
      if (searchedValue.before != null && searchedValue.before !== snakFullValue.before) return false
      if (searchedValue.after != null && searchedValue.after !== snakFullValue.after) return false
      if (searchedValue.precision != null && searchedValue.precision !== snakFullValue.precision) return false
      if (searchedValue.calendarmodel != null && searchedValue.calendarmodel !== snakFullValue.calendarmodel) return false
      const normalizedSnakTime = normalizeTime(snakFullValue.time, searchedValue.precision)
      const normalizedInputValueTime = normalizeTime(searchedValue.time, searchedValue.precision)
      return normalizedSnakTime === normalizedInputValueTime
    } else {
      const simplifiedSnak = simplifySnak(snak, { timeConverter: 'simple-day' })
      return simplifiedSnak === searchedValue
    }
  },
  url: simpleValueComparision,
  'wikibase-item': simpleValueComparision,
  'wikibase-property': simpleValueComparision,
}

const getUnit = snak => parseUnit(snak.datavalue.value.unit)

const parseAmount = amount => _.isString(amount) ? parseFloat(amount) : amount

const normalizeTime = (time, precison) => {
  time = time.replace(/^\+/, '')
  if (precison <= 11) {
    time = time
      .replace(/-00/g, '-01')
      .split('T')[0]
  }
  return time
}
