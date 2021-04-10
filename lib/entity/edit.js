const { isEntityId } = require('wikibase-sdk')
const error_ = require('../error')
const format = require('./format')

module.exports = async (data, properties, instance) => {
  validateParameters(data)

  const { id, create, type, datatype, clear, rawMode } = data
  const params = { data: {} }

  if (type && type !== 'property' && type !== 'item') {
    throw error_.new('invalid entity type', { type })
  }

  if (create) {
    if (type === 'property') {
      if (!datatype) throw error_.new('missing property datatype', { datatype })
      if (!datatypes.has(datatype)) {
        throw error_.new('invalid property datatype', { datatype, knownDatatypes: datatypes })
      }
      params.new = 'property'
      params.data.datatype = datatype
    } else {
      if (datatype) {
        throw error_.new("an item can't have a datatype", { datatype })
      }
      params.new = 'item'
    }
  } else if (isEntityId(id)) {
    params.id = id
  } else {
    throw error_.new('invalid entity id', { id })
  }

  const { labels, aliases, descriptions, claims, sitelinks } = data

  if (rawMode) {
    if (labels) params.data.labels = labels
    if (aliases) params.data.aliases = aliases
    if (descriptions) params.data.descriptions = descriptions
    if (claims) params.data.claims = claims
    if (sitelinks) params.data.sitelinks = sitelinks
  } else {
    if (labels) params.data.labels = format.values('label', labels)
    if (aliases) params.data.aliases = format.values('alias', aliases)
    if (descriptions) params.data.descriptions = format.values('description', descriptions)
    if (claims) params.data.claims = format.claims(claims, properties, instance)
    if (sitelinks) params.data.sitelinks = format.sitelinks(sitelinks)
  }

  if (clear === true) params.clear = true

  if (!clear && Object.keys(params.data).length === 0) {
    throw error_.new('no data was passed', { id })
  }

  // stringify as it will be passed as form data
  params.data = JSON.stringify(params.data)

  return {
    action: 'wbeditentity',
    data: params
  }
}

const datatypes = new Set([
  'commons-media',
  'external-id',
  'geo-shape',
  'globe-coordinate',
  'math',
  'monolingualtext',
  'musical-notation',
  'quantity',
  'string',
  'tabular-data',
  'time',
  'url',
  'wikibase-form',
  'wikibase-item',
  'wikibase-property',
  'wikibase-lexeme',
])

const allowedParameters = new Set([
  'id', 'create', 'type', 'datatype', 'clear', 'rawMode', 'summary', 'baserevid',
  'labels', 'aliases', 'descriptions', 'claims', 'sitelinks',
])

const validateParameters = data => {
  for (const parameter in data) {
    if (!allowedParameters.has(parameter)) {
      throw error_.new('invalid parameter', 400, { parameter, allowedParameters, data })
    }
  }
}
