$(()=>{
    const socket = io.connect();

    const nickname = $('#nickname');
    const loginForm = $('.login-form');
    const messageForm = $('.message-form');
    const messagesList = $('.messages-list');
    const usersList = $('.users-list');
    const errorLogin = $('.error-login');
    const message = $('#message');

    loginForm.submit((e)=>{
        e.preventDefault();
        socket.emit('login', nickname.val())
    });

    messageForm.submit((e)=>{
        e.preventDefault();
        socket.emit('message', message.val());
        message.val('')
    });

    socket.on('login', (data)=>{
        if(data.status === "OK"){
            loginForm.addClass('d-none');
            messageForm.removeClass('d-none');
            messagesList.removeClass('d-none');
            usersList.removeClass('d-none')
        }else{
            errorLogin.html(` ${nickname.val()} is already connected`)
        }
    });

    socket.on('new message', (data)=>{
        const newMsg = `<a class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">${data.nickname}</h5>
                                <small class="text-muted">${(data.time).replace(/([^T]+)T([^\.]+).*/g, '$1 $2')}</small>
                            </div>
                            <p class="mb-1">${data.message}</p>
                        </a>`;

        messagesList.children('div').children('ul').append(newMsg)
    });

    socket.on('users', (data)=>{
        usersList.children('div').children('ul').html('');
        for (let i = 0; i< data.users.length; i++){
            usersList.children('div').children('ul').append(`<li class="list-group-item">${data.users[i]}</li>`)
        }
    })
});