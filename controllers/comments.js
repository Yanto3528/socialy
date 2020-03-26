const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

//@desc       Get all Comments
//@desc       Get all Comments associated with a post
//@route      GET /api/comments/:postId
//@access     Private
exports.getComments = asyncHandler(async (req, res, next) => {
  if (req.params.postId) {
    const comments = await Comment.find({ post: req.params.postId }).populate({
      path: "user",
      select: "name avatar"
    });
    res
      .status(200)
      .json({ success: true, count: comments.length, data: comments });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

//@desc       Create new comment
//@route      POST /api/comments/:postId
//@access     Private
exports.addComment = asyncHandler(async (req, res, next) => {
  req.body.post = req.params.postId;
  req.body.user = req.user.id;

  let comment = await Comment.create(req.body);

  comment = await Comment.findById(comment._id).populate({
    path: "user",
    select: "name avatar"
  });

  res.status(200).json({ success: true, data: comment });
});

//@desc       Update comment
//@route      PUT /api/comments/:id
//@access     Private
exports.updateComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(
      new ErrorResponse(`No comment with id of ${req.params.id}`, 404)
    );
  }

  // Make that user own this profile
  if (comment.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to update this comment`, 401)
    );
  }

  comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate({
    path: "user",
    select: "name avatar"
  });

  res.status(200).json({ success: true, data: comment });
});

//@desc       Delete comment
//@route      DELETE /api/comments/:id
//@access     Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(
      new ErrorResponse(`No comment with id of ${req.params.id}`, 404)
    );
  }

  // Make that user own this profile
  if (comment.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to delete this comment`, 401)
    );
  }

  await comment.remove();

  res.status(200).json({ success: true, data: {} });
});
