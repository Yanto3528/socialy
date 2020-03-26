const express = require("express");
const {
  register,
  login,
  getUser,
  getUserById,
  updateUser,
  getUsers,
  followAndUnfollow,
  getNearbyUsers,
  uploadProfilePhoto
} = require("../controllers/users");

const { protect } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const User = require("../models/User");

const router = express.Router();

router.get("/", advancedResults(User), protect, getUsers);
router.get("/:id/profile", protect, getUserById);
router.get("/me", protect, getUser);
router.get("/radius/:city/:distance", protect, getNearbyUsers);
router.post("/register", register);
router.post("/login", login);
router.put("/:id/follow", protect, followAndUnfollow);
router.put("/", protect, updateUser);
router.put("/photo/:type", protect, uploadProfilePhoto);

module.exports = router;
