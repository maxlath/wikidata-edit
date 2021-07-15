const edit = require('./edit')
const error_ = require('../error')

module.exports = async (params, properties, instance) => {
  const { id } = params
  if (id) throw error_.new("a new entity can't already have an id", { id })
  params.create = true
  return edit(params, properties, instance)
}
