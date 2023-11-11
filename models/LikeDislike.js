import mongoose from "mongoose";

const LikeDislike = mongoose.model('LikeDislike', new mongoose.Schema({
    author: {type:String, required:true},
    commentId: {type:mongoose.ObjectId, required:true},
    which: {type:String, required:true}
}));

export default LikeDislike;