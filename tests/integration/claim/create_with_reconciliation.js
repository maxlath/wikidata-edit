require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')
const { simplify } = require('wikibase-sdk')

describe('create with reconciliation', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  describe('merge', () => {
    it('should not re-add an existing statement', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({ id, property, value: 'foo' })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        reconciliation: {
          mode: 'merge',
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      res2.claim.mainsnak.datavalue.value.should.equal('foo')
    })

    it('should re-add a statement if expected qualifiers do not match', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({ id, property, value: 'foo', qualifiers: { [property]: 'bar' } })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: { [property]: 'buzz' },
        reconciliation: {
          mode: 'merge',
          matchingQualifiers: [ property ],
        }
      })
      res2.claim.id.should.not.equal(res.claim.id)
    })

    it('should merge qualifiers', async () => {
      const [ id, property, property2 ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string'),
        getSandboxPropertyId('quantity'),
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: 'bar',
          [property2]: 123,
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: {
          [property]: 'buzz',
          [property2]: 123,
        },
        reconciliation: { mode: 'merge' }
      })
      res2.claim.id.should.equal(res.claim.id)
      res2.claim.qualifiers[property].map(simplify.qualifier).should.deepEqual([ 'bar', 'buzz' ])
      res2.claim.qualifiers[property2].map(simplify.qualifier).should.deepEqual([ 123 ])
    })

    it('should not add an identical reference record', async () => {
      const [ id, property, property2 ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string'),
        getSandboxPropertyId('quantity'),
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: [
          { [property]: 'bar', [property2]: 123 },
        ]
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: [
          { [property]: 'bar', [property2]: 123 },
          { [property]: 'bar' },
        ],
        reconciliation: { mode: 'merge' }
      })
      res2.claim.id.should.equal(res.claim.id)
      simplify.references(res2.claim.references).should.deepEqual([
        { [property2]: [ 123 ], [property]: [ 'bar' ] },
        { [property]: [ 'bar' ] },
      ])
    })

    it('should add a different reference record', async () => {
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
          [property]: 'bar',
          [property2]: 123
        }
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        references: {
          [property]: 'bar',
          [property2]: 124
        },
        reconciliation: { mode: 'merge' }
      })
      res2.claim.id.should.equal(res.claim.id)
      simplify.references(res2.claim.references).should.deepEqual([
        { [property]: [ 'bar' ], [property2]: [ 123 ] },
        { [property]: [ 'bar' ], [property2]: [ 124 ] },
      ])
    })
  })

  describe('skip', () => {
    it('should not re-add an existing statement', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({ id, property, value: 'foo' })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        reconciliation: {
          mode: 'skip',
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      res2.claim.mainsnak.datavalue.value.should.equal('foo')
    })

    it('should not merge qualifiers and references', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      const res = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: { [property]: 'bar' },
        references: { [property]: 'buzz' },
      })
      const res2 = await wbEdit.claim.create({
        id,
        property,
        value: 'foo',
        qualifiers: { [property]: 'bla' },
        references: { [property]: 'blu' },
        reconciliation: {
          mode: 'skip',
        }
      })
      res2.claim.id.should.equal(res.claim.id)
      res2.claim.mainsnak.datavalue.value.should.equal('foo')
      simplify.propertyQualifiers(res2.claim.qualifiers[property]).should.deepEqual([ 'bar' ])
      simplify.references(res2.claim.references).should.deepEqual([ { [property]: [ 'buzz' ] } ])
    })
  })

  describe('datatypes', () => {
    it('should support string statements', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('string')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: 'foo', qualifiers: { [property]: 'buzz' } },
            { value: 'bar', qualifiers: { [property]: 'bla' } },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: 'foo', qualifiers: { [property]: 'blo' } },
            { value: 'bli', qualifiers: { [property]: 'bla' } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true }).should.deepEqual({
        [property]: [
          { value: 'foo', qualifiers: { [property]: [ 'buzz', 'blo' ] } },
          { value: 'bar', qualifiers: { [property]: [ 'bla' ] } },
          { value: 'bli', qualifiers: { [property]: [ 'bla' ] } },
        ]
      })
    })

    it('should support quantity statements', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('quantity')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: 123, qualifiers: { [property]: 456 } },
            { value: 789, qualifiers: { [property]: 321 } },
            { value: { amount: 258.82, unit: 'Q712226' } },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: 123, qualifiers: { [property]: 987 } },
            { value: 654, qualifiers: { [property]: 321 } },
            { value: { amount: 258.82, unit: 'Q712226' }, qualifiers: { [property]: 634 } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true, keepRichValues: true }).should.deepEqual({
        [property]: [
          { value: { amount: 123, unit: '1' }, qualifiers: { [property]: [ { amount: 456, unit: '1' }, { amount: 987, unit: '1' } ] } },
          { value: { amount: 789, unit: '1' }, qualifiers: { [property]: [ { amount: 321, unit: '1' } ] } },
          { value: { amount: 258.82, unit: 'Q712226' }, qualifiers: { [property]: [ { amount: 634, unit: '1' } ] } },
          { value: { amount: 654, unit: '1' }, qualifiers: { [property]: [ { amount: 321, unit: '1' } ] } },
        ]
      })
    })
  })
})
