//this loads the module and stores it in a variable named mongoose
const mongoose = require('mongoose');
//require bcrypt, the password hashing package, by assigning it to a var named bcrypt
const bcrypt = require('bcrypt');
//to create a schema, we must create a new mongoose schema object, we are storing this in a variable called UserSchema
const UserSchema = new mongoose.Schema({
  //we pass an object to the schema which is composed of keys and values
  //the key is the name for the data, in this case the name of the form field
  //the value is the type of data you want to store in it.
  //when the user signs up to our site, we want to make sure we get all thier data, name, email, password, favorite book, etc.
  //none of that data is optional.
  //mongoose lets you make any number of fields required, so that if a user tries to add a record without that info, mongoose refuses to create a new document and sends back an error message.
  //To add more requirements to your data, you must assign another object to the key, with meta-data in it
  // for example, for our email field, well add an another object which has a few keys
    email: {
      type: String, //type is the type of data, a string
      unique: true, //the unique attribute ensures that the provided email address does not already exisit in the database
      //we want to make sure that no two users can create an account wit hteh same email address, because the email address identifies the unique user when logging into the website.
      required: true, //the required attribute set to true makes MongoDB enforce the presence of the email field
      trim: true //for text fields that the user types into, we can add a trim attribute and set it to true. Trim removes whitespace before or after the text that might have been typed into the form accidently.
    },
    //we'll add similar infomration to the other fields.
    name: {
    type: String,
    required: true,
    trim: true,
  },
  favoriteBook: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
});

//AUTHENTICATE INPUT AGAINST DATABASE DOCUMENTS

//we add this authenticate method to the schemas statics object.
//In mongoose the statics object lets you add methods directly to the model
//we'll be able to call this metod when we require the model in our other files like our route files

//the function that i'm defining here takes three argumetns, the email and password submitted with the form, and a function.
//we'll add that function in the route, but in a nutshell the function will either log hte user in, or give thme an unauthroized user error.
UserSchema.statics.authenticate = function(email, password, callback) {
  //in the authenticate function, we'll tell mongoose to set up a query to find the adocument with the user's email address.
    User.findOne({email: email })
    //then we'll use the exec method to perform the search and provide a callback to process the results.
      .exec(function (error, user) {
        //if there's an error with the query, we can simply return and error.
        if (error) {
          return callback(error);
          //but we also want to return na error if the email address wasn't in any document, in other words we couldn't find the user in the database.
        } else if ( !user ) {
          //we write a custom error method in this case, "user not found"
          const err = new Error('User not found. ');
          //we set the error status to 401
          err.status = 401;
          return callback(err);
        }
        //so finally... if we get through all this, meaning there IS a user in the database with the supplied email...
        //We can use bcyrpts compare method to compare the supplied passowrd with the hasehed version.

        //the compare method takes three arguments a plaintext passwordd, that's what the user types into the login form,
        //the hashed password, from the retrieved database document,
        //and a callback function.
        bcrypt.compare(password, user.password , function(error, result) {
          //the compare method returns and error if something goes wrong or a result, which is a simple boolean value
          //true if the passwords match, false if they don't.
          if (result === true) {
            //if the passwword matches we return null and the user document because we know that the user logging in is who they calaim to be
            //null represents an error value
            //node uses a standard pattern for callbacks an error followed by aother arguments
              return callback(null, user);
            } else {
              //in this case, there is no error, the authentacation worked. So we pass a null value, followed by the user object.
              //with the authenticate method added to our schema, we can now call it from the /login route
                return callback();
            }
        })
      })

}

//create a pre-save hook... a function that Mongoose runs just before saving a record to Mongo.
//In this case we want to hash a password just before we store a new user record in the database.
//we do this by calling the pre method on our schema
//the method takes two arguments. The hook name, in this case save.
//Before saving the record Mongoose runs a fucntion and that's the second argument passed to the pre-method, this anonymous function.
//the function takes next as a parameter. Middleware, provides a way to process input as it's passed through a chain of commands
//next here represents the next piece of middleware or the next function that runs after this one.
UserSchema.pre('save', function(next) {
  //In this specfic case, after this function runs, in the pre-hook, mongoose assigns the database object it's about to insert into Mongo to the JavaScript keyword, this.
  //In the context of this callback function, the word, this, refers to the object we created containing the infomration the user entered in the sign up form.
  //So the variable user, holds the user object and its data.
    const user = this;
    //bcrypt fortunately, provides a method for creating both a hash, and a salt in one fucntion call.
      //the hash method takes three arguments. A plain text password, a number, and a callback function that's run once the hash is generated.
    //user contains the document that Moongoose will insert into Mongo. password is the property on that object that holds the plaintext password supplied by the user.
   //The number, in this case 10, tells bcypt how many times to encrypt the password. The bigger the number, the slower the process, but the greater the security.
   //two arguments are passed to the callback, an error if the hashing fails, and the hash value if it succeeds.
   bcrypt.hash(user.password, 10, function(err, hash) {
     //first we'll handle any errors.
     if(err) {
       //if there is any errors, we'll just pass it along and it will get handled by our error handling middleware.
       return next(err);
     }
     //if there is nO error, we can assign the new hashed value to the password property of the user object
     //in other words we simply overwrite the plain text password with the new secure hash.
     user.password = hash;
     next(); //lastly for this function we all next.
   })
});

    //finally to use the schema in our application, we need to export it.
    //we create a new variable called user and are using mongooses model method, and this creates our schema.
    const User = mongoose.model('User', UserSchema);
    //Now to use this model, we'll need to tell our application about it, and we'll need to export it here.
    module.exports = User;
