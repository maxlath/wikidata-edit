require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')
const { simplify } = require('wikibase-sdk')
const { shouldNotBeCalled } = require('../utils/utils')

describe('reconciliation:remove claims', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  it('should remove matching claims', async () => {
    const [ id, property ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string')
    ])
    await wbEdit.entity.edit({
      id,
      claims: {
        [property]: [
          { value: 'foo' },
          { value: 'foo' },
          { value: 'bar', qualifiers: { [property]: [ 'buzz' ] } },
          { value: 'bar', qualifiers: { [property]: [ 'bla' ] } },
        ]
      }
    })
    const res2 = await wbEdit.entity.edit({
      id,
      claims: {
        [property]: [
          { value: 'foo', remove: true, reconciliation: {} },
          {
            value: 'bar',
            qualifiers: { [property]: [ 'bla' ] },
            remove: true,
            reconciliation: { matchingQualifiers: [ property ] }
          },
        ]
      },
    })
    simplify.claims(res2.entity.claims, { keepQualifiers: true }).should.deepEqual({
      [property]: [
        { value: 'bar', qualifiers: { [property]: [ 'buzz' ] } },
      ]
    })
  })

  it('should reject matching several times the same claim', async () => {
    const [ id, property ] = await Promise.all([
      getReservedItemId(),
      getSandboxPropertyId('string')
    ])
    await wbEdit.entity.edit({
      id,
      claims: {
        [property]: [
          { value: 'foo' },
        ]
      }
    })
    await wbEdit.entity.edit({
      id,
      claims: {
        [property]: [
          { value: 'foo', remove: true, reconciliation: {} },
          { value: 'foo', remove: true, reconciliation: {} },
        ]
      },
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.message.should.equal('can not match several times the same claim')
    })
  })
})
