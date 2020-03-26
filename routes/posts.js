const express = require("express");
const {
  getPosts,
  addPost,
  updatePost,
  deletePost,
  likePost
} = require("../controllers/posts");

const { protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Post = require("../models/Post");

const router = express.Router();

router.get(
  "/",
  protect,
  advancedResults(
    Post,
    {
      path: "comments",
      populate: {
        path: "user",
        select: "name avatar"
      }
    },
    {
      path: "user",
      select: "name avatar"
    }
  ),
  getPosts
);
router.post("/", protect, addPost);
router.put("/:id", protect, updatePost);
router.put("/:id/like", protect, likePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
