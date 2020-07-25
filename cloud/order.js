const stripe = require('stripe')
const MailgunHelper = require('../helpers/mailgun').MailgunHelper
const Mailgen = require('mailgen')
const Utils = require('../utils')
const Review = require('../models/review')
const Item = require('../models/item')

Parse.Cloud.beforeSave('Order', async (req) => {

  const obj = req.object
  const attrs = obj.attributes
  const user = req.user

  if (!user && !req.master) throw 'Not Authorized'

  try {

    if (!obj.existed()) {
      const acl = new Parse.ACL()
      acl.setReadAccess(user, true)
      acl.setRoleReadAccess('Admin', true)
      acl.setRoleWriteAccess('Admin', true)
      acl.setRoleReadAccess('Vendor', true)
      acl.setRoleWriteAccess('Vendor', true)
      obj.setACL(acl)
      obj.set('customer', user)
      obj.set('status', 'Unpaid')

      const orderNo = await Utils.generateNextOrderNumber()
      if (!orderNo) throw 'Internal error'

      obj.set('number', orderNo)

      await user.fetch()

      if (user.get('status') === 'Banned') {
        throw new Parse.Error(1001, 'Your account has been blocked.')
      }

      const items = attrs.items.map(item => {
        item.className = 'Item'
        return Parse.Object.fromJSON(item, false)
      })

      const fetchedItems = await Parse.Object.fetchAll(items)

      const items1 = fetchedItems.map(fetchedItem => {

        const allowed = [
          'objectId',
          'name',
          'salePrice',
          'price',
          'featuredImage',
          'featuredImageThumb',
          'slug',
          'vendorid'
        ]

        const fetchedAttrs = fetchedItem.toJSON()

        const filtered = Object.keys(fetchedAttrs)
          .filter(key => allowed.includes(key))
          .reduce((obj, key) => {
            obj[key] = fetchedAttrs[key]
            return obj
          }, {})

        const item = attrs.items.find(item => item.objectId === filtered.objectId)

        filtered.variation = item.variation
        filtered.qty = item.qty
        filtered.amount = item.qty * (filtered.salePrice || item.price)

        return filtered
      })

      const subtotal = items1.reduce((total, item) => total + item.amount, 0)

      const shippingQuery = new Parse.Query('CustomerAddress')
      shippingQuery.include(['zone', 'subzone'])
      const shipping = await shippingQuery.get(attrs.shipping.id, {
        useMasterKey: true
      })

      obj.set('shipping', shipping.toJSON())

      let total = subtotal

      const shippingFee = shipping.get('subzone').get('fee') || 0
      total += shippingFee

      obj.set('subtotal', subtotal)
      obj.set('shippingFee', shippingFee)
      obj.set('total', total)

      if (attrs.paymentMethod === 'Card') {

        const card = attrs.card

        await card.fetch({
          useMasterKey: true
        })

        const queryConfig = new Parse.Query('AppConfig')
        const config = await queryConfig.first({
          useMasterKey: true
        })

        const stripeConfig = config.get('stripe')

        const stripeInstance = stripe(stripeConfig.secretKey)

        let chargeDescription = stripeConfig.chargeDescription
        chargeDescription = chargeDescription.replace('%CUSTOMER_NAME%', user.get('name'))
        chargeDescription = chargeDescription.replace('%ORDER_NUMBER%', orderNo)

        const charge = await stripeInstance.charges.create({
          amount: Math.round(total * 100),
          currency: stripeConfig.currency,
          description: chargeDescription,
          customer: user.get('stripeCustomerId'),
          capture: true,
          source: card.get('cardId')
        })

        obj.set('card', card.toJSON())
        obj.set('status', 'Paid')
        obj.set('charge', charge)

      }

    }

  } catch (error) {

    switch (error.type) {
      case 'StripeCardError':
        // A declined card error
        error.code = 1002
        break
      case 'StripeInvalidRequestError':
      case 'StripeAPIError':
      case 'StripeConnectionError':
      case 'StripeAuthenticationError':
      case 'StripeRateLimitError':
        error.code = 1003
        break
    }

    throw new Parse.Error(error.code, error.message)
  }

})

