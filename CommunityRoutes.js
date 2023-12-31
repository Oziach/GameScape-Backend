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
            if(!req.body.token) {res.sendStatus(401);return;}
            getUserFromToken(req.body.token)
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

router.get('/communities', (req,res)=>{
    const search = req.query.search ;
    const filters = search 
    ? {$or:[{name:{$regex: '.*'+search+'.*', $options: 'i'}},
            {title:{$regex: '.*'+search+'.*', $options: 'i'}}]}
    : {};
    Community.find(filters)
    .then((communities)=>{
        res.json(communities);
    })
})

router.get('/communities/:name', (req,res)=>{
    const {name} = req.params;
    Community.findOne({name})
    .then((community)=>{
        if(community){
            res.json(community);
        }
        else{
            res.sendStatus(404);
        }

    })
})

export default router;