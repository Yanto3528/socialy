const express = require("express");
const {
  getComments,
  addComment,
  updateComment,
  deleteComment
} = require("../controllers/comments");

const { protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const Comment = require("../models/Comment");

const router = express.Router();

router.get(
  "/",
  protect,
  advancedResults(Comment, {
    path: "user"
  }),
  getComments
);
router.get("/:postId", protect, getComments);
router.post("/:postId", protect, addComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;
