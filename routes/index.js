const express = require('express');
const router = express.Router();
//We need to require the moongoose schema we created. We create a variable named User and load the schema from the /Models directory
const User = require('../models/user');
//We use this to require our router Middleware
//because this route's file is in the route's directory, we need to use the dot dot slash to move up and out of the route folder, then idenditry the middleware folder.
//requiring a directory by name like this tells express to load the index.js file in that directory.

//Now to add our middleware, we pass it into a route. You can do so by referencing it by mid.logged out.
//First, lets only show the registration form if the visitor is not logged in.
//We add this middleware inside the GET route for register.
const mid = require('../middleware');

//GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  //remember when a suer successsfully logs in their ID, which is the ID used in Mongo to identify a single document, it's stored as a session value.
  //in other words, if there's no user id in the session, then the user can't be locked in.
  //We can check for that case first

  //Note Because we created a middleware function (mid.requiresLogin) we no longer have to use this more tedious method of authenticating the user...so i am commenting it out
//////////////////////////////////////////////////////////////////////////////
  // if (! req.session.userId ) {
  //   //So here we are just looking to see if the user ID session variable exists
  //   //if it doesn't, we'll send a message telling the user they are not authorized
  //   const err = new Error("You are not authorized to view this page. ");
  //   //We'll also send out an error satus code of 403,
  //   //that means forbidden, basically the page is off limits unless your logged in.
  //   err.status = 403;
  //   return next(err);
  //   //remember that a session is a property of the request object, and the individual pieces of data that we store in there are properties on the session, req.session.
  // } //Now what to do if the user ID's session variable is in place.
  // //in this case we can retrieve the user ID from the session store and execute a query from the mongo database retrieving the user's information from Mongo.

  User.findById(req.session.userId)
    //We'll add a basice error check in case the query doesn't work.
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        //However, if theres no error, wwe can render the profile template.
        //passing in a title, the user name, and the user's favorite book
        return res.render('profile', { title: 'Profile', name: user.name, favorite:
        user.favoriteBook });
        //remember user.name is data that comes from the Mongo database, user.fovoriteBook is the same
        //name is a variable that were using to send to our template. In other words, were sending the user name from the database in a variable to the template.
      }

    })
});

//GET /logout
//Adds a route to /logout after a user logs out of thier account
router.get('/logout', function(req, res, next) {
  //first we check to see if a session exists
  if (req.session) {
      //and if it does, we'll just delete it.
      //delete session object
      //the sessions destroy method takes a callback bunciton, which indicates what the aapp should do after it destrays the session.
    req.session.destroy(function(err) {
        //in this case, lets check to see if there were any errors.
        if(err) {
          return next(err);
        } else {
          //if not, we'll just redirect the user who's now logged out to the site's homepage.
        return res.redirect('/');
      }
    });
  }
});

//To provide a way to log in, we will need to provide a login form as well as a way to process the form input
//We'll need two routes onthe same /login URI
//One route to display the login form, the other to process the login credentials posted from the Form

//GET /login
//We set up a get request along the /login route, then we add a callback function
router.get('/login', mid.loggedOut, function(req, res, next) {
//this function will render a pug template.
//this function identifies the name of the pug template 'login', and passes along a parameter, the title of the page 'Log In'
  return res.render('login', {title: 'Log In'});
  //Now when the user fills out the login form, the data is posted to the /login route.
});

//POST /logins
router.post('/login', function(req, res, next) { //we placed our custom router middleware mid.loggedOUt in the middle of this route, just like in the GET /register route.
//first we check to see if the user has supplied their login and password. If they leave one off the form, we can't authenticate them and should spit out an console.error
//We'll use a conditional statement to make sure the email and password are coming through the request
  if (req.body.email && req.body.password) {
    //we call the authenticate method we created in the models/user.js file on the user object
    //remember, user is our model. You can see we imported that up near the top of this file.
    //We'll pass the email and password from the form as well as a callback function
    //so within that callback function, first let's deal with a bad logins
    //for example, if the email or password doesn't match
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      //we can do that by simply checking if there's an error or if therse no user,
      //we'll create a new error signaling that they sumbitted the wrong email or the wrong password.
        if (error || !user) {
          const err = new Error('Wrong email or password.');
          //like all authentication errors, we give it a status code of 401
          err.status = 401;
          //then we simply return this, so that the next error is processed.
          return next(err);
        } else {
          //so... after ALL of this, at this point the user has filled out the credentials correctly and they've been authenticated against our database.
          //The Last step is to create a session.
          //IF the user IS authenticated, we can save the user's ID, that's the id drawn from the mongod document for that user into a sessions
          //Remember that session data is only stored on the server, so this user ID is never sent to the cleint browser, only a cookie is sent containing the session id.
          //That just makes sure that sensitive information like the user ID is only kept on th server

          //conviently, express adds session data ot the request object
          //so anywhere you can access the request object, like in any route, you can set and read session data.
          req.session.userId = user._id;
          //even better, express creates the cookie for us automatically, also notice we don't do anythying speciall to create a session.
          //just by adding the property, userID to the req.session and assigning that property a value user._id,
          //were telling express to either add the property of the session or create a new session if one doesn't exist.
          //user._id is what we'll get back from the authenticate function when it's authenticated.
          //user is our document, it represents all the information for a single logged in user and finally the underscore ID is that unique ID that mongod gave the document when it was inserted into the DATABASE
          //Finally, there logged in, and we will redirect them to the profile page, now we can also add that to the register route.
          return res.redirect('/profile');

        }
      });
  } else {
//if there is, we'll do something to authenticate it, otherwise we'll let the use know that they didn't supply all the required information
    const err = new Error('Email and password are required.');
    //the 401 status code means unauthorized, you can use it to indiate missing or bad authentication
    err.status = 401;
    return next(err);
    //Now we need to add the programming to authenticate the request when both fields are filled out.
    //We'll add the method to the user schema. We can call this method to authenticate a users
    //because we are adding it to the schema, we put the code in the user.js file in the models folder.
    //Look for the comment AUTHENTICATE INPUT AGAINST DATABASE DOCUMENTS to view this programming
  }
});


