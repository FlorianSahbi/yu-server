const {gql} = require('apollo-server');

const typeDefs = gql`
  scalar Date

  type YouTubeData {
    cover: String
    title: String
  }

  type Rank {
    position: Int
    player: User
    points: Int
  }

  type Round {
    song: Song
    position: Int
    rank: [Rank]
  }

  type Game {
    _id: ID
    name: String
    points: Int
    trackTime: Int
    tags: [Tag]
    players: [User]
    history: [Round]
  }

  type Song {
    _id: ID
    title: String
    url: String
    cover: String
    correctWords: [String]
    user: User
    tags: [Tag]
    isAccepted: Boolean
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

  type TagConnection {
    docs: [Tag]
    totalDocs: Int
    limit: Int
    totalPages: Int
    page: Int
    pagingCounter: Int
    hasPrevPage: Boolean
    hasNextPage: Boolean
    prevPage: Int,
    nextPage: Int
  }

  type User {
    _id: ID
    username: String
    avatar: String
    songs: [Song]
    discordId: String
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
    randomSong(tag: ID): Song

    game(id: ID): Game
    games: [Game]

    playlist(id: ID): Playlist
    playlists: [Playlist]

    user(id: ID): User
    users: [User]

    tag(id: ID): Tag
    tags(
      limit: Int,
      page: Int
    ): TagConnection

    getSongData(
      url: String
    ): YouTubeData
  }

  type Mutation {
    acceptSong(
      id: ID
    ): Song
    addSong(
      title: String,
      url: String,
      cover: String,
      user: ID,
      correctWords: [String],
      tags: [ID]
    ): Song
    deleteSong(
      id: ID
    ): Song
    updateSong(
      id: ID, 
      title: String, 
      cover: String, 
      url: String, 
      correctWords: [String],
      user: ID, 
      tags: [ID]
    ): Song

    addGame(
      players: [ID],
      tags: [ID],
    ): Game
    updateGame(
      id: ID, 
      players: [ID]
      tags: [ID]
      positionPlayer: Int
      positionRound: Int
      songRound: ID
      song: ID
      player: ID
      points: Int
    ): Game

    updateGameAddRound(
      id: ID, 
      positionRound: Int
      song: ID
    ): Game

    addTag(
      name: String,
      cover: String
    ): Tag
    deleteTag(
      id: ID
    ): Tag
    updateTag(
      id: ID, 
      name: String, 
      cover: String
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

module.exports = typeDefs;
