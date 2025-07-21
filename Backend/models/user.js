const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, required: true, default: "user" },
    profileImage: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    previousPasswords: { type: [String], default: [] },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    orderedItems: [{
      productId: { type: Schema.Types.ObjectId, ref: "BeautyProduct", required: true }
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
