// jshint esversion:6
var myplayer = {
    host: false,
    roomId: null,
    player: false,
    username: "",
    socketId: "",
    points:0,
    state:"blocked"
};

var currentRoom;
var currentPlayer;
var ding = new Audio('/components/Ding.mp3');
ding.preload = 'auto';
var timesup = new Audio('/components/times-up.mp3');
timesup.preload = 'auto';
var buzz = new Audio('/components/buzzsound.mp3');
buzz.preload = 'auto';

const socket = io("/faf");

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    myplayer.username= $('#username').val();
    myplayer.roomId=parseInt($("#code").val());
    myplayer.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");
    

    socket.emit("FAFplayerData",myplayer);
});

socket.on("FAF player init",(room,p)=>{
    myplayer=p;
    currentRoom=room;
    nbPlayers=room.players.length;
    var i = 1;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            $(`#joueur${i}-name`).html(`<h3 id="joueur-${player.username}">${player.username}</h3>`);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
    }
});

socket.on("FAF spectateur init",(room,p)=>{
    myplayer=p;
    currentRoom=room;
    nbPlayers=room.players.length;
    var i = 1;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            $(`#joueur${i}-name`).html(`<h3 id="joueur-${player.username}">${player.username}</h3>`);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
    }
    $("#spec-message").show();
});

socket.on("FAF new player",(room,player)=>{
    var i=1;
    currentRoom=room;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            $(`#joueur${i}-name`).html(`<h3 id="joueur-${player.username}">${player.username}</h3>`);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
    }
    
});

socket.on("FAF current player",(room)=>{
    currentRoom=room;
    if (currentPlayer!=null){
        $(`#joueur-${currentPlayer}`).css('background-color','white');
    }
    currentPlayer=room.players[room.state.main].username;
    $(`#joueur-${currentPlayer}`).css('background-color','orange');
});

socket.on("FAF time", (room) => {
    currentRoom=room;
});

socket.on("FAF free", (r)=>{
    currentRoom=r;
    myplayer.state="free";
    liberer();
});

socket.on("FAF block", (r)=>{
    currentRoom=r;
    myplayer.state="blocked";
    block();
});

socket.on("FAF end", (bool,room) => {
    currentRoom=room;
    $(`#joueur-${currentPlayer}`).css('background-color','white');
    currentPlayer=null;
    if (!bool){
        timesup.play();
    }
    else {
        ding.play();
    }
});


socket.on("FAF remove player",(room)=>{
    if (room.players.length==0 || room.players.length==1){
        i=1;
        room.players.forEach((player)=>{
            $(`#joueur${i}-name`).text(player.username);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
        while (i<=2){
            $(`#joueur${i}-name`).text(`Joueur ${i}`);
            $(`#joueur${i}-score-div`).html("");
            i++;
        }
    }
})

socket.on("FAF update score",(player,room)=>{
    currentRoom=room;
    $(`#${player.username}-score`).text(player.points);
});


socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("FAF error",(err)=>{
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
}

function buzzerAction(){
    buzz.play();
    buzzed();
}

function block(){
    console.log("block");
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
    $("#buzzer").off('click');
    $(document).off('keydown');
}

function buzzed(){
    socket.emit("FAF buzzed",myplayer.username)
    myplayer.state="buzzed";
    $("#buzzer").off('click');
    $("#buzzer-state").text("Buzzed");
    $("#buzzer-circle").attr('fill',"red");
    $(document).off('keydown');
}

