const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Post = require("../models/Post");
const User = require("../models/User");

//@desc       Get all Post
//@route      GET /api/posts
//@access     Private
exports.getPosts = asyncHandler(async (req, res, next) => {
  if (req.query.following) {
    const user = await User.findById(req.user.id);
    user.following.push(req.user.id);
    const posts = await Post.find({
      user: user.following
    })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name avatar"
        }
      })
      .populate({
        path: "user",
        select: "name avatar"
      })
      .sort("-createdAt");
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  }
  res.status(200).json(res.advancedResults);
});

//@desc       Create new post
//@route      POST /api/posts
//@access     Private
exports.addPost = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;
  let post = await Post.create(req.body);
  post = await Post.findById(post._id)
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "name avatar"
      }
    })
    .populate({
      path: "user",
      select: "name avatar"
    });

  res.status(200).json({
    success: true,
    data: post
  });
});

//@desc       Update post
//@route      PUT /api/posts/:id
//@access     Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`No post with id of ${req.params.id}`, 404));
  }

  // Make that user own this profile
  if (post.user._id.toString() !== req.user.id) {
    return next(new ErrorResponse(`Not authorized to update this post`, 401));
  }
  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "name avatar"
      }
    })
    .populate({
      path: "user",
      select: "name avatar"
    });

  res.status(200).json({ success: true, data: post });
});

//@desc       Delete post
//@route      DELETE /api/posts/:id
//@access     Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`No post with id of ${req.params.id}`, 404));
  }

  // Make that user own this profile
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Not authorized to delete this post`, 401));
  }

  await post.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

//@desc       Like post
//@route      PUT /api/posts/:id/like
//@access     Private
exports.likePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id)
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "name avatar"
      }
    })
    .populate({
      path: "user",
      select: "name avatar"
    });

  if (!post) {
    return next(new ErrorResponse(`No post with id of ${req.params.id}`, 404));
  }

  // Check if user already liked the post, if yes then unlike the post
  if (post.likes.includes(req.user.id)) {
    const userIndex = post.likes.indexOf(req.user.id);
    post.likes.splice(userIndex, 1);
    await post.save();
    return res.status(200).json({ success: true, data: post });
  }

  // Like the post
  post.likes.push(req.user.id);
  await post.save();

  res.status(200).json({
    success: true,
    data: post
  });
});
