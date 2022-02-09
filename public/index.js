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
    myId = userId
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        myStream = stream
        addVideoStream(userVideo, stream, myId)
    })
    socket.emit('join-room', 1, userId)
})

myPeer.on('call', call => {
    call.answer(myStream)
    const existingUserVideo = createVid()
    const existingUserId = call.peer
    call.on('stream', existingUserStream => {
        addVideoStream(existingUserVideo, existingUserStream, existingUserId) 
        peers[existingUserId] = { video: existingUserVideo, call: call }
    })
    call.on('close', () => { existingUserVideo.remove() })
})



socket.on('user-connected', connectedUserId => {
    console.log('User ' + connectedUserId + ' connected')
    const call = myPeer.call(connectedUserId, myStream)
    const connectedUserVideo = createVid()
    call.on('stream', connectedUserStream => {
        addVideoStream(connectedUserVideo, connectedUserStream, connectedUserId)
        peers[connectedUserId] = { video: connectedUserVideo, call: call }
    })
    call.on('close', () => { connectedUserVideo.remove() })
})

socket.on('user-disconnected', userId => {
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