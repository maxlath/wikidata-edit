const qs = require('querystring')
const stringNumberPattern = /^(-|\+)?\d+(\.\d+)?$/
const signedStringNumberPattern = /^(-|\+)\d+(\.\d+)?$/

module.exports = {
  isNonEmptyString: str => typeof str === 'string' && str.length > 0,
  buildUrl: (base, query) => {
    query = qs.stringify(query)
    return `${base}?${query}`
  },
  // helpers to simplify polymorphisms
  forceArray: obj => {
    if (obj == null) return []
    if (!(obj instanceof Array)) return [ obj ]
    return obj
  },
  isString: str => typeof str === 'string',
  isNumber: num => typeof num === 'number',
  isStringNumber: str => stringNumberPattern.test(str),
  isSignedStringNumber: str => signedStringNumberPattern.test(str),
  isArray: array => array instanceof Array,
  isPlainObject: obj => {
    if (obj instanceof Array) return false
    if (obj === null) return false
    return typeof obj === 'object'
  },
  isntEmpty: value => value != null,
  flatten: arrays => [].concat.apply([], arrays),
  map: (obj, fn) => {
    const aggregator = (index, key) => {
      index[key] = fn(key, obj[key])
      return index
    }
    return Object.keys(obj).reduce(aggregator, {})
  },
  values: obj => Object.keys(obj).map(key => obj[key]),
  uniq: array => Array.from(new Set(array)),
  wait: ms => new Promise(resolve => setTimeout(resolve, ms))
}
