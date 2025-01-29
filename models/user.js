import mongoose from "mongoose";

const connectDB=async()=>{
  await mongoose.connect("mongodb://127.0.0.1:27017/user"); 
}
connectDB();

const userSchema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    date:{type:Number,default:Date.now},
    profileimage:String,
    posts:[{type:mongoose.Schema.Types.ObjectId,ref:"post",}]
});

const userModel=mongoose.model("user",userSchema);

export default userModel