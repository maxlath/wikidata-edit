require('should')
const { instance } = require('config')
const { randomString, properties } = require('tests/unit/utils')
const _createEntity = require('lib/entity/create')
const { shouldNotBeCalled } = require('root/tests/integration/utils/utils')
const createEntity = params => _createEntity(params, properties, instance)

describe('entity create', async () => {
  it('should reject parameters with an id', async () => {
    const params = { id: 'Q3' }
    await createEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal("a new entity can't already have an id"))
  })

  it('should set the action to wbeditentity', async () => {
    const params = { labels: { fr: 'foo' } }
    const { action } = await createEntity(params)
    action.should.equal('wbeditentity')
  })

  it('should then use entity.edit validation features', async () => {
    const params = { claims: { P2: 'bla' } }
    await createEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('invalid entity value'))
  })

  it('should format an item', async () => {
    const label = randomString()
    const description = randomString()
    const frAlias = randomString()
    const enAlias = randomString()
    const params = {
      labels: { en: label },
      aliases: { fr: frAlias, en: [ enAlias ] },
      descriptions: { fr: description },
      claims: { P2: 'Q166376' }
    }
    const { data } = await createEntity(params)
    data.new.should.equal('item')
    JSON.parse(data.data).should.deepEqual({
      labels: { en: { language: 'en', value: label } },
      aliases: {
        fr: [ { language: 'fr', value: frAlias } ],
        en: [ { language: 'en', value: enAlias } ]
      },
      descriptions: {
        fr: { language: 'fr', value: description }
      },
      claims: {
        P2: [
          {
            rank: 'normal',
            type: 'statement',
            mainsnak: {
              property: 'P2',
              snaktype: 'value',
              datavalue: {
                type: 'wikibase-entityid',
                value: { 'entity-type': 'item', 'numeric-id': 166376 }
              }
            }
          }
        ]
      }
    })
  })

  it('should reject a property creation without type', async () => {
    await createEntity({ datatype: 'string' })
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal("an item can't have a datatype"))
  })

  it('should reject a property creation without datatype', async () => {
    await createEntity({ type: 'property' })
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('missing property datatype'))
  })

  it('should create a property', async () => {
    const label = randomString()
    const params = {
      type: 'property',
      datatype: 'string',
      labels: { en: label }
    }
    const { data } = await createEntity(params)
    data.new.should.equal('property')
    JSON.parse(data.data).should.deepEqual({
      datatype: 'string',
      labels: { en: { language: 'en', value: label } }
    })
  })
})
