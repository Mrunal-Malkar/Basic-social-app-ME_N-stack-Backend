import express, { urlencoded } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "./models/user.js";
import dotenv from "dotenv";
import authenticate from "./middleware/authenticate.js";
import cookieParser from "cookie-parser";
import { verify } from "crypto";
import { runInNewContext } from "vm";
import postModel from "./models/post.js";
import { userInfo } from "os";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.post("/signing-up", async (req, res) => {
  let { username, email, password } = req.body;

  let saltrounds = 10;
  let hashedpassword = await bcrypt.hash(password, saltrounds);

  if (!hashedpassword) {
    return null;
  }
  try {
    const newuser = await userModel.create({
      username: username,
      email: email,
      password: hashedpassword,
    });

    const token = await jwt.sign(
      { username: username, email: email },
      process.env.TOKEN_SECRET,
      { expiresIn: "168h" }
    );
    res.cookie("token", token);
    if (token) {
      res.redirect("/home");
    }
  } catch (err) {
    console.log("error in signing up or assigning token", err);
    if (!token) {
      console.log("error in token creation");
      res.render("sign-up");
    }
  }
});

app.post("/loging-in", async (req, res) => {
  try {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username: username });
    if(!user){return res.send("incorrect username or password!!")}
    let verify = await bcrypt.compare(password, user.password);
  
    if (verify) {
      const token = await jwt.sign(
        {username:username,email:user.email},
        process.env.TOKEN_SECRET
      );
      if (!token) {
        return res.send("error in token creation");
      }
      res.cookie("token",token,{expiredIn:"168h"});
      res.redirect("/home");
      res.send("hello")
    }
    res.send("incorrect username or password"); 
  } catch (err) {
    console.log("error in login:", err);
  } 
});

app.get("/log-out",(req,res)=>{
  res.cookie("token","");
  res.redirect("/log-in");
})

app.get("/log-in", (req, res) => {
  res.render("login");
});   
 
app.post("/newpost",authenticate,async(req,res)=>{
  try{
  let {email}=req.user;
  let newpost=new postModel({
    content:req.body.content,
    user:(await userModel.findOne({email:email})._id),
  })  
  console.log("this is the content:",req.body.content);
  await newpost.save();
  await userModel.findOneAndUpdate({email:email},{$push:{posts:(newpost._id)}});
  res.redirect("/home");
  console.log("succesfully added post!");
}catch(err){
  console.log("failed to add post:",err)
  res.status(404).statusMessage("failed to add post");
}
})

app.get("/home", authenticate, async (req, res) => {
  try {  
    let emailofuser = req.user.email;
    let user = await userModel.findOne({ email: emailofuser });
    if (!user) {
      return res.status(404).send("User not found");
    } 
    let username = user.username;
    let email = user.email;

    let userWithPopulatedPost=await user.populate("posts");
    let userWithOnlyPopulatedPost=userWithPopulatedPost.posts.filter((post)=>(post.content)); 
    let allPostContent=userWithOnlyPopulatedPost.map((post)=>{return post.content});  
    res.render("home", { username, email, allPostContent}); 
  } catch (error) { 
    console.error("something went wrong at home page",error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/edit-username",(req,res)=>{
  let {username}=req.body;
  res.render("editusername",{username});
})

app.post("/editingusername",authenticate,async(req,res)=>{
  let {newusername}=req.body;
  let email=req.user.email;
  let user=await userModel.findOneAndUpdate({email:email},{username:newusername});
  console.log("succesfully edited username!");
  res.redirect("/home") 
})

app.get("/", authenticate, (req, res) => {
  res.redirect("/home");
});

app.listen(3000, () => {
  console.log("your app is running");
});
