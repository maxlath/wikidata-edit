require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')
const { simplify } = require('wikibase-sdk')

describe('reconciliation: matching', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  describe('qualifiers', () => {
    it('should match on all specified qualifiers properties by default', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar', 'buzz' ]
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar' ]
        },
        reconciliation: {
          mode: 'skip',
          matchingQualifiers: [ property ]
        }
      })
      res2.claim.id.should.not.equal(res.claim.id)
      const res3 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar', 'buzz', 'bla' ]
        },
        reconciliation: {
          mode: 'skip',
          matchingQualifiers: [ property ]
        }
      })
      res3.claim.id.should.not.equal(res.claim.id)
      res3.claim.id.should.not.equal(res2.claim.id)
    })

    it('should match on any specified qualifiers properties when requested', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar', 'buzz' ]
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar' ]
        },
        reconciliation: {
          mode: 'skip',
          matchingQualifiers: [ `${property}:any` ]
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      const res3 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: [ 'bar', 'buzz', 'bla' ]
        },
        reconciliation: {
          mode: 'skip',
          matchingQualifiers: [ `${property}:any` ]
        }
      })
      res3.claim.id.should.equal(res.claim.id)
    })
  })

  describe('references', () => {
    it('should match on all specified reference properties by default', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz' ]
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz' ]
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ property ]
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      simplify.references(res2.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz' ] }
      ])
      const res3 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz', 'bla' ]
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ property ]
        }
      })
      res3.claim.id.should.equal(res.claim.id)
      simplify.references(res3.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz' ] },
        { [property]: [ 'bar', 'buzz', 'bla' ] },
      ])
    })
  })
})
