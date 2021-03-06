//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMangoose = require("passport-local-mongoose");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "this-is-a-secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-vinay:test123@cluster0.hzcwl.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true});


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMangoose);


const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
mongoose.set("useCreateIndex", true);


app.get("/",function(req,res){
  res.render("home");
});



app.get("/login",function(req,res){
  res.render("login");
});


app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){
   User.find({"secret": {$ne: null}}, function(err, foundUsers){
     if(err)
     {
       console.log(err);
     }
     else {
       if(foundUsers)
       {
         res.render("secrets", {usersWithSecret: foundUsers});
       }
     }
   });
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/submit", function(req,res){
  if(req.isAuthenticated())
  {
    res.render("submit");
  }
  else {
    res.redirect("/login");
  }
})
app.post("/register", function(req,res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err)
    {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){

  const user= new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err)
    {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit",function(req,res){
  const submittedSecret= req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if(err)
    {
      console.log(err);
    }
    else {
      if(foundUser)
      {
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("server started running");
});
