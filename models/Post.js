const mongoose = require("mongoose");

const PostSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    description: {
      type: String,
      required: [true, "Please add a description"]
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User"
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

PostSchema.pre("remove", async function(next) {
  await this.model("Comment").deleteMany({ post: this._id });
  next();
});

PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  justOne: false
});

module.exports = mongoose.model("Post", PostSchema);
