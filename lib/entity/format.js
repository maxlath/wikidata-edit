const { isString, forceArray, isntEmpty, flatten } = require('../utils')
const validate = require('../validate')
const buildClaim = require('./build_claim')
const error_ = require('../error')
const reconcileClaim = require('./reconcile_claim')

module.exports = {
  values: (name, values) => {
    const obj = {}
    Object.keys(values).forEach(lang => {
      let value = values[lang]
      validate.language(lang)
      if (name === 'alias') {
        value = forceArray(value)
        validate.aliases(value, { allowEmptyArray: true })
        obj[lang] = value.map(alias => buildLanguageValue(alias, lang))
      } else {
        validate.labelOrDescription(name, value)
        obj[lang] = buildLanguageValue(value, lang)
      }
    })
    return obj
  },
  claims: (claims, properties, instance, reconciliation, existingClaims) => {
    if (!properties) throw error_.new('expected properties')
    return Object.keys(claims)
    .reduce(formatClaim(claims, properties, instance, reconciliation, existingClaims), {})
  },
  sitelinks: sitelinks => {
    const obj = {}
    Object.keys(sitelinks).forEach(site => {
      validate.site(site)
      const title = sitelinks[site]
      if (title === null) {
        // Passing an empty string removes the sitelink
        obj[site] = buildSiteTitle('', site)
      } else {
        validate.siteTitle(title)
        obj[site] = buildSiteTitle(title, site)
      }
    })
    return obj
  }
}

const formatClaim = (claims, properties, instance, reconciliation, existingClaims) => (obj, property) => {
  if (!properties) throw error_.new('expected properties')
  if (!instance) throw error_.new('expected instance')
  validate.property(property)
  const values = forceArray(claims[property])
  obj[property] = obj[property] || []
  obj[property] = values.map(value => buildClaim(property, properties, value, instance))
  if (existingClaims != null) {
    obj[property] = obj[property]
      .map(reconcileClaim(reconciliation, existingClaims[property]))
      .filter(isntEmpty)
    obj[property] = flatten(obj[property])
    validateReconciledClaims(obj[property])
  }
  return obj
}

const buildLanguageValue = (value, language) => {
  // Re-building an object to avoid passing any undesired key/value
  const valueObj = { language }
  if (isString(value)) {
    valueObj.value = value
  } else if (value === null) {
    valueObj.remove = true
  } else {
    valueObj.value = value.value || value.title
    if (value.remove === true) valueObj.remove = true
    if (value.add != null) valueObj.add = ''
  }
  return valueObj
}

const buildSiteTitle = (title, site) => {
  // Re-building an object to avoid passing any undesired key/value
  const valueObj = { site }
  if (isString(title)) {
    valueObj.title = title
  } else {
    valueObj.title = title.title || title.value
    if (title.remove === true) valueObj.remove = true
  }
  return valueObj
}

const validateReconciledClaims = propertyClaims => {
  const claimsByGuid = {}
  for (const claim of propertyClaims) {
    const { id } = claim
    if (id) {
      if (claimsByGuid[id] != null) {
        throw error_.new('can not match several times the same claim', { claim })
      } else {
        claimsByGuid[id] = claim
      }
    }
  }
}
