/* eslint-disable max-len */
const mongoose = require('mongoose');

const gamesSchema = new mongoose.Schema({
  name: {type: String, default: 'Yu\'s game'},
  points: {type: Number, default: 100},
  trackTime: {type: Number, default: 10000},
  history: [{
    song: {type: mongoose.Schema.Types.ObjectId, ref: 'Song'},
    position: Number,
    rank: [{player: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, position: Number, points: Number}, {index: true}],
  }],
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
  players: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
}, {timestamps: true});

const Game = mongoose.model('Game', gamesSchema);

module.exports = Game;
