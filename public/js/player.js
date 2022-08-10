// jshint esversion:6
const player = {
    host: false,
    roomId: null,
    username: "",
    socketId: "",
    buzzed:false,
    locked:false
};

const socket = io();

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    player.username= $('#username').val();
    player.roomId=$("#code").val();
    player.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");

    socket.emit("playerData",player);
});

socket.on("player init",(room)=>{
    room.players.forEach((player)=>{
        console.log(player);
        if (player.host){
            $('#player-list').append(`<li class="list-group-item">${player.username} (Host) </li>`);
        }
        else{
            $('#player-list').append(`<li class="list-group-item">${player.username} `);
        }
    });
});
socket.on("new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item">${player.username} `);
});
