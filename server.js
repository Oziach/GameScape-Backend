import express  from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from 'cors';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import User from "./models/User.js";
import Comment from "./models/Comment.js";
import LikeDislikeRouter from './LikeDislikeRoutes.js';
import CommunityRouter from './CommunityRoutes.js'
import { getUserFromToken } from "./QOLFunctions.js";

const secret = 'secret123';
const app = express();
await mongoose.connect('mongodb+srv://group211:qwertyui123@cluster0.f3oyaxg.mongodb.net/gamersCommunityDB');
var db = mongoose.connection;
db.on("open", ()=>console.log("Connected to database"));
db.on("error", ()=>console.log("Error occured"));

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (true) {
        callback(null, true)
    }
  },
credentials: true,
}))

app.use('/', LikeDislikeRouter)
app.use(CommunityRouter);

app.get('/', (req,res)=>{
    User.find()
    .then((data)=>{
        res.json(data);
    })
    .catch(err=>alert(err));
})

app.post('/register', (req, res) => {
    const {email,username} = req.body;
    const password = bcrypt.hashSync(req.body.password, 10);
    const user = new User({email,username,password});
    user.save()
    .then((user)=>{
        jwt.sign({id:user._id}, secret, (err, token) => {
            if(err){
                console.log(err);
                res.sendStatus(500);
            }
            else{
                res.status(201).cookie('token', token).send();
            }
            
        })
    })
    .catch((e => {
        console.log(e);
        res.sendStatus(500);
    }))
})

app.get('/user', (req, res) => {

    const token = req.cookies.token;
  
    if(token){
      getUserFromToken(token)
      .then(user => {
        res.json({username:user.username, moderator:user.moderator});
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(200);
      });
    }

  
  });

app.post('/login', (req, res) => {
  const {username, password} = req.body;
  User.findOne({username}).then(user => {
    if (user && user.username) {
      const passOk = bcrypt.compareSync(password, user.password);
      if (passOk) {
        jwt.sign({id:user._id}, secret, (err, token) => {
          res.cookie('token', token).json({username: user.username, moderator:user.moderator}).send();
        });
      } else {
        res.status(422).json('Invalid username or password');
      }
    } else {
      res.status(422).json('Invalid username or password');
    }
  });
});

app.post('/logout', (req,res)=>{
    res.cookie('token','').send();
});

app.get('/comments', (req,res)=>{
  const sort = req.query.sort === 'new'
  ? {postedAt: -1}
  : {likes: -1, dislikes:1};
  const community = req.query.community;
  const search = req.query.search
  const filters = search 
  ? {rootId:null, title:{$regex: '.*'+search+'.*', $options: 'i'}}
  : {rootId: null}
  filters.community=community;
  Comment.find(filters).sort(sort)
  .then((comments)=>{
    res.json(comments);
  })
});

app.get('/comments/:id', (req,res)=>{

  Comment.findById(req.params.id).
  then((comment)=>{
    res.json(comment);
  })
});



app.get('/comments/root/:rootId', (req, res)=>{

  const sort = req.query.sort === 'new'
  ? {postedAt: -1}
  : {likes: -1, dislikes:1};

  Comment.find({rootId:req.params.rootId}).sort(sort)
  .then((comments)=>{
    res.json(comments);
  })
  .catch()
})

app.post('/comments/edit', (req,res)=>{
  const token = req.cookies.token;

  if(!token){
    res.sendStatus(401);
    return;
  }


  getUserFromToken(token)
  .then(userInfo=>{
    const {commentId,title, body,} = req.body;
    Comment.findOneAndUpdate({_id:commentId, author:userInfo.username}, {title:title, body:body})
    .then((updated)=>{
      if(updated){
          res.sendStatus(201)
      }
      else{
        res.sendStatus(404);
      }
    })
  })
})


app.post('/comments', (req,res)=>{
  const token = req.cookies.token;
  if(!token){
    res.sendStatus(401);
    return;
  }

  getUserFromToken(token)
  .then(userInfo =>{
    const {title, body, parentId, rootId,communityName} = req.body;
    const comment = new Comment({
      title:title,
       body:body, 
       author:userInfo.username, 
       postedAt:new Date(),
       parentId,
       rootId,
       likes: 0,
       dislikes:0,
       community:communityName,
    });
    comment.save()
    .then((savedComment)=>{
      res.status(201).json(savedComment);
    })
    .catch(console.log);
    })
  .catch(() => {
    res.sendStatus(401);
  })
})

app.post('/comment/delete', (req, res)=>{

  const token = req.cookies.token;
  if (!token){
    res.sendStatus(401);
    return;
  }

  const {commentId} = req.body;

  getUserFromToken(token)
  .then((userInfo)=>{
    Comment.findById(commentId)
    .then((comment)=>{
      if(userInfo.username === comment.author){
        Comment.findByIdAndDelete(commentId)
        .then(()=>{
          res.sendStatus(200);
        })
      }
    })
  })
})

app.listen(4000, ()=>{console.log("Started server at 4000")});