const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function Protect(req,res,next) {
    let token = req.cookies.auth_token;

    if(!token) {
        return res.status(401).json({error : "Not authorized, no token"})
    }

    try {
        const decodeToken = jwt.verify(token,process.env.JWT_SECRET);
        
        const authUserId = decodeToken.id;

        const userAuth = await User.findById(authUserId).select('-password');

        if (!userAuth) {
            return res.status(401).json({error: "User not found"});
        }       

        req.user = userAuth;

        next();
    } catch (error) {
        res.status(401).json({error : "Not authorized, token failed"});
    }
}

const AdminOnly = async (req,res,next) => {
    if(req.user && req.user.role == 'Admin') {
        next();
    } else{
        res.status(403).json({ error: "Access denied: Admins only" });
    }
}

module.exports = {Protect,AdminOnly};