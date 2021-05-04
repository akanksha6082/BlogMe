const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Blog = require('../models/blog');
const ExpressError = require('../utils/ExpressError');
const { blogSchema, reviewSchema } = require('../schemas');

router.route('/').get( async(req, res) =>{
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    else{
        const blogs = await Blog.find({});
        res.render('blogs/index', { blogs })
    }
   
})


router.route('/').post(async(req, res) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    
    const { error } = blogSchema.validate(req.body);
    
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
       
    }

    const blog = new Blog(req.body.blog);
    blog.author = req.user._id;
    await blog.save();
    req.flash('success', 'Successfully added a new blog!');
    res.redirect(`/blogs/${blog._id}`)

})

router.route('/new').get((req, res) =>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    res.render('blogs/new');
})

router.route('/:id').get(async(req, res) =>{
    const blog = await Blog.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/show', { blog });
})

router.route('/:id').put(async(req, res)=>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }

    var { id } = req.params;
    var blog = await Blog.findById(id);
    if (!blog.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/blogs/${id}`);
    }
    
    const { error } = blogSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }

    var { id } = req.params;
    var blog = await Blog.findByIdAndUpdate(id, { ...req.body.blog });
    req.flash('success', 'Successfully updated blog!');
    res.redirect(`/blogs/${blog._id}`)
})

router.route("/:id").delete(async(req, res)=>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    var { id } = req.params;
    var blog = await Blog.findById(id);
    if (!blog.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/blogs/${id}`);
    }
    var { id } = req.params;
    await Blog.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted blog')
    res.redirect('/blogs');
})

router.route('/:id/edit').get(async(req, res) =>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    var { id } = req.params;
    var blog = await Blog.findById(id);
    if (!blog.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/blogs/${id}`);
    }
    var { id } = req.params;
    var blog = await Blog.findById(id)
    if (!blog) {
        req.flash('error', 'Cannot find that blog!');
        return res.redirect('/blogs');
    }
    res.render('blogs/edit', { blog });
})

module.exports = router;