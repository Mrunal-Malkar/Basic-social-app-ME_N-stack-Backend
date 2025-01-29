import mongoose from "mongoose";
const connectDB=async()=>{
    await mongoose.connect("mongodb://127.0.0.1:27017/user");
}
connectDB();

const postSchema=new mongoose.Schema({
    like:Boolean,
    content:String,
    user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},   
})

const postModel=mongoose.model("post",postSchema);

export default postModel