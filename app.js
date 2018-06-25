const express = require('express');
const bodyParser = require('body-parser');
const app = express();
//in order to use express session, we have to include it.
const session = require('express-session');
//to use the module we'll have to load it.
//make sure you add this line AFTER you require the express-session module
//we're not only loading this module, but calling it, passing our express session as an argument.
//then we find the session middleware and add a new key called store
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

//connects to mongodb using mongoose
//mongodb connection
//were passing one argument to the connect method, the mongo database.
//this connects to mongodb on this machine, local host on port 27017, the default port for MongoDB
//the last part /bookworm, is the name of the Mongo data store, bookworm, the name of the database for our site. Mongoose will automatically create this database after it starts
mongoose.connect("mongodb://localhost:27017/bookworm");
//variable to hold the database connection object
const db = mongoose.connection;
//we can use the db object to hold an error handler
//this code listens for error events or errors that occur with our database and logs those errors to the console.
db.on('error', console.error.bind(console, 'conection error:'));

//use sessions for for tracking logins
//we use app.use then pass session. The session function takes a few parameters.
app.use(session({
  //the only required option is secret, which is a string that is used to sign the seesion ID cookie
  //the secret adds another level of security to our system
  secret: 'treehouse loves you',
  //the resave option forces the session to be saved in the session store, whether anything changed during the request or not.
  resave: true,
  //save uninitialized forces an uninitialized session to be saved in the session store.
  //n uninitialized session is a new and not yet modified session, and since we don't want to save it, we set the value to false.
  saveUninitialized: false,
  //Here we add the new key for the mongo-connect middleware called store.
  //Inside of the key we add an object called MongoStore
  store: new MongoStore({
    //the session constructor function takes a configuration object, and all we need to do is set mongoose connection to DB
    mongooseConnection: db
    //if you look at the code to connect to mongoDB you'll see a line where we set the variable to the Mongoose connection, after we've connected to the local Mongo DB instance.
    //So it's IMPORTANT we make sure this entire function is pasted in UNDER the MONGODB connection.
  })
  //you can use sessions all the time, even for visiters that have not signed up. This is useful for tracking how anyonymous users visit your site,
  //which pages they visit, how long they visit and so on.
}));

//this is another level of middleware that will make user ID avaialbe in templates
app.use(function (req, res, next) {
  //the response object has a property called locals. Locals provides a way for you to add information to the response object.
  //you could think of it as stuffing a custom variable into the response
  //in express, all of your views have access to the respons's locals object
  //Here we store the user's ID into a current user property.
  //Sessions are attached to the rquest object.
  //So we retrieve the user ID by accessing the session on the request object.
  //If the user is logged in res.locals.currentUser will hold the number, their user ID.
  //However, if the user is not logged in there will be no session and no session id, so the value of current user will be undefined.
  //All of the application's views can access this current user value.
  //We will add a bit of logic to the navigation bar.
    res.locals.currentUser = req.session.userId;
    next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
//tells express to server static assests like pictures and stylesheets from the /public folder
//in node__dirname referes to the file path from the server's root to our applications root foler.
app.use(express.static(__dirname + '/public'));

// view engine setup
//tells express to use the pug templating engine.
app.set('view engine', 'pug');
//this line of code tells exress where to find our pug templates. they are stored in the views directory.
app.set('views', __dirname + '/views');

//we set up our routes here
// include routes
const routes = require('./routes/index');
app.use('/', routes);

//boilerplate codess

//this handles cannot find errors
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
//this handles server errors
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//we spin up the enire server on port 3000
// listen on port 3000
app.listen(3000, function () {
  console.log('Express app listening on port 3000');
});
