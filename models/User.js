import mongoose from "mongoose";

const User = mongoose.model('User', new mongoose.Schema({
    email: {type:String},
    username: {type:String},
    password: {type:String}
}))

export default User;