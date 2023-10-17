const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

//Error by the dev in coding
process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception! 💥 Shutting down...`);
  console.log(err.name, err.message);
  process.exit(1);
});

//Setting up our enviromental var
dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//Connecting our db to our schema
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.log(err));

//Network port to be part of our environment
const port = process.env.PORT || 3000;

//Setting up a network port to listen for the server for
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//Handing errors not caught by the server
process.on('unhandledRejection', (err) => {
  console.log(`Unhandled Rejection Shutting down...`);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
