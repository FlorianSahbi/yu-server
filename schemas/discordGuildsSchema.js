/* eslint-disable max-len */
const mongoose = require('mongoose');

const discordGuildsSchema = new mongoose.Schema({
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

const DiscordGuild = mongoose.model('DiscordGuild', discordGuildsSchema);

module.exports = { DiscordGuild, discordGuildsSchema };
