const jwt = require('jsonwebtoken')

const generateToken = async (req,res,userId) => {
    const authToken = jwt.sign(userId,process.env.JWT_SECRET,{expiresIn : '2h'});

    res.cookie('auth_token',authToken,{
        httpOnly : true,
        secure : true,
        sameSite : 'strict',
        maxAge : 7200000,
    })
}

module.exports = {generateToken}