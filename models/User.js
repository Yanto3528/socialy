const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const geocoder = require("../utils/geocoder");

const UserSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email"
      ]
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false
    },
    avatar: {
      type: String,
      default: "no-photo.jpg"
    },
    name: {
      type: String,
      trim: true,
      required: [true, "Please add a name"]
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please select either male or female"]
    },
    birthday: {
      type: Date
    },
    cover: {
      type: String,
      default: "no-cover.jpg"
    },
    jobTitle: {
      type: String
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User"
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User"
    },
    address: {
      type: String,
      required: [true, "Please add an address"]
    },
    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number],
        index: "2dsphere"
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please add a valid URL with HTTP or HTTPS"
      ]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
);

// Convert user address to geo location
UserSchema.pre("save", async function(next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };
  next();
});

// Encrypt user password to database
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match plain text password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "user",
  justOne: true
});

UserSchema.virtual("notifications", {
  ref: "Notification",
  localField: "_id",
  foreignField: "user",
  justOne: false
});

module.exports = mongoose.model("User", UserSchema);
