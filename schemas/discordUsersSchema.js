/* eslint-disable max-len */
const mongoose = require("mongoose");

const discordUsersSchema = new mongoose.Schema({
    id: String,
    username: String,
    avatar: String,
    discriminator: String,
    publicFlags: String,
    flags: String,
    locale: String,
    mfaEnabled: Boolean,
    email: String,
    verified: Boolean
}, { timestamps: true });

const DiscordUsers = mongoose.model("DiscordUsers", discordUsersSchema);

module.exports = { DiscordUsers, discordUsersSchema };
