/* eslint-disable max-len */
const mongoose = require("mongoose");
const { ranksSchema } = require("./ranksSchema");

const roundsSchema = new mongoose.Schema({
  position: Number,
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
  rank: [ranksSchema],
}, { timestamps: true });

const Round = mongoose.model("Round", roundsSchema);

module.exports = { Round, roundsSchema };
