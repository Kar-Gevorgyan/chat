const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = 3000;
let users = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res)=>[
    res.sendFile(__dirname + '/index.html')
]);

io.on('connection', (socket)=>{
    socket.on('login', (data)=>{
        const user = users.find((nickname)=>{
            return nickname === data
        })

        if(!user){
            users.push(data);
            socket.nickname = data;
            io.sockets.emit('login', {status: "OK"});
            io.sockets.emit('users', {users})
        }else{
            io.sockets.emit('login', {status: "FAILED"})
        }
    });

    socket.on('message', (data)=>{
        io.sockets.emit('new message', {
            nickname: socket.nickname,
            message: data,
            time: new Date()
        })
    });

    socket.on('disconnect', (data)=>{
        for (let i = 0; i < users.length; i++){
            if(users[i] === socket.nickname){
                users.splice(i, 1)
            }
        }
        io.sockets.emit('users', {users})
    })
});

server.listen(port, ()=>{
    console.log(`Server connected on port ${port}`)
});