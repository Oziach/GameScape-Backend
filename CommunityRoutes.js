import express  from "express";
import Community from "./models/Community.js";
import { getUserFromToken } from "./QOLFunctions.js";
const router = express.Router();

router.post('/communities', (req,res)=>{
    const {name, title, iconImage, cardImage} = req.body;
    Community.exists({name})
    .then(exists=>{
        if(exists){
            res.status(409).json('community already exists');
        }
        else{
            getUserFromToken(req.cookies.token)
            .then((userInfo)=>{
                if(userInfo && userInfo.moderator){
                    const community = new Community({name,title,iconImage,cardImage});
                    community.save()
                    .then(()=>{
                        res.status(201).json('');
                    })
                }
                else{
                    res.status(401);
                }
            })
        }
        
    })
})

router.get('/communities/:name', (req,res)=>{
    const {name} = req.params;
    Community.findOne({name})
    .then((community)=>{
        res.json(community);
    })
})

export default router;