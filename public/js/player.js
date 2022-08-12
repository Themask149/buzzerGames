// jshint esversion:6
var player = {
    host: false,
    roomId: null,
    username: "",
    socketId: "",
    buzzed:false,
    locked:true,
    free:false
};

const socket = io();

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    player.username= $('#username').val();
    player.roomId=parseInt($("#code").val());
    player.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");
    

    socket.emit("playerData",player);
});

socket.on("player init",(room,p)=>{
    player=p;
    room.players.forEach((player)=>{
        if (player.host){
            $('#player-list').append(`<li class="list-group-item">${player.username} (Host) </li>`);
        }
        else{
            $('#player-list').append(`<li class="list-group-item">${player.username} `);
        }
    });
    if (p.free&&!p.locked&&!p.buzzed){
        liberer();
    }
    else if (!p.free&&p.locked&&!p.buzzed){
        block();
    }
    else{
        console.log(p);
    }
});
socket.on("new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item">${player.username} `);
});

socket.on("libere",()=>{
    liberer();
})
socket.on("block",()=>{
    block();
})

function liberer(){
    console.log("libere");
    $("#buzzer-state").text("BUZZ");
    $("#buzzer-circle").attr('fill',"green");
    $("#buzzer").on('click',buzzerAction);
    socket.emit("libere")  
}

function block(){
    console.log("block");
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
    $("#buzzer").off('click');
    socket.emit("block")
}

function buzzed(){
    console.log("buzzed");
    $("#buzzer-state").text("Buzzed");
    $("#buzzer").attr('fill',"red");
}

function buzzerAction(){
    var audio = new Audio('/components/buzzsound.mp3');
    audio.play();
}