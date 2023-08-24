// jshint esversion:6
var player = {
    host: false,
    roomId: null,
    username: "",
    socketId: "",
    points:0,
};

var currentRoom;

const socket = io();

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    player.username= $('#username').val();
    player.roomId=parseInt($("#code").val());
    player.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");
    

    socket.emit("4ALSplayerData",player);
});