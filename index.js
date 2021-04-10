const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');

const uri = "mongodb+srv://admin:admin@blind-test.bx9rj.mongodb.net/blind_test?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("connected")
});

const songsSchema = new mongoose.Schema({
  title: String,
  url: String,
  cover: String
});

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
});

const playlistsSchema = new mongoose.Schema({
  name: String,
  thumbnail: String,
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
});

const Song = mongoose.model('Song', songsSchema);
const User = mongoose.model('User', usersSchema);
const Playlist = mongoose.model('Playlist', playlistsSchema);

const typeDefs = gql`
  type Song {
    _id: ID
    title: String
    url: String
    cover: String
  }

  type User {
    _id: ID
    username: String
    avatar: String
  }

  type Playlist {
    _id: ID 
    name: String 
    thumbnail: String 
    songs: [Song]  
  }

  type Query {
    song(id: ID): Song
    songs: [Song]

    playlist(id: ID): Playlist
    playlists: [Playlist]

    user(id: ID): User
    users: [User]
  }

  type Mutation {
    addSong(title: String, url: String, cover: String): Song
    deleteSong(id: ID): Song
    updateSong(id: ID, title: String, url: String, cover: String): Song

    addPlaylist(name: String, thumbnail: String, songs: [ID]): Playlist
    deletePlaylist(id: ID): Playlist
    updatePlaylist(id: ID, name: String, thumbnail: String, songs: [ID]): Playlist

    addUser(username: String, avatar: String): User
    deleteUser(id: ID): User
    updateUser(id: ID, username: String, avatar: String): User
}
`;

const resolvers = {
  Query: {
    async songs() {
      const songs = await Song.find().exec();
      return songs;
    },
    async song(parent, { id }, context, info) {
      const song = await Song.findById(id).exec();
      return song;
    },
    async playlists() {
      const playlists = await Playlist.find().populate('songs').exec();
      return playlists;
    },
    async playlist(parent, { id }, context, info) {
      const playlist = await Playlist.findById(id).populate('songs').exec();
      return playlist;
    },
    async users() {
      const users = await User.find().exec();
      return users;
    },
    async user(parent, { id }, context, info) {
      const user = await User.findById(id).exec();
      return user;
    },
  },
  Mutation: {
    async addSong(parent, { title, url, cover }, context, info) {
      const newSong = await Song.create({ title, url, cover });
      return newSong;
    },
    async deleteSong(parent, { id }, context, info) {
      const deletedSong = await Song.findByIdAndDelete(id);
      return deletedSong;
    },
    async updateSong(parent, { id, title, cover, url }, context, info) {
      const updatedSong = await Song.findByIdAndUpdate(id, { title, cover, url }, { new: true });
      return updatedSong;
    },

    async addPlaylist(parent, { name, thumbnail, songs }, context, info) {
      const newPlaylist = await Playlist.create({ name, thumbnail, songs });
      return newPlaylist;
    },
    async deletePlaylist(parent, { id }, context, info) {
      const deletedPlaylist = await Playlist.findByIdAndDelete(id);
      return deletedPlaylist;
    },
    async updatePlaylist(parent, { id, name, thumbnail, songs }, context, info) {
      const updatedPlaylist = await Playlist.findByIdAndUpdate(id, { name, thumbnail, songs });
      return updatedPlaylist;
    },

    async addUser(parent, { username, avatar }, context, info) {
      const newUser = await User.create({ username, avatar });
      return newUser;
    },
    async deleteUser(parent, { id }, context, info) {
      const deletedUser = await User.findByIdAndDelete(id);
      return deletedUser;
    },
    async updateUser(parent, { id, username, avatar }, context, info) {
      const updatedUser = await User.findByIdAndUpdate(id, { username, avatar });
      return updatedUser;
    },
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
