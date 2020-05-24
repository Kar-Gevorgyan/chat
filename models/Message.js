const { Schema, model, Types } = require('mongoose')

const messageSchema = new Schema({
    message: {type: String},
    date: {type: Date, default: Date.now()},
    author: [{ type: Types.ObjectId, ref: 'User'}]
})

exports.Message = model('message', messageSchema)