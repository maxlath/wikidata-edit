require('module-alias/register')
require('should')
const removeClaim = require('lib/claim/remove')
const { guid, guid2 } = require('tests/unit/utils')

describe('claim remove', () => {
  it('should set the action to wbremoveclaims', async () => {
    const { action } = await removeClaim({ guid })
    action.should.equal('wbremoveclaims')
  })

  it('should return formatted data for one claim', async () => {
    const { data } = await removeClaim({ guid })
    data.claim.should.equal(guid)
  })

  it('should return formatted data for several claims', async () => {
    const guids = [ guid, guid2 ]
    const { data } = await removeClaim({ guid: guids })
    data.claim.should.equal(guids.join('|'))
  })
})
