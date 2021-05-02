const { gql } = require('apollo-server');

const typeDefs = gql`
  scalar Date

  type Track {
    _id: ID,
    title: String,
    videoUrl: String,
    videoId: String,
    playCount: Int,
    lengthSeconds: String,
    category: String,
    ownerChannelName: String,
    thumbnail: String,
    isAccepted: Boolean,
    answers: [String],
    keywords: [String],
    tags: [Tag],
    creator: User,
    createdAt: Date,
    updatedAt: Date
  }

  type Tag {
    _id: ID,
    name: String,
    thumbnail: String,
    playCount: Int,
    isCustom: Boolean,
    tracks: [Track],
    creator: User,
    createdAt: Date,
    updatedAt: Date
  }

  type User {
    _id: ID,
    username: String,
    avatar: String,
    email: String,
    playCount: Int,
    discordData: DiscordUserPayload,
    games: [Game]
    tracks: [Track]
    tags: [Tag]
    guilds: [Guild]
    createdAt: Date,
    updatedAt: Date
  }

  type Guild {
    _id: ID,
    isPlaying: Boolean,
    users: [User],
    id: String,
    name: String,
    icon: String,
    region: String,
    memberCount: Int,
    premiumTier: Int,
    premiumSubscriptionCount: Int,
    joinedTimestamp: Date,
    maximumMembers: Int,
    preferredLocale: String,
    ownerID: String,
  }

  type DiscordUserPayload {
    id: String,
    username: String,
    avatar: String,
    discriminator: String,
    public_flags: Int,
    flags: Int,
    locale: String,
    mfa_enabled: Boolean,
    email: String,
    verified: Boolean
  }

  type DiscordToken {
    access_token: String,
    expires_in: Int,
    refresh_token: String,
    scope: String,
    token_type: String
  }

  type AuthPayload {
    user: User,
    token: DiscordToken,
  }

  type Game {
    _id: ID,
    name: String,
    goal: Int,
    trackTime: Int,
    tags: [Tag],
    users: [User],
    history: [Round],
    creator: User,
    createdAt: Date,
    updatedAt: Date
  }

  type Round {
    _id: ID,
    position: Int,
    track: Track,
    ranks: [Rank],
    createdAt: Date,
    updatedAt: Date
  }

  type Rank {
    _id: ID,
    position: Int,
    user: User,
    points: Int,
    createdAt: Date,
    updatedAt: Date
  }

  type Leaderboard {
    player: User,
    points: Int
  }

  type YouTubeThumbnail {
    url: String,
    width: Int,
    height: Int
  }

  type YouTubeData{
    title: String,
    keywords: [String],
    videoUrl: String,
    thumbnails: [YouTubeThumbnail],
    lengthSeconds: String,
    category: String,
    ownerChannelName: String,
    videoId: String
  }

  input userDiscordData {
    id: String,
    username: String,
    avatar: String
  }
  
  input trackInput {
    title: String,
    videoUrl: String,
    videoId: String,
    lengthSeconds: String,
    category: String,
    ownerChannelName: String,
    thumbnail: String,
    answers: [String],
    keywords: [String],
    creator: ID,
    tags: [ID],
  }

  input tagInput {
    name: String,
    thumbnail: String,
    tracks: [ID],
    creator: ID,
  }

  input guildInput {
    id: String,
    name: String,
    icon: String,
    region: String,
    memberCount: Int,
    premiumTier: Int,
    premiumSubscriptionCount: Int,
    joinedTimestamp: Date,
    maximumMembers: Int,
    preferredLocale: String,
    ownerID: String,
  }

  input userInput {
    username: String,
    avatar: String,
    discordId: String,
  }

  input roundInput {
    position: Int,
    track: ID,
  }

  input rankInput {
    position: Int,
    user: ID,
    points: Int,
  }

  input discordToken {
    access_token: String,
    expires_in: Int,
    refresh_token: String,
    scope: String,
    token_type: String
  }

  type Query {
    auth(code: String): AuthPayload
    signIn(token: discordToken): User

    guilds: [Guild]
    guild(id: ID): Guild
    guildByGuildId(id: ID): Guild

    tracks(tag: ID): [Track]
    track(id: ID): Track

    tags: [Tag]
    tag(id: ID): Tag

    games: [Game]
    game(id: ID): Game

    users: [User]
    user(id: ID): User

    leaderboard(id: ID): [Leaderboard]

    randomTrack(tag: ID): Track

    playlistTracks(tag: ID): [Track]

    youtubeData(youtubeUrls: [String]): [YouTubeData]
  }

  type Mutation {
    createGuild(guildInput: guildInput): Guild
    updateGuildIsPlaying(id: ID, isPlaying: Boolean): Guild

    createTrack(trackInput: trackInput): Track
    createTracks(trackInputs: [trackInput]): [Track]
    deleteTrack(id: ID): Track

    createTag(tagInput: tagInput): Tag
    deleteTag(id: ID): Tag

    createUser(userInput: userInput): User
    deleteUser(id: ID): User
    updateUserAddGame(id: ID, gameId: ID): User
    updateUserAddTrack(id: ID, trackId: ID): User
    updateUserAddTags(id: ID, tagId: ID): User
    updateUserAddGuild(id: ID, guildId: ID): User

    createGame: Game
    deleteGame(id: ID): Game
    updateGameAddPlayers(id: ID, users: [ID]): Game
    updateGameAddTags(id: ID, tags: [ID]): Game
    updateGameAddRound( id: ID, roundInput: roundInput): Game
    updateGameAddRank(id: ID, round: Int, rankInput: rankInput): Game

    createCustomPlaylist(tagInput: tagInput, trackInputs: [trackInput]): Tag
    createUserWithDiscordId(discordId: String): User
    updateAndAdd(id: ID, userDiscordData: [userDiscordData], ): Game
    acceptTrack(id: ID): Track
}
`;

module.exports = typeDefs;