Parse.Cloud.afterSave('Order', async (req) => {

  let obj = req.object
  let attrs = obj.attributes
  const original = req.original
  const user = req.user

  // Send push notification to customer when order status changes

  if (obj.existed())

    try {

      const origAttrs = original.attributes

      if (obj.existed() && attrs.status !== origAttrs.status) {

        let pushQuery = new Parse.Query(Parse.Installation)
        pushQuery.equalTo('isPushEnabled', true)
        let innerPushQuery = new Parse.Query(Parse.User)
        innerPushQuery.equalTo('objectId', attrs.customer.id)
        pushQuery.matchesQuery('user', innerPushQuery)

        const query = new Parse.Query('AppConfig')
        const config = await query.first({
          useMasterKey: true
        })

        if (config && config.get('push') && config.get('push').orderStatusNotification) {

          const pushConfig = config.get('push')

          let pushMessage = pushConfig.orderStatusNotification
          pushMessage = pushMessage.replace('%STATUS%', attrs.status)
          pushMessage = pushMessage.replace('%ORDER_NUMBER%', attrs.number)

          let pushParams = {
            where: pushQuery,
            data: {
              alert: pushMessage,
              event: 'order',
              orderId: obj.id,
              sound: 'default'
            }
          }

          Parse.Push.send(pushParams, {
            useMasterKey: true
          })
        }
      }

    } catch (error) {
      // error
    }

  // clean cart...

  if (!obj.existed() && user) {

    try {

      let query = new Parse.Query('Cart')
      query.equalTo('customer', attrs.customer)
      let cart = await query.first({
        useMasterKey: true
      })
      if (cart) cart.destroy({
        useMasterKey: true
      })

    } catch (err) {
      // error
    }
  }

  // Send email notification to admin when a new new order is placed

  if (!obj.existed()) {

    try {

      const query = new Parse.Query('AppConfig')
      const config = await query.first({
        useMasterKey: true
      })
      const emailConfig = config.get('email')
      const adminConfig = config.get('admin')

      const fromAddress = emailConfig.fromAddress || process.env.MAILGUN_FROM_ADDRESS

      if (emailConfig && emailConfig.addressForNewOrders) {

        const data = attrs.items.map(item => {
          const row = {}
          row[__('EMAIL_ITEM_TITLE')] = item.qty + ' x ' + item.name + (item.variation ? ' (' + item.variation.name + ')' : '')
          row[__('EMAIL_ITEM_AMOUNT')] = Utils.formatCurrency(item.amount)
          return row
        })

        let title = emailConfig.titleNewOrder || __('EMAIL_TITLE_NEW_ORDER')
        title = title.replace('%ORDER_NUMBER%', attrs.number)
        title = title.replace('%ORDER_TOTAL%', Utils.formatCurrency(attrs.total))

        let body = emailConfig.bodyNewOrder || __('EMAIL_BODY_NEW_ORDER')
        body = body.replace('%SUBTOTAL%', Utils.formatCurrency(attrs.subtotal))
        body = body.replace('%SHIPPING_FEE%', Utils.formatCurrency(attrs.shippingFee))
        body = body.replace('%TOTAL%', Utils.formatCurrency(attrs.total))
        body = body.replace(/\n/g, '<br />');

        const email = {
          body: {
            title: title,
            signature: false,
            table: {
              data: data,
            },
            action: {
              instructions: '',
              button: {
                text: __('EMAIL_VIEW_ORDERS_BUTTON'),
                link: process.env.PUBLIC_SERVER_URL + '/admin/orders'
              }
            },
            outro: body
          }
        }

        email.body.table.columns = { customWidth: {}, customAlignment: {} }
        email.body.table.columns.customWidth[__('EMAIL_ITEM_AMOUNT')] = '15%'
        email.body.table.columns.customAlignment[__('EMAIL_ITEM_AMOUNT')] = 'right'

        const mailgunHelper = new MailgunHelper({
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN,
          host: process.env.MAILGUN_HOST,
        })

        const mailGenerator = new Mailgen({
          theme: 'default',
          product: {
            name: process.env.APP_NAME,
            link: process.env.MAILGUN_PUBLIC_LINK,
            logo: adminConfig.logo ? adminConfig.logo.url() : '',
            copyright: __('EMAIL_COPYRIGHT')
          }
        })

        let subject = emailConfig.subjectForNewOrders || __('EMAIL_SUBJECT_NEW_ORDER')
        subject = subject.replace('%ORDER_NUMBER%', attrs.number)
        subject = subject.replace('%ORDER_TOTAL%', Utils.formatCurrency(attrs.total))

        mailgunHelper.send({
          subject: subject,
          from: fromAddress,
          to: emailConfig.addressForNewOrders,
          html: mailGenerator.generate(email),
        })

      }

    } catch (err) {
      console.log(err);
    }

    // Send order confirmation to customer

    try {

      const query = new Parse.Query('AppConfig')
      const config = await query.first({
        useMasterKey: true
      })

      const emailConfig = config.get('email')
      const adminConfig = config.get('admin')

      const fromAddress = emailConfig.fromAddress || process.env.MAILGUN_FROM_ADDRESS

      await attrs.customer.fetch({ useMasterKey: true })

      const customerEmail = attrs.contact.email
      const customerName = attrs.customer.get('name') || customerEmail

      const data = attrs.items.map(item => {
        const row = {}
        row[__('EMAIL_ITEM_TITLE')] = item.qty + ' x ' + item.name + (item.variation ? ' (' + item.variation.name + ')' : '')
        row[__('EMAIL_ITEM_AMOUNT')] = Utils.formatCurrency(item.amount)
        return row
      })

      let title = emailConfig.titleOrderConfirmation || __('EMAIL_TITLE_ORDER_CONFIRMATION')
      title = title.replace('%ORDER_NUMBER%', attrs.number)
      title = title.replace('%ORDER_TOTAL%', Utils.formatCurrency(attrs.total))

      let body = emailConfig.bodyOrderConfirmation || __('EMAIL_BODY_ORDER_CONFIRMATION')
      body = body.replace('%SUBTOTAL%', Utils.formatCurrency(attrs.subtotal))
      body = body.replace('%SHIPPING_FEE%', Utils.formatCurrency(attrs.shippingFee))
      body = body.replace('%TOTAL%', Utils.formatCurrency(attrs.total))
      body = body.replace(/\n/g, '<br />');

      const email = {
        body: {
          name: customerName,
          signature: false,
          intro: title,
          table: {
            data: data,
          },
          outro: body
        }
      }

      email.body.table.columns = { customWidth: {}, customAlignment: {} }
      email.body.table.columns.customWidth[__('EMAIL_ITEM_AMOUNT')] = '15%'
      email.body.table.columns.customAlignment[__('EMAIL_ITEM_AMOUNT')] = 'right'

      const mailgunHelper = new MailgunHelper({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        host: process.env.MAILGUN_HOST,
      })

      const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
          name: process.env.APP_NAME,
          link: process.env.MAILGUN_PUBLIC_LINK,
          logo: adminConfig.logo ? adminConfig.logo.url() : '',
        }
      })

      let subject = emailConfig.subjectOrderConfirmation || __('EMAIL_SUBJECT_ORDER_CONFIRMATION')
      subject = subject.replace('%ORDER_NUMBER%', attrs.number)
      subject = subject.replace('%ORDER_TOTAL%', Utils.formatCurrency(attrs.total))

      mailgunHelper.send({
        from: fromAddress,
        to: customerEmail,
        subject: subject,
        html: mailGenerator.generate(email),
      })

    } catch (err) {
      console.log(err)
    }

  }

})

