const sharp = require('sharp')
const Utils = require('../utils')

Parse.Cloud.beforeSave('SlideImage', async (req) => {

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

  if (!obj.dirty('image') || !obj.get('image')) {
    return
  }

  const { buffer } = await Parse.Cloud.httpRequest({
    url: attrs.image.url()
  })

  const imageResizedData = await sharp(buffer)
    .jpeg({ quality: 70, progressive: true })
    .resize(1200)
    .toBuffer()

  const imageThumbData = await sharp(buffer)
    .jpeg({ quality: 70, progressive: true })
    .resize(200, 200)
    .toBuffer()

  const file = new Parse.File('image.jpg', {
    base64: imageResizedData.toString('base64')
  })

  const thumb = new Parse.File('image.jpg', {
    base64: imageThumbData.toString('base64')
  })

  await Promise.all([file.save(), thumb.save()])

  obj.set('image', file)
  obj.set('imageThumb', thumb)

})