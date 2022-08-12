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
    $(".modes").css("background-color", "")
    $(e.target.id).css("background-color", "blue");
})

$("#liberer").on('click',(e)=>{
    liberer();
})
$("#bloquer").on('click',(e)=>{
    block();
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
    })

    socket.emit("playerDataHost",player);
});

socket.on('host launch',(player)=>{
    $('#player-list').append(`<li class="list-group-item">${player.username} (Host) </li>`);
});

socket.on("new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}">${player.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" class="btn btn-secondary kick">kick</button> </div> </li>`);
});

socket.on("remove player",(player)=>{
    console.log(`Bye bye ${player.username}`)
    $(`#${player.username}`).remove();
})

socket.on("modeChanged",()=>{
    $("#success-mode-alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#success-mode-alert").slideUp(500);
    });
})

function liberer(){
    socket.emit("libere");
    $("#buzzer-state").text("BUZZ");
    $("#buzzer-circle").attr('fill',"green");
}

function block(){
    socket.emit("block");
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
}
