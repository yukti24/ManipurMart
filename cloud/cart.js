const moment = require('moment')
const Utils = require('../utils')

Parse.Cloud.beforeSave('Cart', async (req) => {

  const obj = req.object
  const attrs = obj.attributes
  const user = req.user

  if (!user && !req.master) throw 'Not Authorized'

  if (!obj.existed()) {
    const acl = new Parse.ACL()
    acl.setReadAccess(user, true)
    acl.setWriteAccess(user, true)
    obj.setACL(acl)
    obj.set('customer', user)
    obj.set('status', 'active')
  }

  const objs = attrs.items.map(item => {
    item.className = 'Item'
    return Parse.Object.fromJSON(item, false)
  })

  const fetchedItems = await Parse.Object.fetchAllWithInclude(objs)

  const items = attrs.items.map(rawItem => {

    const fetchedItem = fetchedItems.find(item => item.id === rawItem.objectId)

    const fetchedAttrs = fetchedItem.toJSON()

    const allowed = [
      'objectId',
      'name',
      'salePrice',
      'price',
      'featuredImage',
      'featuredImageThumb',
      'slug'
    ]

    const filtered = Object.keys(fetchedAttrs)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = fetchedAttrs[key]
        return obj
      }, {})
    
    if (fetchedAttrs.variations && fetchedAttrs.variations.length) {
      filtered.variation = rawItem.variation
    }
    
    filtered.qty = rawItem.qty
    filtered.amount = rawItem.qty * (filtered.salePrice || filtered.price)

    return filtered
  })

  const total = items.reduce((total, item) => total + item.amount, 0)

  obj.set('items', items)
  obj.set('subtotal', total)
  obj.set('total', total)

  if (attrs.status !== 'expired') {
    const appConfig = await Utils.getConfig()
    const expiration = appConfig.get('admin').cartExpiration

    if (expiration) {
      const expiresAt = moment().utc().add(expiration, 'hours').toDate()
      obj.set('expiresAt', expiresAt)
    }
    
  }

})