Parse.Cloud.define('markOrdersAsSeen', async (req) => {

  const user = req.user

  const isAdmin = await Utils.isAdmin(user)
  if (!isAdmin && !req.master) throw 'Not Authorized'

  const query = new Parse.Query('Order')
  query.notEqualTo('views', user)

  const orders = await query.find({ useMasterKey: true })

  const promises = orders.map(order => {
    const relation = order.relation('views')
    relation.add(user)
    return order.save(null, {
      useMasterKey: true
    })
  })

  return await Promise.all(promises)
})

Parse.Cloud.define('markOrderAsDelivered', async (req) => {

  const params = req.params
  const user = req.user

  if (!user && !req.master) throw 'Not Authorized'

  const query = new Parse.Query('Order')
  const order = await query.get(params.id, {
    useMasterKey: true
  })

  if (user.id !== order.get('customer').id) {
    throw 'Invalid customer'
  }

  if (order.get('status') !== 'Shipped Out') {
    throw 'Invalid status'
  }

  order.set('status', 'Delivered')

  return await order.save(null, {
    useMasterKey: true
  })

})

Parse.Cloud.define('reviewOrderItem', async (req) => {

  const params = req.params
  const user = req.user

  if (!user && !req.master) throw 'Not Authorized'

  const query = new Parse.Query('Order')
  const order = await query.get(params.id, {
    useMasterKey: true
  })

  if (user.id !== order.get('customer').id) {
    throw 'Invalid customer'
  }

  const items = order.get('items')

  const item = items.find(item => item.objectId === params.itemId)

  if (!item) {
    throw 'Item not found'
  }

  const itemObj = new Item
  itemObj.id = params.itemId

  const review = new Review

  review.rating = params.rating
  review.comment = params.comment
  review.order = order
  review.item = itemObj

  await review.save(null, {
    sessionToken: user.getSessionToken()
  })

  item.rating = params.rating

  await order.save(null, {
    useMasterKey: true
  })

  return order

})