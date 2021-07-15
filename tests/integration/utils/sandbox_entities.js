const config = require('config')
const wbk = require('wikibase-sdk')({ instance: config.instance })
const { getEntityIdFromGuid } = wbk
const wbEdit = require('root')(config)
const { randomString } = require('tests/unit/utils')
const getProperty = require('./get_property')
const fetch = require('lib/request/fetch')

// Working around the circular dependency
let addClaim
const lateRequire = () => {
  ({ addClaim } = require('tests/integration/utils/sandbox_snaks'))
}
setTimeout(lateRequire, 0)

const createEntity = async (data = {}) => {
  data.labels = data.labels || { en: randomString() }
  const { entity } = await wbEdit.entity.create(data)
  console.log(`created ${entity.type}`, entity.id, data.datatype || '')
  return entity
}

let sandboxItemPromise
const getSandboxItem = () => {
  sandboxItemPromise = sandboxItemPromise || createEntity()
  return sandboxItemPromise
}

const getRefreshedEntity = async id => {
  const url = wbk.getEntities({ ids: id })
  const res = await fetch(url).then(res => res.json())
  return res.entities[id]
}

let claimPromise
const getSandboxClaim = (datatype = 'string') => {
  if (claimPromise) return claimPromise

  claimPromise = Promise.all([
    getSandboxItem(),
    getSandboxPropertyId(datatype)
  ])
  .then(([ item, propertyId ]) => {
    const propertyClaims = item.claims[propertyId]
    if (propertyClaims) return propertyClaims[0]
    return wbEdit.claim.create({ id: item.id, property: propertyId, value: randomString() })
    .then(res => res.claim)
  })

  return claimPromise
}

const getRefreshedClaim = async guid => {
  const id = getEntityIdFromGuid(guid)
  const { claims } = await getRefreshedEntity(id)
  for (const propertyClaims of Object.values(claims)) {
    for (const claim of propertyClaims) {
      if (claim.id === guid) return claim
    }
  }
}

const getSandboxItemId = () => getSandboxItem().then(getId)
const getSandboxPropertyId = datatype => getProperty({ datatype }).then(getId)
const getSandboxClaimId = () => getSandboxClaim().then(getId)
const getId = obj => obj.id

const createItem = (data = {}) => {
  data.type = 'item'
  return createEntity(data)
}

let someEntityId
const getSomeEntityId = async () => {
  someEntityId = someEntityId || await getSandboxItemId()
  return someEntityId
}

let someGuid
const getSomeGuid = async () => {
  if (someGuid) return someGuid
  const { guid } = await addClaim({ datatype: 'string', value: randomString() })
  someGuid = guid
  return guid
}

module.exports = {
  getSandboxItem,
  getSandboxItemId,
  getReservedItem: createItem,
  getReservedItemId: () => createItem().then(entity => entity.id),
  getSandboxPropertyId,
  getRefreshedEntity,
  getRefreshedClaim,
  getSandboxClaim,
  getSandboxClaimId,
  createItem,
  getSomeEntityId,
  getSomeGuid
}
