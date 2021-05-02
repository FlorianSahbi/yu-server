/* eslint-disable max-len */
const mongoose = require('mongoose');

const guildsSchema = new mongoose.Schema({
  isPlaying: { type: Boolean, default: false },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  id: String,
  name: String,
  icon: String,
  region: String,
  memberCount: Number,
  premiumTier: Number,
  premiumSubscriptionCount: Number,
  joinedTimestamp: Date,
  maximumMembers: Number,
  preferredLocale: String,
  ownerID: String,
}, { timestamps: true });

const Guild = mongoose.model('Guild', guildsSchema);

module.exports = Guild;
