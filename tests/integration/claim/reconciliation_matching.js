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
          mode: 'skip-on-value-match',
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
          mode: 'skip-on-value-match',
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
          mode: 'skip-on-value-match',
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
          mode: 'skip-on-value-match',
          matchingQualifiers: [ `${property}:any` ]
        }
      })
      res3.claim.id.should.equal(res.claim.id)
    })
  })

  describe('references', () => {
    it('should match on all specified reference properties by default', async () => {
      const [ id, property, property2 ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string'),
        getSandboxPropertyId('quantity'),
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz' ],
          [property2]: 123
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz' ],
          [property2]: 456
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ property ]
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      simplify.references(res2.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz' ], [property2]: [ 123, 456 ] },
      ])
      const res3 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz', 'bla' ],
          [property2]: 789
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ property ]
        }
      })
      res3.claim.id.should.equal(res.claim.id)
      simplify.references(res3.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz' ], [property2]: [ 123, 456 ] },
        { [property]: [ 'bar', 'buzz', 'bla' ], [property2]: [ 789 ] },
      ])
    })

    it('should match on any specified reference properties when requested', async () => {
      const [ id, property, property2 ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string'),
        getSandboxPropertyId('quantity'),
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz' ],
          [property2]: 123,
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar' ],
          [property2]: 123,
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ `${property}:any` ]
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      simplify.references(res2.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz' ], [property2]: [ 123 ] }
      ])
      const res3 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: [ 'bar', 'buzz', 'bla' ],
          [property2]: 456,
        },
        reconciliation: {
          mode: 'merge',
          matchingReferences: [ `${property}:any` ]
        }
      })
      res3.claim.id.should.equal(res.claim.id)
      simplify.references(res3.claim.references).should.deepEqual([
        { [property]: [ 'bar', 'buzz', 'bla' ], [property2]: [ 123, 456 ] },
      ])
    })
  })
})
