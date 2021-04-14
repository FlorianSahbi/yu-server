/* eslint-disable require-jsdoc */
const {ApolloServer, gql} = require('apollo-server');
const mongoose = require('mongoose');
const {GraphQLScalarType, Kind} = require('graphql');

const uri = 'mongodb+srv://admin:admin@blind-test.bx9rj.mongodb.net/blind_test?retryWrites=true&w=majority';
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected');
});

const tagsSchema = new mongoose.Schema({
  name: String,
  cover: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

const usersSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

const playlistsSchema = new mongoose.Schema({
  name: String,
  thumbnail: String,
  songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Song'}],
}, {timestamps: true});

const songsSchema = new mongoose.Schema({
  title: String,
  url: String,
  cover: String,
  correctWords: [String],
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
}, {timestamps: true});

const Song = mongoose.model('Song', songsSchema);
const User = mongoose.model('User', usersSchema);
const Playlist = mongoose.model('Playlist', playlistsSchema);
const Tag = mongoose.model('Tag', tagsSchema);

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.getTime();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

const typeDefs = gql`
  scalar Date

  type Song {
    _id: ID
    title: String
    url: String
    cover: String
    correctWords: [String]
    user: User
    tags: [Tag]
    createdAt: Date
    updatedAt: Date
  }

  type Tag {
    _id: ID
    name: String
    cover: String
    songs: [Song]
    createdAt: Date
    updatedAt: Date
  }

  type User {
    _id: ID
    username: String
    avatar: String
    songs: [Song]
    createdAt: Date
    updatedAt: Date
  }

  type Playlist {
    _id: ID 
    name: String 
    thumbnail: String 
    songs: [Song]  
    createdAt: Date
    updatedAt: Date
  }

  type Query {
    song(id: ID): Song
    songs(tag: ID): [Song]

    playlist(id: ID): Playlist
    playlists: [Playlist]

    user(id: ID): User
    users: [User]

    tag(id: ID): Tag
    tags: [Tag]
  }

  type Mutation {
    addSong(
      title: String,
      url: String,
      cover: String,
      user:ID,
      correctWords: [String]
    ): Song

    deleteSong(
      id: ID
    ): Song

    updateSong(
      id: ID, 
      title: String, 
      url: String, 
      cover: String, 
      user: ID, 
      correctWords: [String]
    ): Song

    addTag(
      name: String,
      cover: String,
    ): Tag

    deleteTag(
      id: ID
    ): Tag

    updateTag(
      id: ID, 
      name: String, 
      cover: String, 
    ): Tag

    addPlaylist(
      name: String, 
      thumbnail: String,
      songs: [ID]
    ): Playlist

    deletePlaylist(
      id: ID
    ): Playlist

    updatePlaylist(
      id: ID, 
      name: String, 
      thumbnail: String,
      songs: [ID]
    ): Playlist

    addUser(username: String,
      avatar: String
    ): User

    deleteUser(
      id: ID
    ): User

    updateUser(
      id: ID,
      username: String, 
      avatar: String
    ): User
}
`;

const resolvers = {
  Date: dateScalar,
  Query: {
    async songs(_, {tag}) {
      console.log(tag);
      const songs = await Song
          .find()
          .populate('user')
          .sort({updatedAt: 'desc'})
          .exec();
      return songs;
    },
    async song(_, {id}) {
      const song = await Song
          .findById(id)
          .populate('user')
          .exec();
      return song;
    },
    async tags() {
      const tags = await Tag
          .find()
          .exec();
      return tags;
    },
    async tag(_, {id}) {
      const tag = await Tag
          .findById(id)
          .exec();
      return tag;
    },
    async playlists() {
      const playlists = await Playlist
          .find()
          .populate('songs')
          .sort({updatedAt: 'desc'})
          .exec();
      return playlists;
    },
    async playlist(_, {id}) {
      const playlist = await Playlist
          .findById(id)
          .populate('songs')
          .exec();
      return playlist;
    },
    async users() {
      const users = await User
          .find()
          .sort({updatedAt: 'desc'})
          .exec();
      return users;
    },
    async user(_, {id}) {
      const user = await User
          .findById(id)
          .exec();
      return user;
    },
  },
  Mutation: {
    async addSong(_, {title, url, cover, user, correctWords}) {
      const newSong = await Song
          .create({title, url, cover, user, correctWords});
      return newSong;
    },
    async deleteSong(_, {id}) {
      const deletedSong = await Song
          .findByIdAndDelete(id);
      return deletedSong;
    },
    async updateSong(_, {id, title, cover, url, correctWords, user}) {
      const updatedSong = await Song
          .findByIdAndUpdate(id, {
            title, cover, url, correctWords, user,
          }, {new: true})
          .populate('user')
          .exec();
      return updatedSong;
    },

    async addTag(_, {name, cover}) {
      const newTag = await Tag
          .create({name, cover});
      return newTag;
    },
    async deleteTag(_, {id}) {
      const deleteTag = await Tag
          .findByIdAndDelete(id);
      return deleteTag;
    },
    async updateTag(_, {id, name, cover}) {
      const updatedTag = await Tag
          .findByIdAndUpdate(id, {
            id, name, cover,
          }, {new: true})
          .exec();
      return updatedTag;
    },

    async addPlaylist(parent, {name, thumbnail, songs}) {
      const newPlaylist = await Playlist
          .create({name, thumbnail, songs});
      return newPlaylist;
    },
    async deletePlaylist(parent, {id}) {
      const deletedPlaylist = await Playlist
          .findByIdAndDelete(id);
      return deletedPlaylist;
    },
    async updatePlaylist(parent, {id, name, thumbnail, songs}) {
      const updatedPlaylist = await Playlist
          .findByIdAndUpdate(id, {name, thumbnail, songs})
          .populate('songs')
          .exec();
      return updatedPlaylist;
    },

    async addUser(parent, {username, avatar}) {
      const newUser = await User
          .create({username, avatar});
      return newUser;
    },
    async deleteUser(parent, {id}) {
      const deletedUser = await User
          .findByIdAndDelete(id);
      return deletedUser;
    },
    async updateUser(parent, {id, username, avatar}) {
      const updatedUser = await User
          .findByIdAndUpdate(id, {username, avatar});
      return updatedUser;
    },
  },
};

const server = new ApolloServer({typeDefs, resolvers});

server.listen({port: process.env.PORT || 4000}).then(({url}) => {
  console.log(`🚀  Server ready at ${url}`);
});
