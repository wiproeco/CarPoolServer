
var server = require('http').createServer();
var io = require('socket.io')(server);
var users = {};
io.sockets.on('connection', function (socket) {
    console.log('socket server is listening on port 3000');
	
var socketUserid='';
socket.on('regUser', function (result) {
	socketUserid = result.userid;
users[socketUserid] = socket;
   console.log('new user ' + socketUserid+ ' registered');

});

var notificationmsg = '';
var userid ='';
socket.on('sendNotification', function (request) {
	notificationmsg = request.data;
	userid = request.userid;
    //console.log(request.data);
    if(users[userid] != 'undefined'){
            var receiverSocket = users[userid];
          receiverSocket.emit('recieveNotification', notificationmsg);
    }
 });

    
});

exports.CreateSocketPort = function() {
  server.listen(3000);
};
