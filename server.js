const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const path = require('path')

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {res.render('index.ejs')})

io.on('connection', socket => {
    socket.on('join-room', (userId) => {
        socket.emit('user-connected', userId)
        socket.on('disconnect', () => {
            socket.emit('user-disconnected', userId)
        })
    })
})

server.listen(process.env.PORT || 3003)