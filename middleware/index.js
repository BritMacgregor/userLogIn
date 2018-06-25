//CUSTOM MIDDLEWARE

//middleware that prevents logged in users from accessing a route they are not suppose to.
function loggedOut(req, res, next) {
  //middleware functions ahve access to three parameters. The request object, the response object, and the next function.
  //The session middlware makes a session object available through the request object.

  //so in this function, we can check for a session and a user ID value.
  //if both of these are true, that means a user is logged into the visiters
  if (req.session && req.session.userId) {
        //and if the users IS logged in and tries to acces a page other than authorized pages for logged in users, we'll send them to their profile pages
    return res.redirect('/profile');
    //we can call this middleware on any route that we don't want an authroized (logged in) user to see, like a marketing page or a sign up pages
//however, if a user is not logged in, we just pass execution to the next peice of middleware bhy calling next.
  }
  return next();
  //in other words, if the visitor is not logged in this function won't do anything.
}
function requiresLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    var err = new Error('You must be logged in to view this page.');
    err.status = 401;
    return next(err);
  }
}

//This custom router middleware function makes it easy to password protect any of your webpages!
//To use this middleware function in the routes/index.js page, we only have to call this function. mid.requresLogin , since we already required the middleware file for the previous function in our routes/index.js page.
//Requires Login... makes users be logged in to view signed up user pages
function requiresLogin(req, res, next) {
  //conditional that checks for a session and a userid on that session.
  if (req.session && req.session.userId) {
    //if both session and user id are there, then the user is logged in.
    //in that case we'll exit the function by calling the next piece of middleware.
    return next();
  } else {
    //if the visitor is not logged in, we'll create an error that lets the user know they must be logged in to view this page.
    var err = new Error('You must be logged in to view this page.');
    //we'll provide a 401 status to let the user know they are unauthrized.
    err.status = 401;
    //we will return this to the error handling middleware.
    return next(err);
  }
}

//in order to use this middleware in our application, we have to export it. so at the bottom of the file we export the function.

//because this is router middleware, we need to require it and use it in the file defining our routes.
//to do this we'll place const mid = require('../middleware'); at the top of the page with the other variables.
module.exports.loggedOut = loggedOut;
//exports this function
module.exports.requiresLogin = requiresLogin;
