//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

const mongoose = require('mongoose');
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const googlestrategy=require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");



app.use(session({
    secret:"this is my secret",
    resave:false,
    saveUnintialize:false//    require=passport-local
}));
app.use(passport.initialize());
app.use(passport.session());

//mongoose.connect("mongodb://127.0.0.1:27017/userDB");
const MONGODB_CONNECT_URI="mongodb+srv://adarshrajyadav68:tesrect7@cluster0.ymcx3jk.mongodb.net/userDB";
mongoose.connect(process.env.MONGODB_CONNECT_URI);
mongoose.connect("mongodb+srv://adarshrajyadav68:tesrect7@cluster0.ymcx3jk.mongodb.net/userDB");
//mongoose.set("useCreateIndex",true);
const userschema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});
userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);
const User= mongoose.model("User",userschema);
passport.use(User.createStrategy());
passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id)
      .then(function (user) {
        done(null, user);
      })
      .catch(function (err) {
        done(err, null);
      });
  });
  passport.use(new googlestrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL:process.env.CALLBACKURL
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function(err, user) {
      return cb(err, user);
    });
  }));
  
app.get("/",function(req,res){
    res.render("home");

});
app.get("/auth/google",
passport.authenticate("google",{scope:["profile"]}) //not able to host the website on render.com

);
app.get("/auth/google/secrets",
passport.authenticate("google",{failureRedirect:"/login"}),function(req,res){
    res.redirect("/secrets");
});
app.get("/login",function(req,res){
    res.render("login");

});
app.get("/register",function(req,res){
    res.render("register");

});
app.get("/secrets", function(req, res) {
    User.find({ secret: { $ne: null } })
      .exec()
      .then(function(foundUsers) {
        if (foundUsers) {
          res.render("secrets", { userswithsecret: foundUsers });
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  });
  
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});
app.post("/submit", function(req, res) {
    if (req.isAuthenticated()) {
      const submittedSecret = req.body.secret;
      console.log(req.user);
      User.findById(req.user.id)
        .exec()
        .then(function(foundUser) {
          if (foundUser) {
            foundUser.secret = submittedSecret;
            return foundUser.save();
          }
        })
        .then(function() {
          res.redirect("/secrets");
        })
        .catch(function(err) {
          console.log(err);
        });
    } else {
      res.redirect("/login");
    }
  });
  
  
  
app.get("/logout", function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.log(err);
      }
      res.redirect("/");
    });
  });
  
app.post("/register",function(req,res){
    
User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
});
});
app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
   req.login(user,function(err){if(err){
    console.log(err);
   }
else{
    passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
    });
}
});
});
app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port " + (process.env.PORT || 3000));
  });
  