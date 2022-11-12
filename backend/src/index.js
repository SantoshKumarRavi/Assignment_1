const express = require('express')
const app = express()
const port = 3000

//body-parser
let bodyParser=require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

//cors
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
//db
const mongoose = require('mongoose');

//connect db
async function main() {
  await mongoose.connect('mongodb://localhost:27017/Assignment',()=>{
    console.log("connected to db")
  });
}
main().catch(err => console.log(err));

//import scehema 
const user=require("./database/user")

//hash
const bcrypt = require("bcrypt")

app.post('/register', (req, res) => {
  const {password}=req.body
  bcrypt.hash(String(password), 10, function(err, hash) {
    // console.log(hash)
    if(err){
    }
    let updatedWithHash={...req.body,password:hash}
    const registeredUser=new user(updatedWithHash)
    registeredUser.save(function(err,data){
      if(err){
          res.send("You are already registered..sign in")//duplicates present in emai
      }else{
        res.send(data)
      }
      // console.log(data)
    })
  })
    // console.log(req.body)
    
})
const secret="USERCODERED"
var jwt = require('jsonwebtoken');
app.post('/login', (req, res) => {
  const {password,email}=req.body
  user.find({ email: email}, function (err, data) {
    if (err){
        console.log(err);
        return 
    }
    else{
      // console.log(data)/
      if(data.length==0){
        res.send(`${email} does not exist`)
        return
      }
       let dbpassword= data[0]?.password
      //  console.log("db pass", dbpassword);
        bcrypt.compare(String(password), dbpassword, function(err, result) {
          if (result) {
             // password is valids
             let token1=jwt.sign({
              email:email,
              password:dbpassword
            },secret);
          res.json({status:"sucess",token:token1})
         }
         if(!result){
          res.send("incorrect")
         }
      });
    }
});
  })



//middlewqare authorization
app.use('/posts', (req, res,next) => {
    // res.send('Hello World!')
    let token=(req?.headers?.authorization)
    if(!token){
      res.send("not authenticated")
      return
    }
    jwt.verify(token, secret, function(err, decoded) {
      // console.log(decoded) // bar;;
      if(!decoded){
        res.send("not authenticated")
        return
      }else{
          // console.log(decoded);;
          req.email=decoded.email
          next()
      }
      
    });
  })

//create post
//import postschema
const post=require("./database/post")
app.post('/posts', (req, res) => {
  const {body,title,image}=req.body
  const email=(req.email)
//finding user and his id
user.find({ email: email}, function (err, data) {
  if (err){
      console.log(err);
      return 
  }
  else{
    // console.log("users data")
    // console.log(data)
    if(data.length==0){
      res.send(`${email} does not exist`)
      return
    }else{
      //found user id ;
      const userId=data[0]._id
      const userPost=new post({...req.body,user:userId})
  
      userPost.save(function(err,data){
        if(err){
          console.log("err",err)
        }
        if(data){
          //post id
         let postId=data._id.valueOf()
         res.send({status:"post created",
         data:{
         ...req.body,
          user:userId,
          post:postId
        }
        })

        }

      })


    // })
    }

  }})
//  res.send("sucess")
})


//delete post
app.delete('/posts/:id', (req, res) => {
  const {id}=req.params

  let postObjectId = mongoose.Types.ObjectId(id);
  post.find({ _id: postObjectId}, function (err, data) {
    if (err){
        console.log(err);
        return 
    }
    if(data.length==0){
      res.send("id is to valid")
      return
    }
    if(data){
      let postUserId=(data[0].user).valueOf()
    //requested jwt data userId
    user.find({ email: req.email}, function (err, data) {
      if (err){
          console.log(err);
          return 
      }
      if(data){
      let requestedUserId=(data[0]._id).valueOf()
      if(postUserId==requestedUserId){
       post.deleteOne({ _id:postObjectId },()=>{
        res.send("deleted ")
       });

      }else{
        res.send("you are not authorize to delete this post")
      }

      }

    })
    }
  })
})
//get individual post data with authentication and filter 
app.get('/posts', (req, res) => {
  post.find({}, function (err, postData) {
    if (err){
        console.log(err);
        return 
    }
    if(!postData){
      res.send("no data found")
    }else{
      user.find({ email: req.email}, function (err, userData) {
        if (err){
            console.log(err);
            return 
        }
        if(userData){
        let requestedUserId=(userData[0]._id).valueOf()
            let fileterdData=postData.filter((ele)=>((requestedUserId)==(ele.user)))
            res.send(fileterdData)
            return
        }else{
          res.send("no user found")
        }})


    }
  })
})

//get all post data without authentication // how can i get ths type without authenticatiuon in /posts route
app.get('/postdatas', (req, res) => {
  post.find({}, function (err, data) {
    if (err){
        console.log(err);
        return 
    }
    if(!data){
      res.send("no data found")
    }else{
      res.send(data)
    }
  })
})


//update
app.put('/posts/:id', (req, res) => {
  const {id}=req.params
  // console.log(id)
  // let obj={...req.body}
  // console.log(req.body)
  if(JSON.stringify(req.body)=="{}"){
    res.send("nothing is to be updated.. provide data")
    return
  }

  //not working with object checking size with loop // Discus in GM
  // for(let i in obj){
  //   console.log(obj.hasOwnProperty(i))
  //   if(i==undefined){
  //     res.send("nothing is to be updated.. provide data")
  //     return
  //   }else{//
  //     break
  //   }
  // }

  let postObjectId = mongoose.Types.ObjectId(id);
  post.find({ _id: postObjectId}, function (err, data) {
    if (err){
        console.log(err);
        return 
    }
    if(data.length==0){
      res.send("id is to valid")
      return
    }
    if(data){
      //post data with userid
      // console.log("post ",data)
      let postUserId=(data[0].user).valueOf()
    //requested jwt data userId
    user.find({ email: req.email}, function (err, data) {
      if (err){
          console.log(err);
          return 
      }
      if(data){
      let requestedUserId=(data[0]._id).valueOf()

      if(postUserId==requestedUserId){
        post.findOneAndUpdate({ _id: postObjectId}, req.body, {upsert: true}, function(err, doc) {
          if (err) return res.send(500, {error: err});
          return res.send('Succesfully saved...');
      });

      }else{
        res.send("you are not authorize to update this post")
      }

      }

    })
    }
  })
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})