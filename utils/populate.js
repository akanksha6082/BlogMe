const mongoose = require('mongoose');
const Blog = require('../models/blog');

const blog_populate = async (id) => {
    const newblog = await Blog.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');

    return newblog;
}

module.exports = blog_populate;