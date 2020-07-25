Parse.Cloud.beforeSave('Review', async (req) => {

  const obj = req.object
  const attrs = obj.attributes
  const user = req.user

  if (!user && !req.master) throw 'Not Authorized'

  await attrs.item.fetch()

  if (!obj.existed()) {
    const acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
    obj.set('user', user)
    obj.set('status', 'Pending')
  }

  const query = new Parse.Query('Review')
  query.equalTo('user', user)
  query.equalTo('order', attrs.order)
  query.equalTo('item', attrs.item)

  const exists = await query.first()

  if (exists) {
    throw new Parse.Error(5000, 'You already write a review for this item')
  } else if (attrs.rating < 1) {
    throw new Parse.Error(5001, 'You cannot give less than one star')
  } else if (attrs.rating > 5) {
    throw new Parse.Error(5002, 'You cannot give more than five stars')
  }

})

Parse.Cloud.afterSave('Review', async (req) => {

  const obj = req.object
  const attrs = obj.attributes
  const original = req.original

  if (obj.existed()) {

    try {

      const origAttrs = original.attributes

      if (attrs.status !== origAttrs.status) {

        const item = attrs.item

        await item.fetch()

        if (attrs.status === 'Published') {

          item.increment('ratingCount')
          item.increment('ratingTotal', attrs.rating)

        } else if (origAttrs.status === 'Published' &&
          (attrs.status === 'Pending' || attrs.status === 'Banned')) {

          item.increment('ratingCount', -1)
          item.increment('ratingTotal', -attrs.rating)

        }

        if (item.dirty()) {
          
          const ratingTotal = item.get('ratingTotal')
          const ratingCount = item.get('ratingCount')

          if (ratingTotal && ratingCount) {
            const ratingAvg = Math.round(ratingTotal / ratingCount)
            item.set('ratingAvg', ratingAvg)
          } else {
            item.set('ratingAvg', 0)
          }
  
          item.save(null, { useMasterKey: true })
        }

      }

    } catch (err) {
      console.warn(err.message)
    }
  }
})

Parse.Cloud.afterDelete('Review', async (req) => {

  const obj = req.object
  const attrs = obj.attributes

  if (attrs.status !== 'Published') return

  const item = attrs.item

  await item.fetch()

  item.increment('ratingCount', -1)
  item.increment('ratingTotal', -attrs.rating)

  const ratingAvg = Math.round(item.get('ratingTotal') / item.get('ratingCount'))
  item.set('ratingAvg', ratingAvg)

  item.save(null, { useMasterKey: true })

})