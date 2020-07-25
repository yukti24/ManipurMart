

const Parse = require('parse/node')
const moment = require('moment')

Parse.initialize(process.env.APP_ID, '', process.env.MASTER_KEY)
Parse.serverURL = process.env.PUBLIC_SERVER_URL + process.env.PARSE_SERVER_MOUNT

module.exports = async () => {

  try {

    const date = moment().utc().toDate()

    const query = new Parse.Query('Cart')
    query.equalTo('status', 'active')
    query.notEqualTo('items', [])
    query.exists('expiresAt')
    query.lessThanOrEqualTo('expiresAt', date)
    query.doesNotExist('deletedAt')

    const carts = await query.find({ useMasterKey: true })

    if (!carts.length) return 'No carts to process'

    for (const cart of carts) {

      cart.set('status', 'expired')
      cart.unset('expiresAt')
      cart.set('items', [])
      cart.set('subtotal', 0)
      cart.set('total', 0)
      await cart.save(null, { useMasterKey: true })
    }

    return 'Carts expired: ' + carts.length

  } catch (error) {
    return new Error(error.message)
  }
}