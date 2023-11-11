import express from "express";
import { getUserFromToken } from "./QOLFunctions.js";
import LikeDislike from "./models/LikeDislike.js";
import Comment from "./models/Comment.js";

const router = express.Router();

router.get('/likedislike/:commentId/:which', (req,res)=>{

    if(!req.cookies.token){
        res.sendStatus(401);
    }

    getUserFromToken(req.cookies.token)
    .then((userInfo)=>{

        LikeDislike.findOne({commentId:req.params.commentId,author:userInfo.username})
        .then(existing => {
            const existingWhich = existing ? existing.which : null;
            LikeDislike.deleteOne({commentId:req.params.commentId, author:userInfo.username})
            .then(()=>{
                console.log(existingWhich);
                if(existingWhich === 'like') {
                    Comment.findOneAndUpdate({_id:req.params.commentId}, {$inc:{likes : -1}}, {new:true}).
                    then((updated) => console.log(updated));
                }
                else if(existingWhich === 'dislike'){
                    Comment.findOneAndUpdate({_id:req.params.commentId}, {$inc:{dislikes : -1}}, {new:true}).
                    then((updated) => console.log(updated));
                }

                if(existing && existing.which === req.params.which){
                    res.sendStatus(200);
                }
                
                else 
                {       
                    //creating new
                    const likeDislike = new LikeDislike({
                        author: userInfo.username,
                        which: req.params.which,
                        commentId: req.params.commentId,    
                    });
            
                    likeDislike.save()
                    .then(()=>{
                        LikeDislike
                        .find({commentId: req.params.commentId,})
                        .then(commentLikeDislikes =>{
                            console.log(req.params.which);
                            if(req.params.which === 'like') {
                                Comment.findOneAndUpdate({_id:req.params.commentId}, {$inc:{likes : 1}}, {new:true}).
                                then((updated) => console.log(updated));
                            }
                            else{
                                Comment.findOneAndUpdate({_id:req.params.commentId}, {$inc:{dislikes : 1}}, {new:true}).
                                then((updated) => console.log(updated));
                            }
                            let likes = 0, dislikes = 0;
                            commentLikeDislikes.forEach(likeDislike=>likeDislike.which == 'like' ? likes++ : dislikes++);
                            res.json({likes,dislikes})  ;
                        })
                    })
                }
                
            })
        })

    })
})

router.post('/likesdislikes', (req,res)=>{
    const {commentsIds} = req.body;
    
    LikeDislike.find({commentId: {$in:commentsIds}})
    .then((likesDislikes)=>{
        let commentsTotals = {};
        likesDislikes.forEach(likeDislike =>{
            if(typeof commentsTotals[likeDislike.commentId] === 'undefined') {
                commentsTotals[likeDislike.commentId] = {likes:0,dislikes:0}
            }
            likeDislike.which == 'like' ?
            commentsTotals[likeDislike.commentId].likes ++ :
            commentsTotals[likeDislike.commentId].dislikes ++;
        })

        let userLikesDislikes = {};

        if(req.cookies.token){
            getUserFromToken(req.cookies.token)
            .then(()=>{
    
                likesDislikes.forEach(likeDislike => {
                    if (likeDislike.author === userInfo.username) {
                        userLikesDislikes[likeDislike.commentId] = likeDislike.which; 
                    }
                })
            })
        }
        
        res.json({commentsTotals, userLikesDislikes});
    })

    })


export default router;