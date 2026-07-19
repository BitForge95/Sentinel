const mongoose = require('mongoose');
const { Schema } = mongoose; 
const bcrypt = require('bcrypt')

const userSchema = new Schema({
    username : {type : String , required : true , unique : true, trim : true},
    email : {type : String , required: true, unique  :true},
    password : {type : String , required : true},
    role : {type : String, default : 'Analyst'},
},{timestamps : true});


userSchema.pre('save',async function(next) {
    if(!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10)

    this.password = await bcrypt.hash(this.password,salt)

    return next();
});

userSchema.methods.matchPassword = async function(enteredPasswrod) {
    return await bcrypt.compare(enteredPasswrod,this.password);
}

module.exports = mongoose.model('User',userSchema);