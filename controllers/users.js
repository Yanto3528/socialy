const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const path = require("path");
const geocoder = require("../utils/geocoder");

//@desc       Get all user
//@route      GET /api/users
//@access     Private
exports.getUsers = asyncHandler(async (req, res, next) => {
  if (req.query.query) {
    const users = await User.find({
      $and: [
        {
          _id: { $ne: req.user.id }
        },
        {
          $or: [{ name: { $regex: req.query.query, $options: "i" } }]
        }
      ]
    });
    res.status(200).json({
      success: true,
      data: users
    });
  } else if (req.query.following || req.query.followers) {
    const user = await User.findById(req.query.id);
    const query = req.query.following ? user.following : user.followers;
    const users = await User.find({
      _id: query
    });
    res.status(200).json({
      success: true,
      data: users
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

//@desc       Get single user
//@route      GET /api/users/:id
//@access     Private
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User does not exists`));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

//@desc       Register a user
//@route      POST /api/users/register
//@access     Public
exports.register = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    return next(new ErrorResponse("User already exists", 400));
  }

  const newUser = await User.create(req.body);

  const token = newUser.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});

//@desc       Login User
//@route      POST /api/users/login
//@access     Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse(`Wrong email or password`, 401));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse(`Wrong email or password`, 401));
  }

  const token = user.getSignedJwtToken();

  res.status(200).json({ success: true, token });
});

//@desc       Get logged in user
//@route      GET /api/users/me
//@access     Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, data: user });
  next();
});

//@desc       Update User
//@route      PUT /api/users
//@access     Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.user.id}`, 404)
    );
  }

  // Make that user own this user
  if (user._id.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to update this profile`, 401)
    );
  }

  user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
});

//@desc       Upload photo
//@route      PUT /api/users/photo/:type
//@access     Private
exports.uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a photo`, 404));
  }

  const file = req.files.file;

  // Make sure the file is an image file
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 404));
  }

  // Make sure the file doesn't exceed the max file upload
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        404
      )
    );
  }

  // Change the file name
  file.name = `photo_${Date.now().toString()}${path.parse(file.name).ext}`;
  // Store the file name in public/uploads folder
  const filePath = `${process.env.FILE_UPLOAD_PATH}/${
    req.params.type === "avatar" ? "avatars" : "images"
  }/${file.name}`;
  file.mv(filePath, async err => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with upload`, 500));
    }
    const updateType =
      req.params.type === "avatar"
        ? {
            avatar: file.name
          }
        : {
            cover: file.name
          };
    const user = await User.findByIdAndUpdate(req.user.id, updateType, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  });
});

//@desc       Get nearby users
//@route      GET /api/users/radius/:city/:distance
//@access     Private
exports.getNearbyUsers = asyncHandler(async (req, res, next) => {
  const { city, distance } = req.params;

  // Calculate radius by dividing distance with earth radius = 6371 km
  const radius = distance / 3963;
  const loc = await geocoder.geocode({ address: city });
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Find the profiles using centerSphere
  const users = await User.find({
    $and: [
      {
        _id: { $ne: req.user.id }
      },
      {
        $or: [
          { location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } }
        ]
      }
    ]
  });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

//@desc       Follow a user
//@route      PUT /api/users/:id/follow
//@access     Private
exports.followAndUnfollow = asyncHandler(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  if (!targetUser) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // If the user already followed the target, then unfollow
  if (targetUser.followers && targetUser.followers.includes(req.user.id)) {
    // Get the target user index
    const targetUserIndex = targetUser.followers.indexOf(req.user.id);
    // Get current user index
    const currentUserIndex = currentUser.following.indexOf(targetUser._id);
    // Remove current user from the followers of the target user
    targetUser.followers.splice(targetUserIndex, 1);
    // Remove target user from the current user following
    currentUser.following.splice(currentUserIndex, 1);
    await targetUser.save();
    await currentUser.save();
    return res.status(200).json({ success: true, data: currentUser });
  }

  // Follow the target
  targetUser.followers.push(req.user.id);
  currentUser.following.push(targetUser._id);

  await targetUser.save();
  await currentUser.save();

  res.status(200).json({ success: true, data: currentUser });
});