//GET /register
//Route to the sign Up Form
//router.get and then we pass it a string /register, that's the end point
//we add a callback function as the second argument
//the callback tells express what to do when a user requests this endpoint
//the callback accepts 3 arguments, the request object which as all the information related to the request that wws sent from the client
//the response object, which let's us send data back to the user
//and the function called next which tells express to continue on to the next piece of middleware. In other words, what function should express run after this callback?
//we are not concerned with requests for this route, the user is just asking for the registration form, so we use the response to send back our response.
router.get('/register', mid.loggedOut, function(req, res, next) { //we literally place our custom router middleware mid.loggedOut in the middle of this route
  //we need to use the render method to display the form. Render is how we take a pug template and render it as normal html.
  //we're passing two pieces of infomation, the name of the template file, register, which is the register.pug file.
  //Also an object containing one key and one value, which is title: 'sign up'
    return res.render('register', { title: 'Sign Up '});

});

// POST /register
//The post route is where we recieve the information entered into the registration form
//We'll use that data to create a new user in the database
router.post('/register', function(req, res, next) {
  //error checking code that makes sure the user has filled out every single field in our Form
  //we can do that with a basic conditional statement that is a series of and conditions meaning all of these conditions must be true
  //if any of the fields on the form are empty, meaning the user didn't fill the field out
  //it will produce a false value and bypass this part of the if statment, jumping immediantly to an else statement
    if (req.body.email && //req.body.email is the information typed in the email field by the user, etc. for all req.body.whateverfield
      req.body.name &&
      req.body.favoriteBook &&
      req.body.password &&
      req.body.confirmPassword) {

        //confirm that user typed same password twice with a basic conditional statement
        //if the information in the password field doesn't match the information in the confirm password field, we'll create another error.
        if (req.body.password !== req.body.confirmPassword) {
          const err = new Error('Passwords do not match.');
          //400 is an http status code meaning bad request
          //You use that when the request could not be understood by the server, due to malformed syntax, such as missing information.
          //it means the user has to change something, like filling out the form correctly before making the request again
          err.status = 400;
          //we'll return this error to our error-handling middleware, that will get sent back to the browser.
          return next(err);
        }

        //Now that we know that our passwords match and that all the fields are filled in we can store the information
        //we will build up an object that will store all the information that we wanna store inside Mongo.
        //we'll create a variable called user data it'll be an object and have several keys: email, name, favorite book, and passwword.
        //Notice that the value is coming from the request object, so it's the information that the user filled out in the form. The email field, password field, etc.
        //In other words, were creating a new document we wish to insert into Mongo.
        const userData = {
          email: req.body.email,
          name: req.body.name,
          favoriteBook: req.body.favoriteBook,
          password: req.body.password
        };
        //Now that we have the object in place, its time to insert it into Mongo.

        //we are going to be using schema's `create` method to insert our document into Mongo.
        //User here, is our mongoose model returned by our schema file.
        //Create is a mongoose method that inserts a new document in Mongo basedon that model.
        User.create(userData, function (error, user) {
          //if there's an error, we just pass the error off to our error handling middleware.
             if (error) {
               return next(error);
             } else {
               //Once they are registered, they're automatcially logged in.
               req.session.userID = user._id;
              //Now if there's no error, meaning we successfully added a record to Mongo, the application will send the user directly to the profile page.
              return res.redirect('/profile');
            }
        });

    } else {
      const err = new Error("All Fields Required") //here we create an error and give it a message "all fields required".
      //400 is an http status code meaning bad request
      //You use that when the request could not be understood by the server, due to malformed syntax, such as missing information.
      //it means the user has to change something, like filling out the form correctly before making the request again
      err.status = 400;
      //we'll return this error to our error-handling middleware, that will get sent back to the browser.
      return next(err);
    }
  })

// GET /
//Route to the homepage
router.get('/', function(req, res, next) {
  return res.render('index', { title: 'Home' });
});

// GET /about
//Route to the about page
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

// GET /contact
//Route to the contact page
router.get('/contact', function(req, res, next) {
  return res.render('contact', { title: 'Contact' });
});



module.exports = router;
