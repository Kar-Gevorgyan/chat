const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mongoose = require('mongoose')
const config = require('config')
const { User, registerValidate, loginValidate } = require('./models/User')
const { Message } = require('./models/Message')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
let onlineUsers = []

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res)=>[
    res.sendFile(__dirname + '/index.html')
]);

io.on('connection', (socket)=>{
    socket.on('register', async (data)=>{
        try{
            const {error} = registerValidate(data)
            if(error){
                io.sockets.emit('register', {status: "FAILED", message: error.details[0].message})
                return
            }

            const {nickname, email, password} = data

            const candidate = await User.findOne({ email })
            if(candidate){
                io.sockets.emit('register', {status: "FAILED", message: 'User already registered.'})
                return
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            const user = new User({ nickname, email, password: hashedPassword})
            await user.save()

            onlineUsers.push({
                _id: user._id,
                nickname: user.nickname
            })
            const users = await User.find().select('nickname')

            const allMessages = await Message.find().select('message author date').sort('date')
            for(message of allMessages){
                const dateOptions = {year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit', hour12: false}
                const date = message.date.toLocaleString('en-GB', dateOptions)

                const author = await User.findById(message.author[0], 'nickname')
                
                io.sockets.emit('all messages', {authorId: author._id, author: author.nickname, message: message.message, messageId: message._id, date})
            }

            const token = jwt.sign({ userId: user.id, nickname: user.nickname}, config.get('jwtPrivateKey'))
    
            socket.token = token;

            io.sockets.emit('register', {status: "OK", userId: user.id, userNickname: user.nickname})
            io.sockets.emit('users', {users, onlineUsers})
        }catch(e){
            console.log(e.message)
            io.sockets.emit('register', {status: "FAILED", message: 'Something went wrong. Try again.'})
            return
        }
    });

    socket.on('login', async (data)=>{
        try {
            const {error} = loginValidate(data)
            if(error){
                io.sockets.emit('login', {status: "FAILED", message: error.details[0].message})
                return
            }
    
            const { email, password } = data
    
            const user = await User.findOne({ email })
            if(!user){
                io.sockets.emit('login', {status: "FAILED", message: 'Invalid email or password.'})
                return
            }
    
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch){
                io.sockets.emit('login', {status: "FAILED", message: 'Invalid email or password.'})
                return
            }

            const token = jwt.sign({ userId: user.id, nickname: user.nickname}, config.get('jwtPrivateKey'))
    
            socket.token = token;

            onlineUsers.push({
                _id: user._id,
                nickname: user.nickname
            })
            const users = await User.find().select('nickname')
            
            const allMessages = await Message.find().select('message author date').sort('date')
            for(message of allMessages){
                const dateOptions = {year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit', hour12: false}
                const date = message.date.toLocaleString('en-GB', dateOptions)

                const author = await User.findById(message.author[0], 'nickname')
                
                io.sockets.emit('all messages', {author: author.nickname, authorId: author._id, message: message.message, messageId: message._id, date})
            }

            io.sockets.emit('login', {status: "OK", userId: user.id, userNickname: user.nickname})
            io.sockets.emit('users', {users, onlineUsers})
        } catch (e) {
            io.sockets.emit('login', {status: "FAILED", message: 'Something went wrong. Try again.'})
            return
        }
    });

    socket.on('new message', async (data)=>{
        if(data === '') return
        const token = socket.token
        const user = await jwt.verify(token, config.get('jwtPrivateKey'))
        const message = new Message({
            message: data,
            author: user.userId
        })
        await message.save()

        const dateOptions = {year: "numeric", month: "2-digit", day: "2-digit", hour: '2-digit', minute: '2-digit', hour12: false}
        const date = message.date.toLocaleString('en-GB', dateOptions)
        
        io.sockets.emit('message', {author: user.nickname, authorId: user._id, message: message.message, messageId: message._id, date})
    });

    socket.on('logout', ()=>{
        logout()    
    })

    socket.on('disconnect', ()=>{
        logout()
    })

    logout = async () => {
        try {
            const token = socket.token
            const user = await jwt.verify(token, config.get('jwtPrivateKey'))
            for (let i = 0; i < onlineUsers.length; i++){
                if(String(onlineUsers[i]._id) === user.userId){
                    onlineUsers.splice(i, 1)
                }
            }
            const users = await User.find().select('nickname')

            io.sockets.emit('users', {users, onlineUsers})
        }catch{}
    }
});

const PORT = config.get('port')

mongoose.connect(config.get('mongoURI'), {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
    .then(()=> {
        console.log('Connected to MongoDB...')
        server.listen(PORT, ()=>{
            console.log(`Server connected on port ${PORT}`)
        });
    })
    .catch((err)=> console.log('Could not connected to MongoDB...', err))

