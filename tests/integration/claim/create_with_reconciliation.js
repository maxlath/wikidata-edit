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
      it('should support quantity statements', async () => {
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
      it('should support quantity statements', async () => {
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
  })
})

const earth = 'http://www.wikidata.org/entity/Q2'
const coordObj = (latitude, longitude) => ({ latitude, longitude, precision: 1 / 3600, globe: earth, altitude: null })
