const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  discordId: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

const User = mongoose.model('User', usersSchema);

module.exports = User;
