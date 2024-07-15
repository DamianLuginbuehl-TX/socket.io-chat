const server = 'http://localhost:4000';
const socket = io(server);

const nameInput = document.querySelector('#msgName');
const nameRegisterBtn = document.querySelector('#msgNameRegister');
const msgEdit = document.querySelector('#msgedit');
const userList = document.querySelector('#users ul');
const msgSendBtn = document.querySelector('#msgBtnSend');
const msgPlanBtn = document.querySelector('#msgBtnPlan');
const msgInput = document.querySelector('#msgMessage');
const chat = document.querySelector('#chat');

let initalHistory = false;

// /** reeive message */
// socket.on('msg.receive', function (data) {
//     document.body.innerHTML += data.message;
// });

// /** send message */
// socket.emit('msg.send', {
//     message: 'testmessage',
//     email: 'client',
// });


let clientData = {}

function init() {
    if (localStorage.getItem("clientData") != null) {
        clientData = JSON.parse(localStorage.getItem("clientData"));
        nameInput.value = clientData.user;
        register();
    }
}



nameRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();

    if (nameInput.value.length >= 2) {

        if (!clientData.id) {
            newuuid = generateUUID();
        }
        else {
            newuuid = clientData.id
        }

        clientData.user = nameInput.value;
        clientData.id = newuuid;

        register();
    }
})

function register() {
    socket.emit('client.hello', clientData);
}

socket.on('server.hello', function (data) {
    if (data.id == clientData.id) {
        localStorage.setItem("clientData", JSON.stringify(data));
        msgEdit.removeAttribute('style');
        console.log(`registration successful: ${data.id},${data.user}`);
    }
});



socket.on('client.update.list', function (data) {
    console.log(`clientList update received: ${data}`)
    let html = '';
    for (let i = 0; i < data.length; i++) {
        html += `<li>${data[i][1]}</li>`
        let allUserMessages = document.querySelectorAll(`.bubble[data-sender-id="${data[i][0]}"] .name`)
        for (let j = 0; j < allUserMessages.length; j++) {
            allUserMessages[j].innerHTML = data[i][1];
        }
    }
    userList.innerHTML = html

});

socket.on('client.alive.request', function () {
    if (clientData.user && clientData.id && localStorage.getItem("clientData") != null) {
        socket.emit('client.alive.response', clientData);
    }
});

socket.on('connect', function (data) {
    init()
});


msgSendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage()
})

function sendMessage() {
    if (msgInput.value.length >= 1) {
        let message = msgInput.value;
        msgInput.value = '';
        socket.emit('msg.send', {
            user: clientData.user,
            id: clientData.id,
            msg: message
        });
    }
}

msgPlanBtn.addEventListener('click', (e) => {
    e.preventDefault();
})

msgInput.addEventListener('keyup', (e) => {
    e.preventDefault();

    /** if (e.ctrlKey && e.which === 13) {
        sendMessage()
    }*/
    if (e.which === 13) {
        sendMessage()
    }
})

function addMsg(data) {
    if (clientData.id == null) {
        return;
    }
    if (document.querySelector('.bubble:last-child') && document.querySelector('.bubble:last-child').getAttribute('data-sender-id') == data.id && parseInt(document.querySelector('.bubble:last-child').getAttribute('data-sender-ts')) + 60000 > parseInt(data.ts)) {
        document.querySelector('.bubble:last-child').innerHTML += `<div class="message" >${data.msg}</div>`
    }
    else {
        let additionalClass = '';
        if (data.id == clientData.id) {
            additionalClass = ' own';
        }
        chat.innerHTML += `<div class="bubble${additionalClass}" data-sender-id="${data.id}" data-sender-ts="${data.ts}"><p class="timestamp">${data.time}</p><p class="name">${data.user}</p><div class="message">${data.msg}</div>`
    }
    chat.scrollTop = 999999999;
}

socket.on('msg.receive', function (data) {
    addMsg(data)
});

socket.on('chat.history', (data) => {
    if (initalHistory == true) {
        return;
    }
    if (clientData.id != null && data.data.id == clientData.id) {
        for (let i = 0; i < data.history.length; i++) {
            addMsg(data.history[i]);
        }
        initalHistory = true;
    }
})

socket.on('clear.all', () => {
    chat.innerHTML = "";
})
