const error_ = require('../error')
const { isPropertyId } = require('wikibase-sdk')

module.exports = (reconciliation, claim) => {
  if (typeof reconciliation !== 'object') throw error_.new('reconciliation should be an object', { reconciliation })
  for (const key of Object.keys(reconciliation)) {
    if (!validReconciliationKeys.includes(key)) {
      throw error_.new('invalid reconciliation object key', { key, reconciliation, validReconciliationKeys })
    }
  }
  const { mode, matchingQualifiers, matchingReferences } = reconciliation
  if (!claim.remove && !validReconciliationModes.includes(mode)) {
    throw error_.new('invalid reconciliation mode', { mode, validReconciliationModes })
  }

  validateMatchingPropertyArray('matchingQualifiers', matchingQualifiers)
  validateMatchingPropertyArray('matchingReferences', matchingReferences)
}

const validateMatchingPropertyArray = (name, array) => {
  if (array) {
    if (!(array instanceof Array)) {
      throw error_.new(`invalid ${name} array`, { [name]: array })
    }
    for (const id of array) {
      if (!isPropertyId(id)) {
        throw error_.new(`invalid ${name} property id`, { property: id })
      }
    }
  }
}

const validReconciliationKeys = [ 'mode', 'matchingQualifiers', 'matchingReferences' ]
const validReconciliationModes = [ 'skip', 'merge' ]
