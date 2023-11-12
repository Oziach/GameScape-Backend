import mongoose from "mongoose";

const Community = mongoose.model('Community', new mongoose.Schema({
    name: {type:String, required:true},
    title: {type:String, required: true},
    iconImage: {type:String, required: false},
    cardImage: {type:String, required: false},
}))

export default Community;