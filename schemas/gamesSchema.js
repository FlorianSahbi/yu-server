/* eslint-disable max-len */
const mongoose = require('mongoose');
const { roundsSchema } = require('./roundsSchema');

const gamesSchema = new mongoose.Schema({
  name: { type: String, default: "Yu's game" },
  goal: { type: Number, default: 100 },
  trackTime: { type: Number, default: 10000 },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild' },
  history: [roundsSchema],
}, { timestamps: true });

const Game = mongoose.model('Game', gamesSchema);

module.exports = Game;
