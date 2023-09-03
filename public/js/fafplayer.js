// jshint esversion:6
var myplayer = {
    host: false,
    roomId: null,
    player: false,
    username: "",
    socketId: "",
    points:0,
};

var currentRoom;

const socket = io();

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
            $(`#joueur${i}-name`).text(player.username);
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
            $(`#joueur${i}-name`).text(player.username);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
    }
});

socket.on("FAF new player",(room,player)=>{
    var i=1;
    currentRoom=room;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            $(`#joueur${i}-name`).text(player.username);
            $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
            i++;
        });
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


socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("FAF error",(err)=>{
    alert(err);
    document.location.href="/";
});
