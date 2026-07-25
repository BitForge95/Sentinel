const jwt = require('jsonwebtoken')

const generateToken = async (res,userId) => {
    const authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn : '2h' });

    res.cookie('auth_token',authToken,{
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : 'strict',
        maxAge : 7200000,
    })
}

module.exports = {generateToken}