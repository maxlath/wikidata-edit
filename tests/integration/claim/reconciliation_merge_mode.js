require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')
const { simplify } = require('wikibase-sdk')

describe('reconciliation: merge mode', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  it('should add a statement when no statement exists', async () => {
    const [ id, property ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string')
    ])
    const res = await wbEdit.claim.create({
      id,
      property,
      value: 'foo',
      reconciliation: {
        mode: 'merge',
      }
    })
    res.claim.mainsnak.datavalue.value.should.equal('foo')
  })

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

  it('should not add an identical reference', async () => {
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

  it('should merge matching references', async () => {
    const [ id, property, property2, property3 ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string'),
      getSandboxPropertyId('quantity'),
      getSandboxPropertyId('wikibase-item'),
    ])
    await wbEdit.claim.create({
      id,
      property,
      value: 'foo',
      references: [
        { [property]: 'bar' },
        { [property2]: 456 },
      ]
    })
    const res2 = await wbEdit.claim.create({
      id,
      property,
      value: 'foo',
      references: [
        { [property]: 'bar', [property2]: 123 },
        { [property2]: 456, [property3]: id },
      ],
      reconciliation: {
        mode: 'merge',
        matchingReferences: [ property ],
      }
    })
    simplify.references(res2.claim.references).should.deepEqual([
      { [property2]: [ 123 ], [property]: [ 'bar' ] },
      { [property2]: [ 456 ] },
      { [property2]: [ 456 ], [property3]: [ id ] },
    ])
  })

  it('should add a different reference', async () => {
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