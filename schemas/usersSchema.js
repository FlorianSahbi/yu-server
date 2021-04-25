const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Track" }],
  discordId: { type: String, unique: true },
  gamesCpt: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model("User", usersSchema);

module.exports = User;
