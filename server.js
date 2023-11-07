import express  from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from 'cors';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import User from "./models/User.js";

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
    origin: 'http://localhost:3000',
    credentials: true,
}))


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

function getUserFromToken(token) {
    const userInfo = jwt.verify(token, secret);
    return User.findById(userInfo.id);
  }

app.get('/user', (req, res) => {
    const token = req.cookies.token;
  
    getUserFromToken(token)
      .then(user => {
        res.json({username:user.username});
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  
  });

app.post('/login', (req, res) => {
  const {username, password} = req.body;
  User.findOne({username}).then(user => {
    if (user && user.username) {
      const passOk = bcrypt.compareSync(password, user.password);
      if (passOk) {
        jwt.sign({id:user._id}, secret, (err, token) => {
          res.cookie('token', token).send();
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
})

app.listen(4000, ()=>{console.log("Started server at 4000")});