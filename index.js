/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {ApolloServer} = require('apollo-server');
const mongoose = require('mongoose');
require('./schemas/gamesSchema');
require('./schemas/playlistsSchema');
require('./schemas/songsSchema');
require('./schemas/tagsSchema');
require('./schemas/usersSchema');
require('./schemas/roundsSchema');
require('./schemas/ranksSchema');

const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const uri = 'mongodb+srv://admin:admin@blind-test.bx9rj.mongodb.net/blind_test?retryWrites=true&w=majority';
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.log.bind(console, 'connection error:'));
db.once('open', () => console.log('DB Connected'));

const server = new ApolloServer({typeDefs, resolvers});
server.listen({port: process.env.PORT || 4000}).then((connection) => console.log(connection.url));
