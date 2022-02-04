const socket = io('/')
const myPeer = new Peer(undefined, {
    host: "0.peerjs.com",
    port: "443"
})

let myName
let myId
let myStream
const videoGrid = document.querySelector('#video-grid')
const userVideo = createVid(); userVideo.muted = true
const videoList = []
const peers = {}

myPeer.on('open', userId => {
    myId = userId
    mediaStreaming()
    socket.emit('join-room', 1, userId)
})

function mediaStreaming() {
    let getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia
    getUserMedia({ video: true, audio: true }).then(stream => {
        myStream = stream
        addVideoStream(userVideo, stream, myId)
    })

    myPeer.on('call', call => {
        call.answer(myStream)
        const existingUserVideo = createVid()
        call.on('stream', existingUserStream => {
            if (!peers[call.peer]) {
                addVideoStream(existingUserVideo, existingUserStream, call.peer)
            }
            peers[call.peer] = {
                video: existingUserVideo,
                call: call
            }
        })
        call.on('close', () => {
            existingUserVideo.remove()
        })
    })

    socket.on('user-connected', connectedUserId => {
        const call = myPeer.call(connectedUserId, myStream)
        const connectedUserVideo = createVid()

        call.on('stream', connectedUserStream => {
            console.log('Stream received from another user')
            if (!peers[connectedUserId]) {
                addVideoStream(connectedUserVideo, connectedUserStream, connectedUserId)
            }
            peers[connectedUserId] = {
                video: connectedUserVideo,
                call: call
            }
        })

        call.on('close', () => {
            console.log('Remove connected user video')
            connectedUserVideo.remove()
        })
    })
}

function addVideoStream(video, stream, id) {
    video.addEventListener('loadedmetadata', () => video.play())
    video.srcObject = stream
    video.setAttribute('id', id)
    addToGrid(video)
}

function createVid() { return document.createElement('video') }
function addToGrid(el) { videoGrid.appendChild(el) }