/* eslint-disable max-len */
const mongoose = require("mongoose");
const { roundsSchema } = require("./roundsSchema");

const gamesSchema = new mongoose.Schema({
  name: { type: String, default: "Yu's game" },
  points: { type: Number, default: 100 },
  trackTime: { type: Number, default: 10000 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  history: [roundsSchema],
}, { timestamps: true });

const Game = mongoose.model("Game", gamesSchema);

module.exports = Game;
