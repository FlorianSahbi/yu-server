const mongoose = require('mongoose');
const { discordUsersSchema } = require('./discordUsersSchema');

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: { type: String, default: 'https://cdn130.picsart.com/336004698071211.png?type=webp&to=min&r=640' },
  email: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
  playCount: { type: Number, default: 0 },
  discordData: discordUsersSchema,
}, { timestamps: true });

const User = mongoose.model('User', usersSchema);

module.exports = User;
