require('should')
const { instance } = require('config')
const { randomString, someEntityId: id, properties } = require('tests/unit/utils')
const _editEntity = require('lib/entity/edit')
const { shouldNotBeCalled } = require('root/tests/integration/utils/utils')
const editEntity = params => _editEntity(params, properties, instance)

describe('entity edit', () => {
  it('should reject a missing id', async () => {
    const params = { claims: { someWikibaseItemPropertyId: 'bla' } }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('invalid entity id'))
  })

  it('should reject misplaced parameters', async () => {
    const params = { id, P2: 'bla' }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.message.should.startWith('invalid parameter')
      err.context.parameter.should.equal('P2')
    })
  })

  it('should reject an edit without data', async () => {
    const params = { id }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('no data was passed'))
  })

  it('should reject invalid claims', async () => {
    const params = { id, claims: { P2: 'bla' } }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('invalid entity value'))
  })

  it('should reject invalid labels', async () => {
    const params = { id, labels: { fr: '' } }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('invalid label'))
  })

  it('should reject invalid descriptions', async () => {
    const params = { id, descriptions: { fr: '' } }
    await editEntity(params)
    .then(shouldNotBeCalled)
    .catch(err => err.message.should.equal('invalid description'))
  })

  it('should set the action to wbeditentity', async () => {
    const params = { id, labels: { fr: 'foo' } }
    const { action } = await editEntity(params)
    action.should.equal('wbeditentity')
  })

  it('should return formatted data', async () => {
    const label = randomString()
    const description = randomString()
    const frAlias = randomString()
    const enAlias = randomString()
    const { data } = await editEntity({
      id,
      labels: { fr: label },
      aliases: { fr: frAlias, en: [ enAlias ] },
      descriptions: { fr: description },
      claims: { P2: 'Q3576110' }
    })
    data.id.should.equal(id)
    JSON.parse(data.data).should.deepEqual({
      labels: {
        fr: { language: 'fr', value: label }
      },
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
                value: {
                  'entity-type': 'item',
                  'numeric-id': 3576110
                }
              }
            }
          }
        ]
      }
    })
  })

  it('should format an entity claim with qualifiers', async () => {
    const { data } = await editEntity({
      id,
      claims: {
        P2: [
          { value: 'Q5111731', qualifiers: { P1: '17', P2: [ 'Q13406268' ] } },
          {
            value: 'Q2622002',
            qualifiers: {
              P4: '1789-08-04',
              P8: { amount: 9001, unit: 'Q7727' },
              P9: { text: 'bulgroz', language: 'fr' }
            }
          }
        ]
      }
    })
    JSON.parse(data.data).claims.P2.should.deepEqual([
      {
        rank: 'normal',
        type: 'statement',
        mainsnak: {
          property: 'P2',
          snaktype: 'value',
          datavalue: {
            type: 'wikibase-entityid',
            value: { 'entity-type': 'item', 'numeric-id': 5111731 }
          }
        },
        qualifiers: {
          P1: [
            {
              property: 'P1',
              snaktype: 'value',
              datavalue: { type: 'string', value: '17' }
            }
          ],
          P2: [
            {
              property: 'P2',
              snaktype: 'value',
              datavalue: {
                type: 'wikibase-entityid',
                value: { 'entity-type': 'item', 'numeric-id': 13406268 }
              }
            }
          ]
        }
      },
      {
        rank: 'normal',
        type: 'statement',
        mainsnak: {
          property: 'P2',
          snaktype: 'value',
          datavalue: {
            type: 'wikibase-entityid',
            value: { 'entity-type': 'item', 'numeric-id': 2622002 }
          }
        },
        qualifiers: {
          P4: [
            {
              property: 'P4',
              snaktype: 'value',
              datavalue: {
                type: 'time',
                value: {
                  time: '+1789-08-04T00:00:00Z',
                  timezone: 0,
                  before: 0,
                  after: 0,
                  precision: 11,
                  calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
                }
              }
            }
          ],
          P8: [
            {
              property: 'P8',
              snaktype: 'value',
              datavalue: {
                type: 'quantity',
                value: { amount: '+9001', unit: `${instance.replace('https:', 'http:')}/entity/Q7727` }
              }
            }
          ],
          P9: [
            {
              property: 'P9',
              snaktype: 'value',
              datavalue: {
                type: 'monolingualtext',
                value: { text: 'bulgroz', language: 'fr' }
              }
            }
          ]
        }
      }
    ])
  })

  it('should format an entity claim with rich qualifier', async () => {
    const qualifiers = {
      P8: [ { value: { amount: 100, unit: 'Q6982035' } } ]
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: [ { value: 'Q54173', qualifiers } ]
      }
    })
    JSON.parse(data.data).claims.P2[0].qualifiers.P8[0].should.deepEqual({
      property: 'P8',
      snaktype: 'value',
      datavalue: {
        type: 'quantity',
        value: {
          amount: '+100',
          unit: `${instance.replace('https:', 'http:')}/entity/Q6982035`
        }
      }
    })
  })

  it('should format an entity claim with a qualifier with a special snaktype', async () => {
    const qualifiers = {
      P4: { snaktype: 'somevalue' }
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: [ { value: 'Q54173', qualifiers } ]
      }
    })
    JSON.parse(data.data).claims.P2[0].qualifiers.P4[0].should.deepEqual({
      property: 'P4',
      snaktype: 'somevalue'
    })
  })

  it('should format an entity claim with a low precision time claim', async () => {
    const qualifiers = {
      P4: { value: '2019-04-01T00:00:00.000Z' }
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: [ { value: 'Q54173', qualifiers } ]
      }
    })
    JSON.parse(data.data).claims.P2[0].qualifiers.P4[0].should.deepEqual({
      property: 'P4',
      snaktype: 'value',
      datavalue: {
        type: 'time',
        value: {
          time: '+2019-04-01T00:00:00Z',
          timezone: 0,
          before: 0,
          after: 0,
          precision: 11,
          calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
        }
      }
    })
  })

  it('should format an entity claim with a time qualifier', async () => {
    const qualifiers = {
      P4: { value: '2019-04-01T00:00:00.000Z' }
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: [ { value: 'Q54173', qualifiers } ]
      }
    })
    JSON.parse(data.data).claims.P2[0].qualifiers.P4[0].should.deepEqual({
      property: 'P4',
      snaktype: 'value',
      datavalue: {
        type: 'time',
        value: {
          time: '+2019-04-01T00:00:00Z',
          timezone: 0,
          before: 0,
          after: 0,
          precision: 11,
          calendarmodel: 'http://www.wikidata.org/entity/Q1985727'
        }
      }
    })
  })

  it('should format an entity claim with a reference', async () => {
    const reference = {
      P7: 'https://example.org',
      P2: 'Q8447'
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: { value: 'Q2622002', references: reference }
      }
    })
    JSON.parse(data.data).claims.P2[0].references[0].snaks.should.deepEqual([
      {
        property: 'P7',
        snaktype: 'value',
        datavalue: { type: 'string', value: 'https://example.org' }
      },
      {
        property: 'P2',
        snaktype: 'value',
        datavalue: {
          type: 'wikibase-entityid',
          value: { 'entity-type': 'item', 'numeric-id': 8447 }
        }
      }
    ])
  })

  it('should format an entity claim with a reference formatted with a snaks object', async () => {
    const reference = {
      snaks: {
        P7: 'https://example.org',
        P2: 'Q8447'
      }
    }
    const { data } = await editEntity({
      id,
      claims: {
        P2: { value: 'Q2622002', references: [ reference ] }
      }
    })
    JSON.parse(data.data).claims.P2[0].references[0].snaks[0]
    .datavalue.value.should.equal('https://example.org')
  })
})
