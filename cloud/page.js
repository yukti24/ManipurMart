const slug = require('limax')
const Utils = require('../utils')

Parse.Cloud.beforeSave('Page', async (req) => {

  const obj = req.object
  const attrs = obj.attributes
  const user = req.user

  const isAdmin = await Utils.isAdmin(user)
  if (!isAdmin && !req.master) throw 'Not Authorized'

  if (!obj.existed()) {
    const acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setRoleWriteAccess('Admin', true)
    obj.setACL(acl)
  }

  if (obj.dirty('title')) {
    obj.set('canonical', attrs.title.toLowerCase())
    obj.set('slug', slug(attrs.title))
  }

})