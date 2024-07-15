const express = require('express');
const http = require("http");
const socketIO = require("socket.io")
const fs = require("fs")

const app = express();

/** define static paths */
const path = require('path');
app.use('/', express.static(path.join(__dirname, 'client')))


/** Create server */
let server = http.Server(app);

/** set port and make server listen */
let port = 4000;
server.listen(port);

/** message on which port the server is running */
console.log(`server running on port ${port}!`)

/** set socket.io server and CORS */
let io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


let clients = {};
let clientList = [];
let chatHistory = [];

fs.readFile('history.json', 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    } else {
        chatHistory = JSON.parse(data);
    }
});

/** open socket.io connection */
io.on('connection', function (socket) {
    /** socket.io on and emit */
    socket.on('msg.send', (data) => {
        if (data.msg == '/clear history') {
            chatHistory = [];
            fs.writeFile('history.json', JSON.stringify(chatHistory), 'utf8', (err) => err && console.error(err));
            io.emit('clear.all')
            return;
        }
        console.log(`message received from (${data.user}[${data.id}])`);
        const d = new Date();
        data.ts = d.getFullYear().toString() + d.getMonth().toString() + d.getDate().toString() + d.getHours().toString() + d.getSeconds().toString() + d.getMilliseconds().toString();
        console.log(`added ts to message`);
        data.time = `${d.getDay()}.${d.getMonth()} ${d.getHours()}:${d.getMinutes()}`;
        console.log(`added time to message`);
        io.emit('msg.receive', data);
        console.log(`forwarded message to clients`);
        chatHistory.push(data);
        fs.writeFile('history.json', JSON.stringify(chatHistory), 'utf8', (err) => err && console.error(err));
        console.log(`added message to history`);
    });

    socket.on('client.hello', (data) => {
        console.log(`(${data.user}[${data.id}]) wants to register`);
        io.emit('server.hello', data);
        console.log(`(${data.user}[${data.id}]) registered successfully`);
        updateclientList();

        io.emit('chat.history', {
            data: data,
            history: chatHistory
        });
        console.log(`sending history to (${data.user}[${data.id}])`);
    });

    socket.on('disconnect', (data) => {
        updateclientList();
    })

    socket.on('client.alive.response', (data) => {
        clients[data.id] = data.user;
        console.log(`client alive response (${data.user}[${data.id}])`)
    })

    socket.on('connection', () => {
        updateclientList();
    })

    async function updateclientList() {
        console.log('client alive request')
        io.emit('client.alive.request',);
        clients = {};
        await sleep(100)
        updateclientArray()
        io.emit('client.update.list', clientList);
        console.log(`requesting clientList update by ${clientList.length} clients`)
    }

    socket.on('client.get.list', (data) => {
        io.emit('client.update.list', clientList);
    })
});

function updateclientArray() {
    clientList = Object.entries(clients);
    console.log(`current clientList: ${JSON.stringify(clientList)}`)
}