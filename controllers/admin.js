const express = require('express')
const admin = require('../middlewares/admin')
const permission = require('../middlewares/permission')

const router = express.Router()

router.get('/', admin, (req, res) => {
  res.redirect(req.baseUrl + '/welcome')
})

router.get('/welcome', admin, (req, res) => {
  res.render('welcome')
})

router.get('/not-authorized', admin, (req, res) => {
  res.render('not-authorized')
})

router.get('/users', admin, permission('users'), (req, res) => {
  res.render('users', { type: 'admin' })
})
router.get('/vendors', admin, permission('vendors'), (req, res) => {
  res.render('vendors', { type: 'vendor' })
})
router.get('/customers', admin, permission('customers'), (req, res) => {
  res.render('users', { type: 'customer' })
})

router.get('/items', admin, permission('items'), (req, res) => {
  res.render('items')
})

router.get('/orders', admin, permission('orders'), (req, res) => {
  res.render('orders')
})

router.get('/slide-images', admin, permission('slide_images'), (req, res) => {
  res.render('slide-images')
})

router.get('/zones', admin, permission('zones'), (req, res) => {
  res.render('zones')
})

router.get('/categories', admin, permission('categories'), (req, res) => {
  res.render('categories')
})

router.get('/subcategories', admin, permission('subcategories'), (req, res) => {
  res.render('sub-categories')
})

router.get('/notifications', admin, permission('notifications'), (req, res) => {
  res.render('notifications')
})

router.get('/profile', admin,  (req, res) => {
  res.render('profile')
})

router.get('/reviews', admin, permission('reviews'), (req, res) => {
  res.render('reviews')
})

router.get('/brands', admin, permission('brands'), (req, res) => {
  res.render('brands')
})

router.get('/pages', admin, permission('pages'), (req, res) => {
  res.render('pages')
})

module.exports = router