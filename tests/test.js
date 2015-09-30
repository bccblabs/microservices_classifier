var io = require ('socket.io-client')
socket = io ('http://52.25.107.207:8080')
console.log (socket)


socket.on ('connect', function () {console.log ('client connected')});
socket.on ('register', function (client_id) {console.log ('client socket id:' + client_id)})
socket.emit ('clz_data', {yo: 'wassup'})
