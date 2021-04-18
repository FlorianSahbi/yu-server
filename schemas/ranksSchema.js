/* eslint-disable max-len */
const mongoose = require('mongoose');

const ranksSchema = new mongoose.Schema({
  position: Number,
  points: Number,
  player: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
}, {timestamps: true});

const Rank = mongoose.model('Rank', ranksSchema);

module.exports = {Rank, ranksSchema};
