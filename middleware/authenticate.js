import jwt from "jsonwebtoken";

const authenticate=async(req,res,next)=>{
    try{
    
    if(!req.cookies || !req.cookies.token){return res.redirect("/sign-up")}
        
    const token=req.cookies.token;

    if(!token){res.redirect("/sign-up")}

    const verify=jwt.verify(token,process.env.TOKEN_SECRET);

    if(verify){
        req.user=verify;
        return next()
    }else{
        res.redirect("/sign-up")
    }}catch(err){
        console.log("some error in authenticating the token of user:",err);
        return res.render("/sign-up");
    }
}

export default authenticate;