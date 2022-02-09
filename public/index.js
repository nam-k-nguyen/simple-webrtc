const socket = io("/")
const myPeer = new Peer({
    host: "0.peerjs.com",
    port: "443",
    secure: true,
    debug: 2, /*
    config: {
        'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
            { url: 'stun:stun3.l.google.com:19302' },
            { url: 'stun:stun4.l.google.com:19302' },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            },
            {
                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
            }
        ]
    }, */
})

// Global variables 
// let getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia
let myName, myId, myStream
const videoGrid = document.querySelector('#video-grid')
const userVideo = createVid(); userVideo.muted = true
const videoList = []
const peers = {}


myPeer.on('open', userId => {
    log('Peer opened with ID: ' + userId)
    myId = userId
    log('Set myId = userId = ' + userId)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        myStream = stream
        log('Got our video stream')
        addVideoStream(userVideo, stream, myId)
        log('Added our video stream to screen')
    })
    socket.emit('join-room', 1, userId)
    log('Emitted join-room to server')
})

myPeer.on('call', call => {
    log('Called by another user`')
    call.answer(myStream)
    log('Answered the call with our own stream: ' + myStream)
    const existingUserVideo = createVid()
    log('Create video element to store existing user\'s video')
    const existingUserId = call.peer
    log('Set existing user id = call.peer = ' + call.peer)
    call.on('stream', existingUserStream => {
        log('Stream received from another user')
        addVideoStream(existingUserVideo, existingUserStream, existingUserId) 
        log('Added another user\'s video stream to screen')
        peers[existingUserId] = { video: existingUserVideo, call: call }
        log('Store existing user id in peers list')
    })
    call.on('close', () => { existingUserVideo.remove(); log('Close call with existing user of id ' + existingUserId)})
})



socket.on('user-connected', connectedUserId => {
    log('User ' + connectedUserId + ' connected')
    const connectedUserVideo = createVid()
    log('Create video element for user who just connected')
    const call = myPeer.call(connectedUserId, myStream, () => {
        call.on('stream', connectedUserStream => {
            log('Stream received from connected user')
            addVideoStream(connectedUserVideo, connectedUserStream, connectedUserId)
            log('Added stream of the user who just connected to the screen')
            peers[connectedUserId] = { video: connectedUserVideo, call: call }
            log('Store id of user just connected to peers list')
        })
    })
    log('Called user who just connected')
    call.on('close', () => { connectedUserVideo.remove(); log('close call with another user of id ' + connectedUserId) })
})

socket.on('user-disconnected', userId => {
    log('a user just disconnected')
    if (peers[userId]) {
        peers[userId].call.close()  // Close call
        delete peers[userId]        // Delete from peers list
    }
})

function addVideoStream(video, stream, id) {
    video.addEventListener('loadedmetadata', () => video.play())
    video.srcObject = stream
    video.setAttribute('id', id)
    addToGrid(video)
}
function createVid() { return document.createElement('video') }
function addToGrid(el) { videoGrid.appendChild(el) }
function log(a) {console.log(a)}