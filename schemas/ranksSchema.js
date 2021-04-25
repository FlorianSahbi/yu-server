/* eslint-disable max-len */
const mongoose = require("mongoose");

const ranksSchema = new mongoose.Schema({
  position: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  points: Number,
}, { timestamps: true });

const Rank = mongoose.model("Rank", ranksSchema);

module.exports = { Rank, ranksSchema };
