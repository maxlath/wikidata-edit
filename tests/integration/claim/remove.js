require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { randomString } = require('tests/unit/utils')
const { getSandboxPropertyId } = require('tests/integration/utils/sandbox_entities')
const { addClaim } = require('tests/integration/utils/sandbox_snaks')
const { shouldNotBeCalled } = require('../utils/utils')

describe('claim create', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  it('should remove a claim', async () => {
    const { guid } = await addClaim({ datatype: 'string', value: randomString() })
    const res = await wbEdit.claim.remove({ guid })
    res.success.should.equal(1)
    res.claims.should.deepEqual([ guid ])
  })

  it('should remove several claims on a same entity', async () => {
    const propertyId = await getSandboxPropertyId('string')
    const claims = {}
    claims[propertyId] = [ randomString(), randomString() ]
    const res = await createEntity(claims)
    const guids = getGuids(res.entity, propertyId)
    const res2 = await wbEdit.claim.remove({ guid: guids })
    res2.success.should.equal(1)
    res2.claims.should.deepEqual(guids)
  })

  it('should remove a claim by matching value', async () => {
    const { guid, id, property, claim } = await addClaim({ datatype: 'string', value: randomString() })
    const value = claim.mainsnak.datavalue.value
    const res = await wbEdit.claim.remove({ id, property, value })
    res.success.should.equal(1)
    res.claims.should.deepEqual([ guid ])
  })

  it('should remove a claim with qualifiers by matching mainsnak value', async () => {
    const somePropertyId = await getSandboxPropertyId('string')
    const value = randomString()
    const qualifierValue = randomString()
    const { guid, id, property } = await addClaim({
      datatype: 'string',
      value,
      qualifiers: {
        [somePropertyId]: qualifierValue,
      },
    })
    const res = await wbEdit.claim.remove({
      id,
      property,
      value,
      qualifiers: { [somePropertyId]: qualifierValue },
    })
    res.success.should.equal(1)
    res.claims.should.deepEqual([ guid ])
  })

  it('should remove a claim with qualifiers by matching mainsnak value', async () => {
    const somePropertyId = await getSandboxPropertyId('string')
    const value = randomString()
    const qualifierValue = randomString()
    const { guid, id, property } = await addClaim({
      datatype: 'string',
      value,
      qualifiers: {
        [somePropertyId]: qualifierValue,
      },
    })
    const res = await wbEdit.claim.remove({
      id,
      property,
      value,
      qualifiers: { [somePropertyId]: qualifierValue },
      reconciliation: {
        matchingQualifiers: [ somePropertyId ]
      }
    })
    res.success.should.equal(1)
    res.claims.should.deepEqual([ guid ])
  })

  it('should refuse to remove a claim with non matching qualifiers', async () => {
    const somePropertyId = await getSandboxPropertyId('string')
    const value = randomString()
    const { id, property } = await addClaim({
      datatype: 'string',
      value,
      qualifiers: {
        [somePropertyId]: randomString(),
      },
    })
    await wbEdit.claim.remove({
      id,
      property,
      value,
      qualifiers: { [somePropertyId]: randomString() },
      reconciliation: {
        matchingQualifiers: [ somePropertyId ]
      }
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.message.should.equal('claim not found')
    })
  })

  // The documentation explicitly specify that the claims should belong to the same entity
  // https://www.wikidata.org/w/api.php?action=help&modules=wbremoveclaims

  // it('should remove several claims on different entities', async () => {
  //   const propertyId = await getSandboxPropertyId('string')
  //   const claims = {}
  //   claims[propertyId] = randomString()
  //   const [ res1, res2 ] = await Promise.all([
  //     createEntity(claims),
  //     createEntity(claims)
  //   ])
  //   const guid1 = getGuids(res1.entity, propertyId)[0]
  //   const guid2 = getGuids(res2.entity, propertyId)[0]
  //   const res2 = await wbEdit.claim.remove({ guid: [ guid1, guid2 ] })
  //   res2.success.should.equal(1)
  //   res2.claims.should.deepEqual(guids)
  // })
})

const createEntity = claims => {
  return wbEdit.entity.create({
    labels: { en: randomString() },
    claims
  })
}

const getGuids = (entity, propertyId) => entity.claims[propertyId].map(claim => claim.id)
