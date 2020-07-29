const express = require('express')
const auth = require('../middlewares/auth')
const admin = require('../middlewares/admin')

const router = express.Router()

router.get('/', auth, (req, res) => {
    res.redirect(req.baseUrl + '/login')
})

router.get('/login', auth, (req, res) => {
    res.render('login')
})

router.post('/login', auth, async (req, res) => {

    try {

        const username = req.body.username || ''
        const password = req.body.password || ''

        const query = new Parse.Query(Parse.Role)
        query.containedIn('name', ['Admin','Vendor'])

        const innerQuery = new Parse.Query(Parse.User)
        innerQuery.equalTo('username', username)
       query.matchesQuery('users', innerQuery)
       const userd = await innerQuery.find({ useMasterKey: true })

      // query.equalTo('users', userd);
       const isAdmin = await query.first({ useMasterKey: true })
       


       console.log(isAdmin)
console.log(userd[0].id)
        if (!isAdmin) {
           
         
             
            
         
             await role.save()
            throw new Parse.Error(5000, 'Not Authorizedd')
        }




        const { data } = await Parse.Cloud.httpRequest({
            method: 'POST',
            url: `http://localhost:${process.env.PORT}${process.env.PARSE_SERVER_MOUNT}/login`,
            headers: {
                'X-Parse-Application-Id': process.env.APP_ID,
                'X-Parse-Revocable-Session': 1,
            },
            body: { username, password }
        })
        console.log(data)

       if(data.type.toLowerCase() == "vendor" )
       {
           if(!data.isApproved )
           {
            throw new Parse.Error(5000, 'Admin has not approved you yet')
           }
       }

        req.session.user = data
        req.session.token = data.sessionToken



        res.redirect('/admin')

    } catch (error) {

        if (error instanceof Parse.Error) {
            console.log(error.message)
            res.render('login', {
                flash: error.message
            })
        } else {
           // console.log(error.data.error)
            res.render('login', {
                flash: error.data.error
            })
        }
        
    }
})

router.get('/reset-password', auth, (req, res) => {
    res.render('reset-password')
})

router.get('/logout', admin, (req, res) => {
    req.session = null
    res.redirect('login')
})

router.get('/success', auth, (req, res) => {
    res.render('success')
})

module.exports = router