const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxItemId, getSandboxPropertyId, getSandboxClaimId } = require('./sandbox_entities')
const { randomString } = require('tests/unit/utils')

const addClaim = async (params = {}) => {
  let { id, property, datatype = 'string', value = randomString(), qualifiers } = params
  id = id || await getSandboxItemId()
  property = property || await getSandboxPropertyId(datatype)
  const res = await wbEdit.entity.edit({
    id,
    claims: {
      [property]: {
        value,
        qualifiers
      }
    }
  })
  const claim = res.entity.claims[property].slice(-1)[0]
  return { id, property, claim, guid: claim.id }
}

const addQualifier = async ({ guid, property, datatype, value }) => {
  guid = guid || await getSandboxClaimId()
  property = property || await getSandboxPropertyId(datatype)
  const res = await wbEdit.qualifier.set({ guid, property, value })
  const qualifier = res.claim.qualifiers[property].slice(-1)[0]
  const { hash } = qualifier
  return { guid, property, qualifier, hash }
}

const addReference = async ({ guid, property, datatype, value }) => {
  guid = guid || await getSandboxClaimId()
  property = property || await getSandboxPropertyId(datatype)
  const { reference } = await wbEdit.reference.set({ guid, property, value })
  const referenceSnak = reference.snaks[property].slice(-1)[0]
  return { guid, property, reference, referenceSnak }
}

module.exports = { addClaim, addQualifier, addReference }
