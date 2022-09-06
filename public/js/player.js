// jshint esversion:6
var player = {
    host: false,
    roomId: null,
    username: "",
    socketId: "",
    buzzed:false,
    locked:true,
    free:false,
    points:0,
    ping:0
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
            $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} <span class="mx-2 score"  style="display: none;"> </span></li>`);
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
socket.on("new player",(player,bool)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} <span class="mx-2 score"  style="display: none;"> </span></li>`);
    afficheScore(bool,player);
});

socket.on("libere",()=>{
    liberer();
});
socket.on("block",()=>{
    block();
});

socket.on("player buzz",(buzzes,bool)=>{
    $('#buzzing-list').empty();
    buzzes.forEach((buzz)=>{
        $('#buzzing-list').append(`<li class="list-group-item">${buzz.player} </li> `);
    })
});

socket.on("clear buzz",()=>{
    $('#buzzing-list').empty();
});

socket.on("update score",(p)=>{
    var score = $(`#${p.username}`).children('.score');
    score.text(p.points);
})

socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("error",(err)=>{
    alert(err);
    document.location.href="/";
});

socket.on("show scores",(r)=>{
    r.players.forEach((p)=>{
        afficheScore(true,p)
    })
});

socket.on("unshow scores",(r)=>{
    r.players.forEach((p)=>{
        afficheScore(false,p)
    })
});

socket.on("latencyOut",(start)=>{
    socket.emit("latencyIn",start);
})


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

function afficheScore(bool,p){
    if (bool){
        var score = $(`#${p.username}`).children('.score');
        score.show();
        score.text(p.points);
    }
    else{
        var score = $(`#${p.username}`).children('.score');
        score.hide();
    }
    
}