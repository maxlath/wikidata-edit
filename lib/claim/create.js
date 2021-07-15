const error_ = require('../error')

module.exports = async (params, config, API) => {
  const { id, property, value, qualifiers, references, rank, reconciliation } = params

  if (!value) throw error_.new('missing value', 400, params)

  const claim = { rank, qualifiers, references }
  if (value.snaktype && value.snaktype !== 'value') {
    claim.snaktype = value.snaktype
  } else {
    claim.value = value
  }

  let summary = params.summary || config.summary

  if (!summary) {
    const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value)
    summary = `add ${property} claim: ${stringifiedValue}`
  }

  const data = {
    id,
    claims: {
      [property]: claim
    },
    summary,
    baserevid: params.baserevid || config.baserevid,
    reconciliation,
  }

  // Using wbeditentity, as the endpoint is more complete, so we need to recover the summary
  const { entity, success } = await API.entity.edit(data, config)

  const newClaim = entity.claims[property].slice(-1)[0]
  // Mimick claim actions responses
  return { claim: newClaim, success }
}
