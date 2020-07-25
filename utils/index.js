const stripe = require('stripe')

function Utils() { }

Utils.isAdmin = function (user) {
  const query = new Parse.Query(Parse.Role)
  query.containedIn('name', ['Admin','Vendor'])
  query.equalTo('users', user)
  //console.log(query.first())

  //const innerQuery = new Parse.Query(Parse.User)
  //innerQuery.equalTo('username', username)
  // query.matchesQuery('users', innerQuery)
  
 //const userRoleQuery = user.relation(Parse.Role).query();
 //const role = await userRoleQuery.find().first();
  

  return query.first()
};

Utils.formatCurrency = function (value) {
  return value.toLocaleString(process.env.CURRENCY_LOCALE, {
    style: 'currency',
    currency: process.env.CURRENCY,
    currencyDisplay: process.env.CURRENCY_DISPLAY
  })
}

Utils.getConfig = async function () {
  const query = new Parse.Query('AppConfig')
  return await query.first({
    useMasterKey: true
  })
};

Utils.generateNextOrderNumber = async function () {

  try {
    const query = new Parse.Query('OrderCount')
    let obj = await query.first({ useMasterKey: true })
    obj = obj || new Parse.Object('OrderCount')
    obj.increment('count')
    await obj.save(null, { useMasterKey: true })
    return obj.attributes.count
  } catch (error) {
    return null
  }

};

Utils.createOrGetStripeCustomerId = async function (user) {
  try {

    await user.fetch()

    if (user.get('stripeCustomerId')) {
      return user.get('stripeCustomerId')
    }

    const queryConfig = new Parse.Query('AppConfig')
    const config = await queryConfig.first({
      useMasterKey: true
    })

    const stripeConfig = config.get('stripe')

    const stripeInstance = stripe(stripeConfig.secretKey)

    const customer = await stripeInstance.customers.create({
      email: user.get('email'),
      description: `Customer for ${user.get('username')}`
    })

    user.set('stripeCustomerId', customer.id)

    await user.save(null, {
      useMasterKey: true
    })

    return user.get('stripeCustomerId')

  } catch (error) {
    return null
  }
};

module.exports = Utils;