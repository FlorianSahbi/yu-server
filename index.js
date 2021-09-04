/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');
require('./schemas/gamesSchema');
require('./schemas/tracksSchema');
require('./schemas/tagsSchema');
require('./schemas/usersSchema');
require('./schemas/roundsSchema');
require('./schemas/ranksSchema');
require('./schemas/guildsSchema');
require('./schemas/discordUsersSchema');

const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.info.bind(console, 'connection error:'));
db.once('open', () => console.info('DB Connected'));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
server.listen({ port: process.env.PORT || 4000 }).then((connection) => console.info(connection.url));
