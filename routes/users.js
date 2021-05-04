const express = require('express');
const router  = express.Router();
const User = require('../models/user');
const passport = require('passport');
const Blog = require('../models/blog');
const blog_populate = require('../utils/populate');


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

router.route('/report').get( async(req, res) => {

    const user_id = req.user._id;
    var blog_list = [];
    var email = "";
    var username = "";

    User.findById(user_id).then(user=>{
        if(user){
            email = user.email;
            username = user.username;
        }
    })

    const blogs = await Blog.find({author : user_id});

    for(var i =0; i < blogs.length; i++){
        const updatedblog = await blog_populate(blogs[i]._id);
        blog_list.push(updatedblog);
    }
    var trend_sum = 0;
    var trending = [];
    for(var i =0; i < blog_list.length; i++){
        var rating = [];
        var sum = 0;

        for(var j =0; j<blog_list[i].reviews.length; j++){
            var rate = blog_list[i].reviews[j].rating;
            rating.push(rate);
            sum += rate;
        }

        if(rating.length != 0){
            console.log("sum :", sum);
            var avg = sum / rating.length;
    
            var max = rating.reduce((a, b) => Math.max(a,b));
            var min = rating.reduce((a, b) => Math.min(a,b));
    
            blog_list[i].max_rating = max;
            blog_list[i].min_rating = min;
            blog_list[i].avg_rating = avg;

            var trend = (avg * 0.60 + rating.length * 0.40 ) / 2;
            trending.push(trend);
            trend_sum += trend;
    
        }
        else{
           
            blog_list[i].max_rating = 0;
            blog_list[i].min_rating = 0;
            blog_list[i].avg_rating = 0;
        }
    }

    var trend_max = trend_sum / blog_list.length;

    res.render('users/report', {blog_list : blog_list, email : email, username : username, trend_max : trend_max});

})


router.route('/search').post(async (req, res) => {
    const author_name = req.body.search;
    var user= await User.findOne({username : author_name});
    if(user){
        var user_id = user._id;
    }
    else{
        res.send(`<h1>No Blogs by Author - ${author_name}</h1><br><button><a href="/blogs">GO TO HOME</a></button>`);
    }
     
    console.log("user :", user_id);
    const blogs = await Blog.find({author : user_id});
    res.render('blogs/search', { blogs })
})

router.route('/myblogs').get(async(req, res) => {
    const user_id = req.user._id;
    const blogs = await Blog.find({author : user_id})
    res.render('blogs/userblog', {blogs})
})

module.exports  = router;
