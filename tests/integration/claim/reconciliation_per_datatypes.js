require('should')
const config = require('config')
const wbEdit = require('root')(config)
const { getSandboxPropertyId, getReservedItemId } = require('tests/integration/utils/sandbox_entities')
const { simplify } = require('wikibase-sdk')

describe('reconciliation: per datatypes', function () {
  this.timeout(20 * 1000)
  before('wait for instance', require('tests/integration/utils/wait_for_instance'))

  describe('string', () => {
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
  })

  describe('quantity', () => {
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
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: 123, qualifiers: { [property]: 987 } },
            { value: 654, qualifiers: { [property]: 321 } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true }).should.deepEqual({
        [property]: [
          { value: 123, qualifiers: { [property]: [ 456, 987 ] } },
          { value: 789, qualifiers: { [property]: [ 321 ] } },
          { value: 654, qualifiers: { [property]: [ 321 ] } },
        ]
      })
    })

    it('should ignore unspecified parameters', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('quantity')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { amount: 258.82, unit: 'Q712226' },
            { amount: '+258', lowerBound: '+256', upperBound: '+259' },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            258.82,
            '+258',
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepRichValues: true }).should.deepEqual({
        [property]: [
          { amount: 258.82, unit: 'Q712226' },
          { amount: 258, lowerBound: 256, upperBound: 259, unit: '1' },
        ]
      })
    })

    it('should not ignore specified parameters', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('quantity')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { amount: 258.82, unit: 'Q712226' },
            { amount: '+258', lowerBound: '+256', upperBound: '+259' },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { amount: 258.82, unit: 'Q712227' },
            { amount: '+258', lowerBound: '+255', upperBound: '+259' },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepRichValues: true }).should.deepEqual({
        [property]: [
          { amount: 258.82, unit: 'Q712226' },
          { amount: 258, lowerBound: 256, upperBound: 259, unit: '1' },
          { amount: 258.82, unit: 'Q712227' },
          { amount: 258, lowerBound: 255, upperBound: 259, unit: '1' },
        ]
      })
    })
  })

  describe('globe-coordinate', () => {
    it('should support globe-coordinate statements', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('globe-coordinate')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: coordObj(1, 23), qualifiers: { [property]: [ coordObj(4, 56) ] } },
            { value: coordObj(7, 89), qualifiers: { [property]: [ coordObj(3, 21) ] } },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: coordObj(1, 23), qualifiers: { [property]: [ coordObj(9, 87) ] } },
            { value: coordObj(6, 54), qualifiers: { [property]: [ coordObj(3, 21) ] } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true, keepRichValues: true }).should.deepEqual({
        [property]: [
          { value: coordObj(1, 23), qualifiers: { [property]: [ coordObj(4, 56), coordObj(9, 87) ] } },
          { value: coordObj(7, 89), qualifiers: { [property]: [ coordObj(3, 21) ] } },
          { value: coordObj(6, 54), qualifiers: { [property]: [ coordObj(3, 21) ] } },
        ]
      })
    })
  })

  describe('monolingualtext', () => {
    it('should support monolingualtext statements', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('monolingualtext')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: { text: 'a', language: 'en' }, qualifiers: { [property]: [ { text: 'z', language: 'en' } ] } },
            { value: { text: 'b', language: 'nl' }, qualifiers: { [property]: [ { text: 'y', language: 'de' } ] } },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: { text: 'a', language: 'en' }, qualifiers: { [property]: [ { text: 'x', language: 'en' } ] } },
            { value: { text: 'b', language: 'fr' }, qualifiers: { [property]: [ { text: 'y', language: 'de' } ] } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true, keepRichValues: true }).should.deepEqual({
        [property]: [
          { value: { text: 'a', language: 'en' }, qualifiers: { [property]: [ { text: 'z', language: 'en' }, { text: 'x', language: 'en' } ] } },
          { value: { text: 'b', language: 'nl' }, qualifiers: { [property]: [ { text: 'y', language: 'de' } ] } },
          { value: { text: 'b', language: 'fr' }, qualifiers: { [property]: [ { text: 'y', language: 'de' } ] } },
        ]
      })
    })
  })

  describe('time', () => {
    it('should support time statements', async () => {
      const [ id, property ] = await Promise.all([
        getReservedItemId(),
        getSandboxPropertyId('time')
      ])
      await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: '2013', qualifiers: { [property]: '2015-02' } },
            { value: '1936', qualifiers: { [property]: '2011' } },
          ]
        }
      })
      const res2 = await wbEdit.entity.edit({
        id,
        claims: {
          [property]: [
            { value: '2013', qualifiers: { [property]: '1789-08-04' } },
            { value: '2018-12-05', qualifiers: { [property]: '2011' } },
          ]
        },
        reconciliation: {
          mode: 'merge',
        }
      })
      simplify.claims(res2.entity.claims, { keepQualifiers: true, timeConverter: 'simple-day' }).should.deepEqual({
        [property]: [
          { value: '2013', qualifiers: { [property]: [ '2015-02', '1789-08-04' ] } },
          { value: '1936', qualifiers: { [property]: [ '2011' ] } },
          { value: '2018-12-05', qualifiers: { [property]: [ '2011' ] } },
        ]
      })
    })
  })
})

const earth = 'http://www.wikidata.org/entity/Q2'
const coordObj = (latitude, longitude) => ({ latitude, longitude, precision: 1 / 3600, globe: earth, altitude: null })
