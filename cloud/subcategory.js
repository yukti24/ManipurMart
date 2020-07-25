const sharp = require('sharp')
const slug = require('limax')
const Utils = require('../utils')

Parse.Cloud.beforeSave('SubCategory', async (req) => {

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

  if (obj.dirty('name')) {
    obj.set('canonical', attrs.name.toLowerCase())
    obj.set('slug', slug(attrs.name))
  }

  if (attrs.deletedAt) {

    const query = new Parse.Query('Item')
    query.equalTo('subcategory', obj)
    query.doesNotExist('deletedAt')
    const result = await query.first()

    if (result) throw 'Can\'t delete subcategory if it still has items.'
  }

  const image = attrs.image

  if (!image || !obj.dirty('image')) return

  let httpResponse = await Parse.Cloud.httpRequest({
    url: image.url()
  })

  let resizedImage = await sharp(httpResponse.buffer).resize(200, 200).toBuffer()

  var file = new Parse.File('photo.jpg', {
    base64: resizedImage.toString('base64')
  })

  let savedFile = await file.save()

  obj.set('imageThumb', savedFile)

})

Parse.Cloud.afterSave('SubCategory', async (req) => {

  const obj = req.object
  const attrs = obj.attributes

  // Recalculate category count

  try {

    const category = attrs.category

    const query = new Parse.Query('SubCategory')
    query.equalTo('status', 'Active')
    query.equalTo('category', category)
    query.doesNotExist('deletedAt')

    const count = await query.count()

    category.set('subCategoryCount', count)
    await category.save(null, { useMasterKey: true })

  } catch (error) {
    console.log(error.message)
  }

  try {

    if (obj.existed()) {

      const origObj = req.original
      const origAttrs = origObj.attributes

      if (attrs.category.id !== origAttrs.category.id) {

        const originalCategory = origAttrs.category

        const query1 = new Parse.Query('SubCategory')
        query1.equalTo('status', 'Active')
        query1.equalTo('category', originalCategory)
        query1.doesNotExist('deletedAt')

        const count1 = await query1.count()

        originalCategory.set('subCategoryCount', count1)
        await originalCategory.save(null, { useMasterKey: true })
      }
    }

  } catch (error) {
    console.log(error.message)
  }

})