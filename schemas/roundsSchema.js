/* eslint-disable max-len */
const mongoose = require("mongoose");
const { ranksSchema } = require("./ranksSchema");

const roundsSchema = new mongoose.Schema({
  position: Number,
  track: { type: mongoose.Schema.Types.ObjectId, ref: "Track" },
  ranks: [ranksSchema],
}, { timestamps: true });

const Round = mongoose.model("Round", roundsSchema);

module.exports = { Round, roundsSchema };
