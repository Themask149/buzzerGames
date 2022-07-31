const player = {
    host: true,
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

    socket.emit("playerDataHost",player);
});

socket.on('host launch',(player)=>{
    $('#player-list').append(`<li class="list-group-item">${player.username} (Host) </li>`);
    liberer();
});

function liberer(){
    console.log("libere")
    $("#buzzer-state").text("BUZZ");
    $("#buzzer").attr('fill',"green").on('click',buzzerAction);
    
};

function buzzerAction(){
    var audio = new Audio('/components/buzzsound.mp3');
    audio.play();
}

function bloquer(){

};