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
            $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} (Host) </li>`);
        }
        else{
            $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} `);
        }
    });
    if (p.free&&!p.locked&&!p.buzzed){
        $("#buzzer-state").text("BUZZ");
        $("#buzzer-circle").attr('fill',"green");
        $("#buzzer").on('click',buzzerAction);
    }
    else if (!p.free&&p.locked&&!p.buzzed){
        $("#buzzer-state").text("Bloqué");
        $("#buzzer-circle").attr('fill',"yellow");
        $("#buzzer").off('click');
    }
    else{
        console.log(p);
    }
});

socket.on("remove player",(player)=>{
    console.log(`Bye bye ${player.username}`);
    $(`#${player.username}`).remove();
});
socket.on("new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} `);
});

socket.on("libere",()=>{
    liberer();
});
socket.on("block",()=>{
    block();
});

socket.on("player buzz",(p)=>{
    $('#buzzing-list').append(`<li class="list-group-item">${p.username} `);
});

socket.on("clear buzz",()=>{
    $('#buzzing-list').empty();
});

socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("error",(err)=>{
    alert(err);
    document.location.href="/";
});



function liberer(){
    console.log("libere");
    $("#buzzer-state").text("BUZZ");
    $("#buzzer-circle").attr('fill',"green");
    $("#buzzer").on('click',buzzerAction);
    $(document).keydown(function(e){
            if (e.code === "Space"){
    
                buzzerAction();
            }
        });
    socket.emit("libere")  

}

function block(){
    console.log("block");
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
    $("#buzzer").off('click');
    $(document).off('keydown');
    socket.emit("block")

}

function buzzed(){
    socket.emit("buzz");
    $("#buzzer-state").text("Buzzed");
    $("#buzzer-circle").attr('fill',"red");
    $(document).off('keydown');
}

function buzzerAction(){
    var audio = new Audio('/components/buzzsound.mp3');
    audio.play();
    buzzed();
}