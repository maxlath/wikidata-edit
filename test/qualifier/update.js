require('should')
const CONFIG = require('config')
const addQualifier = require('../../lib/qualifier/add')(CONFIG)
const updateQualifier = require('../../lib/qualifier/update')(CONFIG)
const { getClaimGuid, sandboxEntity, secondSandboxEntity } = require('../../lib/tests_utils')
const wdk = require('wikidata-sdk')

var claimGuidPromise

describe('reference update', () => {
  before(function (done) {
    claimGuidPromise = getClaimGuid()
    done()
  })

  it('should be a function', done => {
    updateQualifier.should.be.a.Function()
    done()
  })

  it('should update an entity qualifier', function (done) {
    this.timeout(20 * 1000)
    claimGuidPromise
    .then(guid => {
      const property = 'P156'
      return addQualifier(guid, property, sandboxEntity)
      .then(res => updateQualifier(guid, property, sandboxEntity, secondSandboxEntity))
      .then(res => {
        res.success.should.equal(1)
        wdk.simplifyClaim(res.claim.qualifiers[property][0]).should.equal(secondSandboxEntity)
        done()
      })
    })
    .catch(done)
  })

  it('should update a string qualifier', function (done) {
    this.timeout(20 * 1000)
    claimGuidPromise
    .then(guid => {
      const property = 'P1545'
      const stringA = 'A-123'
      const stringB = 'B-123'
      return addQualifier(guid, property, stringA)
      .then(res => updateQualifier(guid, property, stringA, stringB))
      .then(res => {
        res.success.should.equal(1)
        wdk.simplifyClaim(res.claim.qualifiers[property][0]).should.equal(stringB)
        done()
      })
    })
    .catch(done)
  })

  it('should update a qualifier with a time value', function (done) {
    this.timeout(20 * 1000)
    claimGuidPromise
    .then(guid => {
      const property = 'P580'
      const timeA = '1802-02-26'
      const timeB = '1802-02-27'
      return addQualifier(guid, property, timeA)
      .then(res => updateQualifier(guid, property, timeA, timeB))
      .then(res => {
        res.success.should.equal(1)
        wdk.simplifyClaim(res.claim.qualifiers[property][0]).should.equal('1802-02-27T00:00:00.000Z')
        done()
      })
    })
    .catch(done)
  })

  it('should update a quantity qualifier with a unit', function (done) {
    this.timeout(20 * 1000)
    claimGuidPromise
    .then(guid => {
      const property = 'P2130'
      const quantityA = { amount: 123, unit: 'Q4916' }
      const quantityB = { amount: 124, unit: 'Q4916' }
      return addQualifier(guid, property, quantityA)
      .then(res => updateQualifier(guid, property, quantityA, quantityB))
      .then(res => {
        res.success.should.equal(1)
        wdk.simplifyClaim(res.claim.qualifiers[property][0]).should.equal(quantityB.amount)
        done()
      })
    })
    .catch(done)
  })

  it('should update a monolingual text qualifier', function (done) {
    this.timeout(20 * 1000)
    claimGuidPromise
    .then(guid => {
      const property = 'P3132'
      const textA = {
        text: "les sangliers longs des violons de l'automne",
        language: 'fr'
      }
      const textB = {
        text: "les sanglots longs des violons de l'automne",
        language: 'fr'
      }
      return addQualifier(guid, property, textA)
      .then(res => updateQualifier(guid, property, textA, textB))
      .then(res => {
        res.success.should.equal(1)
        wdk.simplifyClaim(res.claim.qualifiers[property][0]).should.equal(textB.text)
        done()
      })
    })
    .catch(done)
  })
})
