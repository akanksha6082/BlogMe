const express = require('express');
const router  = express.Router();
const User = require('../models/user');
const passport = require('passport');

router.route('/login').get((req, res) =>{
    res.render('users/login');
});

router.route('/register').get((req, res) =>{
    res.render('users/register');
});

router.route('/login').post(passport.authenticate('local', { successRedirect: '/blogs', failureFlash: true, failureRedirect: '/login' }), async(req, res) =>{
    req.flash('success', 'welcome back!');
    const redirectUrl = req.session.returnTo || '/blogs';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});

router.route('/register').post(async(req, res) =>{
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/blogs');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
});

router.get('/logout', (req, res) =>{
    req.logout();
    res.redirect('/blogs');
})

module.exports  = router;
