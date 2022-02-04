const socket = io()
const myPeer = new Peer(undefined, {
    host: "0.peerjs.com",
    port: "443",
    debug: 1
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
    socket.emit(
        'join-room', 
        1,
        userId,
    )
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
            if (!peers[call.peer]) {addVideoStream(existingUserVideo, existingUserStream, call.peer)}
            peers[call.peer] = {video: existingUserVideo,call: call}
        })
        call.on('close', () => {existingUserVideo.remove()})
    })

    socket.on('user-connected', connectedUserId => {
        const call = myPeer.call(connectedUserId, myStream)
        const connectedUserVideo = createVid()

        call.on('stream', connectedUserStream => {
            if (!peers[connectedUserId]) {
                addVideoStream(connectedUserVideo, connectedUserStream, connectedUserId)
            }
            peers[connectedUserId] = {
                video: connectedUserVideo,
                call: call
            }
        })

        call.on('close', () => {
            connectedUserVideo.remove()
        })
    })
}

socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        peers[userId].call.close()
        delete peers[userId]
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