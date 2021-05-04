const express = require('express');
const router = express.Router({ mergeParams: true });
const Blog = require('../models/blog');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('../schemas');

router.post("/", async(req, res) =>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    const blog = await Blog.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    blog.reviews.push(review);
    await review.save();
    await blog.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/blogs/${blog._id}`);
})

router.delete('/:reviewId', async(req, res) =>{
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }

    var { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/blogs/${id}`);
    }

    var { id, reviewId } = req.params;
    await Blog.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review')
    res.redirect(`/blogs/${id}`);
})

module.exports = router;