const sharp = require('sharp')
const slug = require('limax')
const Utils = require('../utils')

Parse.Cloud.beforeSave('Brand', async (req, res) => {

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
    query.equalTo('brand', obj)
    query.doesNotExist('deletedAt')
    const item = await query.first()

    if (item) throw 'Can\'t delete brand if it still has items.'
  }

  const image = attrs.image

  if (image && obj.dirty('image')) {

    const res = await Parse.Cloud.httpRequest({
      url: image.url()
    })

    const imageResizedData = await sharp(res.buffer)
      .jpeg({ quality: 70, progressive: true })
      .resize(1200)
      .toBuffer()

    const imageThumbData = await sharp(res.buffer)
      .jpeg({ quality: 70, progressive: true })
      .resize(200, 200)
      .toBuffer()

    const file = new Parse.File('image.jpg', {
      base64: imageResizedData.toString('base64')
    })

    const thumb = new Parse.File('image.jpg', {
      base64: imageThumbData.toString('base64')
    })

    await Promise.all([ file.save(), thumb.save() ])

    obj.set('image', file)
    obj.set('imageThumb', thumb)
  }

})