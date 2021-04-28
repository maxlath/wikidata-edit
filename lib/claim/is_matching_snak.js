const { snak: simplifySnak } = require('wikibase-sdk').simplify
const error_ = require('../error')
const { inviteToOpenAFeatureRequest } = require('../issues')
const _ = require('../utils')
const { parseUnit } = require('./quantity')

module.exports = (existingSnak, searchedValue) => {
  // Support both statements and qualifiers snaks
  existingSnak = existingSnak.mainsnak ? existingSnak.mainsnak : existingSnak
  // Support both a full snak object or just the datavalue.value object
  searchedValue = searchedValue.datavalue ? searchedValue.datavalue.value : searchedValue
  const { datatype } = existingSnak
  if (searchedValue.snaktype && (searchedValue.snaktype !== 'value' || existingSnak.snaktype !== 'value')) {
    return existingSnak.snaktype === searchedValue.snaktype
  }
  if (comparatorsByDatatype[datatype] == null) {
    const context = { datatype }
    const featureRequestMessage = inviteToOpenAFeatureRequest({
      title: `claim reconciliation: add support for ${datatype} datatype`,
      context
    })
    throw error_.new(`unsupported datatype: ${datatype}\n${featureRequestMessage}`, context)
  }
  return comparatorsByDatatype[datatype](existingSnak, searchedValue)
}

const simpleValueComparision = (snak, searchedValue) => snak.datavalue.value === searchedValue

const comparatorsByDatatype = {
  'external-id': simpleValueComparision,
  'globe-coordinate': (snak, searchedValue) => {
    const { latitude, longitude, altitude, precision, globe } = snak.datavalue.value
    if (_.isPlainObject(searchedValue)) {
      if (latitude !== searchedValue.latitude) return false
      if (longitude !== searchedValue.longitude) return false
      if (precision !== searchedValue.precision) return false
      if (globe !== searchedValue.globe) return false
      if (!(altitude === null && searchedValue.altitude === undefined)) {
        if (altitude !== searchedValue.altitude) return false
      }
      return true
    } else {
      return latitude === searchedValue[0] && longitude === searchedValue[1]
    }
  },
  monolingualtext: (snak, searchedValue) => {
    const { text, language } = snak.datavalue.value
    return language === searchedValue.language && text === searchedValue.text
  },
  quantity: (snak, searchedValue) => {
    const { amount } = snak.datavalue.value
    if (_.isPlainObject(searchedValue)) {
      if (searchedValue.unit !== getUnit(snak)) return false
      return parseAmount(searchedValue.amount) === parseAmount(amount)
    } else {
      return parseAmount(amount) === parseAmount(searchedValue)
    }
  },
  string: simpleValueComparision,
  time: (snak, searchedValue) => {
    const { time, timezone, before, after, precision, calendarmodel } = snak.datavalue.value
    if (searchedValue.time != null) {
      if (searchedValue.timezone != null && searchedValue.timezone !== timezone) return false
      if (searchedValue.before != null && searchedValue.before !== before) return false
      if (searchedValue.after != null && searchedValue.after !== after) return false
      if (searchedValue.precision != null && searchedValue.precision !== precision) return false
      if (searchedValue.calendarmodel != null && searchedValue.calendarmodel !== calendarmodel) return false
      const normalizedSnakTime = normalizeTime(time, searchedValue.precision)
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
