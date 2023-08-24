// jshint esversion:6
const player = {
    host: true,
    roomId: null,
    username: "",
    socketId: "",
};

const socket = io();

var currentRoom;
var roundTime=20;


$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    player.username= $('#username').val();
    player.roomId=$("#code").val();
    player.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");
    $('#settings-button').show("slow");
    $('#settings-button').on("click", (e)=>{
        if ($('#settings').is(':visible')){
            $('#settings').hide("slow");
        }
        else{
            $('#settings').show("slow");
        }
    });

    socket.emit("FAFplayerDataHost",player);
});

