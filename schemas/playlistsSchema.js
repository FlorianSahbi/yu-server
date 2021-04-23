const mongoose = require("mongoose");

const playlistsSchema = new mongoose.Schema({
  name: String,
  thumbnail: String,
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
}, { timestamps: true });

const Playlist = mongoose.model("Playlist", playlistsSchema);

module.exports = Playlist;
