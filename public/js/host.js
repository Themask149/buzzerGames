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

let start = false;

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
$('#reset').on('click',(e)=>{
    console.log("reset");
    socket.emit("resetPoints");
});

$('#btn-points').on('change',(e)=>{
    socket.emit("changePointsMode",$('#btn-points').is(':checked'));
});

$(function(){
    $(document).keydown(function(e){
        if (start){
        if (e.key ==="b"){
            block("all");
        }
        if (e.key ==="l"){
            liberer("all");
        }
    }
    });
});

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
    start=true;
});

socket.on("new player",(player,bool)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}">${player.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" id="${player.socketId}" class="btn btn-secondary kick">kick</button> </div> <span class="mx-2 score"  style="display: none;"> </span></li>`);
    afficheScore(bool,player);
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
});

socket.on("player buzz",(buzzes,bool)=>{
    $('.check-buzz').off('click');
    $('#buzzing-list').empty();
    buzzes.forEach((buzz)=>{
        var htmlcode = `<li class="list-group-item"  >${buzz.player}  `;
        if (bool){
            htmlcode += `<i class="fa-solid fa-circle-check check-buzz" style="color:green" data-username="${p.username}" id="${p.username}-check" data-bs-toggle="modal" data-bs-target="#modalGivePoints"></i>`;
        }
        htmlcode += '</li>';
        $('#buzzing-list').append(htmlcode);
        $(`#${buzz.player}-check`).on('click',(e)=>{
            $('#pseudo-modal').text(`${buzz.player}`);
            $('#btn-validate').attr("data-username", `${buzz.player}`);
            $('#btn-validate').on('click',(e)=>{
                validerPoints(e.target);
            });
        });
    });
    
});

socket.on("show scores",(r)=>{
    $('#reset').show("slow");
    r.players.forEach((p)=>{
        afficheScore(true,p);
    });
    $("#success-alert").html("<strong>Points remis à 0 </strong>");
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#success-alert").slideUp(500);
    });

});

socket.on("unshow scores",(r)=>{
    $('#reset').hide();
    r.players.forEach((p)=>{
        afficheScore(false,p);
    });
    $("#success-alert").html("<strong>Points désactivés </strong>");
    $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
        $("#success-alert").slideUp(500);
    });
});

socket.on("update score",(p)=>{
    var score = $(`#${p.username}`).children('.score');
    score.text(p.points);
});

socket.on("clear buzz",()=>{
    console.log("clear");
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

function afficheScore(bool,p){
    var score;
    if (bool){
        score = $(`#${p.username}`).children('.score');
        score.show();
        score.text(p.points);
    }
    else{
        score = $(`#${p.username}`).children('.score');
        score.hide();
    }
    
}

function validerPoints(target){
    $('#btn-validate').off('click');
    liberer("all");
    socket.emit("change points",target.dataset.username,$("#score-input").val());
}

