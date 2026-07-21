const User = require('../models/User')
const generateToken = require('../utilis/generateToken')

const registerUser = async (req,res) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({email : email});

    if(user) {
        return res.status(404).json({error : "Username not found"});
    }

    try {
        const newUser = await User.create({
            username : username,
            email : email,
            password : password,
        })

        const authToken = await generateToken(res,newUser._id);

        res.status(201).json({ _id: newUser._id, username: newUser.username, email: newUser.email });
    } catch (error) {
        res.status(500).json({error : "User not created"});
    }

}

const loginUser = async (req,res) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const oldUser = await User.findOne({email : email});
    
    if(!oldUser) {
        return res.status(404).json({error : "User Not Found"});
    }

    const passwordMatch = await oldUser.matchPassword(password);

    if(!passwordMatch) {
        return res.status(400).json({error : "Password Incorrect"});
    }

    try {    
        const authToken = await generateToken(res,oldUser._id);
    
        res.status(200).json({ _id: oldUser._id, username: oldUser.username, email: oldUser.email });
    } catch (error) {
        res.status(400).json({error : error.message});
    }  
}

const logoutUser = async (req,res) => { 
    res.cookie('jwt', '', { maxAge: 0 }).status(200).json({ message: "Logged out successfully" })
}

module.exports() = {registerUser,loginUser,logoutUser};