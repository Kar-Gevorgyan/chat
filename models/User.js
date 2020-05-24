const { Schema, model } = require('mongoose')
const Joi = require('joi')

const userSchema = new Schema({
    nickname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

exports.User = model('User', userSchema)

exports.registerValidate = function(user){
    schema = {
        nickname: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(5)
    }
    return Joi.validate(user, schema)
}

exports.loginValidate = function(user){
    schema = {
        email: Joi.string().required().email(),
        password: Joi.string().required().min(5)
    }
    return Joi.validate(user, schema)
}