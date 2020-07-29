const express = require('express')
const vendor = require('../middlewares/vendor')
const router = express.Router()

const smsClient = require("../helpers/sendsms");
//const File = require("../public/scripts/services/FileUploadService")
var isUploading = false;
var photo ;
router.get('/', vendor, (req, res) => {
  res.render('vendor')
})

uploadImage = function (file) {

  if (file) {
console.log("cvc");
    isUploading = true;

    File.upload(file).then(function(savedFile) {
      photo = savedFile;
      isUploading = false;
     // $scope.$apply();
    }, function(error) {

      //Toast.show(error.message);
       isUploading = false;
     // $scope.$apply();
    });
  }
}


router.post('/', vendor, async (req, res) => {
  console.log(req) ;
  console.log(req.files) ;
  console.log(req.username);

  const name = req.body.name.trim()
  const username = req.body.username.toLowerCase().trim()
  const email = req.body.email.toLowerCase().trim()
  const mobile = req.body.mobile.toLowerCase().trim()
  const password = req.body.password.trim()
  const passwordConfirmation = req.body.passwordConfirmation.trim()

  

   console.log(req.username);

  if (!name) {
    return res.render('vendor', {
      flash: 'Name is required',
      input: req.body
    })
  }

  if (!username) {
    return res.render('vendor', {
      flash: 'Username is required',
      input: req.body
    })
  }

  if (!email) {
    return res.render('vendor', {
      flash: 'Email is required',
      input: req.body
    })
  }
  if (!mobile) {
    return res.render('vendor', {
      flash: 'Mobile is required',
      input: req.body
    })
  }

  if (password !== passwordConfirmation) {
    return res.render('vendor', {
      flash: "Password doesn't match",
      input: req.body
    })
  }

  if (password.length < 6) {
    return res.render('vendor', {
      flash: 'Password should be at least 6 characters',
      input: req.body
    })
  }

  if (req.body.image) {
    console.log("cvc");
        isUploading = true;
    
        Parse.File(name || 'image.jpg', file).save();


      }


  try {

   
    

    const otp = Math.floor(Math.random() * 899999 + 100000).toString()

    const user = new Parse.User()
    user.set('name', name)
    user.set('username', username)
    user.set('email', email)
    user.set('mobile', mobile)
    user.set('ismobileVerified', false)
    user.set('smsOtp', otp)

    user.set('password', password)
    user.set('type', 'vendor')
   var permiss = [
    "items",
    "brands",
    "orders"
  ]

    
      user.set('permissions', permiss)
      user.set('isApproved', false)
      user.set('isPrimary', false)

    const acl = new Parse.ACL()
    acl.setPublicReadAccess(true)
    acl.setPublicWriteAccess(false)
   // user.setACL(acl)

   // await user.save(null, { useMasterKey: true })

   
   //  const query1 = new Parse.Query(Parse.Role)
  //query1.equalTo('name', 'Vendor')
  //const role = await query1.first()
//console.log(role)
//console.log(user)
  //role.getUsers().add(user)
 // await role.save(null, { useMasterKey: true })
 

   


    //req.session.user = user.toJSON()
    //req.session.token = user.getSessionToken()
   // res.redirect('/auth/success')
    
  } catch (error) {
    res.render('vendor', {
      flash: error.message,
      input: req.body
    })
  }

})

module.exports = router