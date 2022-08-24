// jshint esversion:6
const player = {
    host: true,
    roomId: null,
    username: "",
    socketId: "",
    buzzed:false,
    locked:false,
    free:false
};

const socket = io();

$(".modes").on('click',(e)=>{
    e.preventDefault();
    socket.emit("changeMode",e.target.id);
    $(".modes").removeClass('text-light bg-dark');
    $(`#${e.target.id}`).addClass('text-light bg-dark');
});

$("#liberer").on('click',(e)=>{
    liberer("all");
});
$("#bloquer").on('click',(e)=>{
    block("all");
});

$('#btn-points').on('change',(e)=>{
    socket.emit("changePointsMode",$('#btn-points').is(':checked'));
});

$(function(){
    $(document).keydown(function(e){
        if (e.key ==="b"){
            block("all");
        }
        if (e.key ==="l"){
            liberer("all");
        }
    })
})

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

    socket.emit("playerDataHost",player);
});

socket.on('host launch',(player)=>{
    $('#player-list').append(`<li class="list-group-item">${player.username} (Host) </li>`);
});

socket.on("new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}">${player.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" id="${player.socketId}" class="btn btn-secondary kick">kick</button> </div> <span class="mx-2 score"  style="display: none;"> </span></li>`);
    $('.kick').on('click',(e)=>{
        e.preventDefault();
        console.log('kick');
        console.log(e.target.id);
        socket.emit("kick",e.target.id);
    });
});

socket.on("remove player",(player)=>{
    console.log(`Bye bye ${player.username}`);
    $(`#${player.username}`).remove();
});

socket.on("modeChanged",()=>{
    $("#success-alert").html("<strong>Mode changed </strong>");
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#success-alert").slideUp(500);
    });
});

socket.on("kick-success",()=>{
    $("#success-alert").html("<strong>Played kicked </strong>");
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#success-alert").slideUp(500);
    });
});

socket.on("libere",()=>{
    liberer();
});
socket.on("block",()=>{
    block();
});
socket.on("buzzed",()=>{
    soundPlay();
    buzzed();
})

socket.on("player buzz",(p)=>{
    $('#buzzing-list').append(`<li class="list-group-item">${p.username} `);
});

socket.on("clear buzz",()=>{
    console.log("clear");
    $('#buzzing-list').empty();
});

socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
})

socket.on("error",(err)=>{
    alert(err);
    document.location.href="/";
});

function liberer(str="only"){
    socket.emit("libere",str);
    $("#buzzer-state").text("BUZZ");
    $("#buzzer-circle").attr('fill',"green");
}

function block(str="only"){
    socket.emit("block",str);
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
}

function buzzed(){
    socket.emit("buzz");
    $("#buzzer-state").text("Buzzed");
    $("#buzzer-circle").attr('fill',"red");
}

function soundPlay(){
    var audio = new Audio('/components/buzzsound.mp3');
    audio.play();
}

