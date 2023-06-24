//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
console.log(process.env.API_KEY);
const mongoose = require('mongoose');
const encryption = require('mongoose-encryption');

mongoose.connect("mongodb://127.0.0.1:27017/userDB");
const userschema=new mongoose.Schema({
    email:String,
    password:String
});

userschema.plugin(encryption,{secret:process.env.SECRET,encryptedFields:['password']});
const User= mongoose.model("User",userschema);
app.get("/",function(req,res){
    res.render("home");

});
app.get("/login",function(req,res){
    res.render("login");

});
app.get("/register",function(req,res){
    res.render("register");

});
app.post("/register",function(req,res){

  const newuser=new User({
    email:req.body.username,
    password:req.body.password
  });
  newuser.save().then(function(response){
    res.render("secrets");
  });
});
app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({email:username}).then(function(founduser){
        if(founduser){
            if(founduser.password===password){
                res.render("secrets");
            }
        }
    });
});

app.listen(3000,function(){
    console.log("server started on port 3000.");
});