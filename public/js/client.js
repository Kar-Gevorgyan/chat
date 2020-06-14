$(()=>{
    const socket = io.connect();

    const loginBtn = $('#menu_btn_login')
    const registerBtn = $('#menu_btn_register')
    const loginForm = $('.login-form');
    const registerForm = $('.register-form');

    loginBtn.click(function(){
        $('input').val('')
        loginBtn.addClass('border-dark')
        registerBtn.removeClass('border-dark')
        loginForm.removeClass('d-none')
        registerForm.addClass('d-none')
    })
    registerBtn.click(function(){
        $('input').val('')
        registerBtn.addClass('border-dark')
        loginBtn.removeClass('border-dark')
        registerForm.removeClass('d-none')
        loginForm.addClass('d-none')
    })

    const errorLogin = $('.error-login');
    const errorRegister = $('.error-register');

    registerForm.submit(e => {
        e.preventDefault();
        const nickname = $('#reg_nickname').val()
        const email = $('#reg_email').val()
        const password = $('#reg_password').val()
        socket.emit('register', {nickname, email, password})
    })

    loginForm.submit(e => {
        e.preventDefault();
        const email = $('#login_email').val()
        const password = $('#login_password').val()
        socket.emit('login', {email, password})
    });

    const navbar = $('#navbar')
    const usersList = $('.users-list');
    const messagesList = $('.messages-list');
    const messageForm = $('.message-form');
    const message = $('#message');

    messageForm.submit(e =>{
        e.preventDefault();
        socket.emit('new message', message.val());
        message.val('')
    });

    socket.on('register', data =>{
        if(data.status === "OK"){
            $('.auth_container').addClass('d-none');
            $('#reg_nickname').val('')
            $('#reg_email').val('')
            $('#reg_password').val('')
            navbar.removeClass('d-none')        
            messageForm.removeClass('d-none');
            messagesList.removeClass('d-none');
            usersList.removeClass('d-none')
        }else{
            errorRegister.show()
            errorRegister.html(data.message)
            setTimeout(() => {
                errorRegister.hide().html('')
            }, 3000);
        }
    });

    socket.on('login', data =>{
        if(data.status === "OK"){
            $('.auth_container').addClass('d-none');
            $('#login_email').val('')
            $('#login_password').val('')
            navbar.removeClass('d-none')
            messageForm.removeClass('d-none');
            messagesList.removeClass('d-none');
            usersList.removeClass('d-none')
        }else{
            errorLogin.show()
            errorLogin.html(data.message)
            setTimeout(() => {
                errorLogin.hide().html('')
            }, 3000);
        }
    });

    socket.on('all messages', data =>{
        newMsg(data)
    })

    socket.on('message', data =>{
        newMsg(data)
    });

    function newMsg(data) {
        if(messagesList.children('div').children('ul').find(`#message_${data.messageId}`).length === 1){
            $(`#message_${data.messageId}`).remove()
        }
        const newMsg = `<a class="list-group-item list-group-item-action" id="message_${data.messageId}">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">
                                    ${data.author}
                                </h5>
                                <small class="text-muted">${data.date}</small>
                            </div>
                            <p class="mb-1">${data.message}</p>
                        </a>`;

        messagesList.children('div').children('ul').append(newMsg)
    }

    socket.on('users', data =>{
        console.log(data)
        localStorage.clear()
        data.onlineUsers.map(user => (
            localStorage.setItem(`onlineUser_${user._id}`, user._id)
        ))
        usersList.children('div').children('ul').html('');
        usersList.children('div').children('ul').append(
            data.users.map(user => (
                `<li class="list-group-item">
                    ${user.nickname}
                    ${localStorage.getItem(`onlineUser_${user._id}`) ? '<span class="float-right text-white p-1" style="background-color: green; border-radius: 3px; font-size: 8px">ONLINE</span>' : ''}
                </li>
                `
            ))
        )
    })

    const logoutBtn = $('#menu_btn_logout')
    logoutBtn.click(e =>{
        e.preventDefault();
        socket.emit('logout');
        $('.auth_container').removeClass('d-none');
        loginBtn.click()
        navbar.addClass('d-none')
        messageForm.addClass('d-none');
        messagesList.addClass('d-none');
        usersList.addClass('d-none')
    });
});