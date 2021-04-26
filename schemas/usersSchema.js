const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  discordId: { type: String, unique: true },
  playCount: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model("User", usersSchema);

module.exports = User;
