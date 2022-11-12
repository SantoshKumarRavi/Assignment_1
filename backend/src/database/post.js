const mongoose = require('mongoose');
const user=require("./user")
const postSchema = new mongoose.Schema({
    title: String,
    body:String,
    image:String,
    user:{type:mongoose.Schema.Types.ObjectId,ref:user}
  });

  const post = mongoose.model('post', postSchema);
  module.exports=post
