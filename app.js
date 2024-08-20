const express=require('express');
const app=express();
const userModel=require("./models/user.js");
const postmodel=require("./models/posts.js");
const cookieParser = require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.set("view engine","ejs");
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));


app.get("/",(req,res)=>{
    res.render("index");
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/profile",isLoggedin,async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate("posts");
    
    res.render("profile",{user});
})


app.get("/like/:id", isLoggedin, async (req, res) => {
    try {
        // Get the post ID from the URL
        const postId = req.params.id;

        // Find the post by its ID
        let post = await postmodel.findOne({_id: postId}).populate("user");

        // Check if the user has already liked the post
        const userIdIndex = post.likes.indexOf(req.user.userid);

        if (userIdIndex === -1) {
            // If not liked, add the user's ID to the likes array
            post.likes.push(req.user.userid);
        } else {
            // If already liked, remove the user's ID from the likes array
            post.likes.splice(userIdIndex, 1);
        }

        // Save the updated post
        await post.save();

        // Redirect to the profile page
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while liking the post.");
    }
});




app.post("/post",isLoggedin,async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    let {content}=req.body;
   let post =await  postmodel.create({
        user:user._id,
        content:content
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

})



app.post("/register",async function(req,res){
    let {email,password,username,name,age}=req.body;
    let user=await userModel.findOne({email});

    if(user) return res.status(500).send("already registerd");


    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async(err,hash)=>{
           let user=await userModel.create({
            username,
            email,age,name,password:hash
           });

         let token=  jwt.sign({email:email,userid:user._id},"yash");
         res.cookie("token",token);
         res.send("registered");
        })
    })


});     


app.post("/login",async function(req,res){
    let {email,password}=req.body;
    let user=await userModel.findOne({email});

    if(!user) return res.status(500).send("wrong");


    bcrypt.compare(password,user.password,function(err,result){
        if(result) {
            let token=  jwt.sign({email:email,userid:user._id},"yash");
         res.cookie("token",token);
         res.status(200).redirect("/profile");
        }
        else{
           
            res.redirect("/login");
        }
    })

}); 


app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})


function isLoggedin(req,res,next){
    if(req.cookies.token==="")res.redirect("/login");
    else{
       let data=jwt.verify(req.cookies.token,"yash");
       req.user=data;
    }
    next();
}


app.get("/post/create",async function(req,res){
    let post=await postmodel.create({
        postdata:"namskar ji",
        user:"66c32fcee036f52a3deabc30",

    })
    let user=await userModel.findOne({_id:"66c32fcee036f52a3deabc30"});
    user.posts.push(post._id);
   await user.save();
    res.send({post,user});
})


app.listen(3000);