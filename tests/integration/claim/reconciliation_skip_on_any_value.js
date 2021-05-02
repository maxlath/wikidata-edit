require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')

describe('reconciliation: skip-on-any-value mode', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  it('should add a statement when no statement exists for that property', async () => {
    const [ id, property ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string')
    ])
    const res = await wbEdit.claim.create({
      id,
      property,
      value: 'foo',
      reconciliation: {
        mode: 'skip-on-any-value',
      }
    })
    res.claim.mainsnak.datavalue.value.should.equal('foo')
  })

  it('should not add a statement when a statement exists for that property', async () => {
    const [ id, property ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string')
    ])
    const res = await wbEdit.claim.create({ id, property, value: 'foo' })
    const res2 = await wbEdit.claim.create({
      id,
      property,
      value: 'bar',
      reconciliation: {
        mode: 'skip-on-any-value',
      }
    })
    res2.claim.id.should.equal(res.claim.id)
    res2.claim.mainsnak.datavalue.value.should.equal('foo')
  })
})
