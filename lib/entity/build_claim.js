const _ = require('../utils')
const error_ = require('../error')
const validate = require('../validate')
const { entityEditBuilders: builders } = require('../claim/builders')
const { buildReference, buildPropSnaks } = require('../claim/snak')
const { hasSpecialSnaktype } = require('../claim/special_snaktype')
const datatypesToBuilderDatatypes = require('../properties/datatypes_to_builder_datatypes')

module.exports = (property, properties, value, instance) => {
  const datatype = properties[property]

  const builderDatatype = datatypesToBuilderDatatypes(datatype)
  const builder = builders[builderDatatype]

  const params = { properties, datatype, property, value, builder, instance }

  if (_.isString(value) || _.isNumber(value)) {
    return simpleClaimBuilder(params)
  } else {
    if (!_.isPlainObject(value)) throw error_.new('invalid claim value', { property, value })
    return fullClaimBuilder(params)
  }
}

const simpleClaimBuilder = params => {
  const { property, datatype, value, builder, instance } = params
  validate.snakValue(property, datatype, value)
  return builder(property, value, instance)
}

const fullClaimBuilder = params => {
  const { properties, datatype, property, value: claimData, builder, instance } = params
  validateClaimParameters(claimData)
  let { id, value, snaktype, rank, qualifiers, references, remove, reconciliation } = claimData

  if (remove === true) {
    if (!(id || reconciliation)) throw error_.new("can't remove a claim without an id or reconciliation settings", claimData)
    if (id) return { id, remove: true }
  }

  let claim
  if (hasSpecialSnaktype(claimData)) {
    claim = builders.specialSnaktype(property, snaktype)
  } else {
    // In case of a rich value (monolingual text, quantity, or globe coordinate)
    if (value == null && (claimData.text || claimData.amount || claimData.latitude)) {
      value = claimData
    }
    validate.snakValue(property, datatype, value)
    claim = builder(property, value, instance)
  }

  if (id) {
    validate.guid(id)
    claim.id = id
  }

  if (rank) {
    validate.rank(rank)
    claim.rank = rank
  }

  if (qualifiers) {
    claim.qualifiers = _.map(qualifiers, buildPropSnaks(properties, instance))
  }

  if (references) {
    // References snaks can be splitted into records, that is
    // sub-groups of references snaks pointing to a same claim
    claim.references = _.forceArray(references).map(buildReference(properties, instance))
  }

  if (reconciliation) claim.reconciliation = reconciliation
  if (remove) claim.remove = remove

  return claim
}

const validClaimParameters = [
  'id',
  'value',
  'snaktype',
  'rank',
  'qualifiers',
  'references',
  'remove',
  'reconciliation',
  'text',
  'language',
  'amount',
  'lowerBound',
  'upperBound',
  'unit',
  'latitude',
  'longitude',
  'precision',
  'globe',
  'altitude',
  'time',
  'timezone',
  'before',
  'after',
  'precision',
  'calendarmodel',
]

const validClaimParametersSet = new Set(validClaimParameters)

const validateClaimParameters = claimData => {
  for (const key in claimData) {
    if (!validClaimParametersSet.has(key)) {
      throw error_.new(`invalid claim parameter: ${key}`, { claimData, validClaimParameters })
    }
  }
}
