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

const socket = io("/conquiztador");

var currentRoom;


$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    myplayer.username= $('#username').val();
    myplayer.roomId=parseInt($("#code").val());
    myplayer.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div-manche1').show("slow");
    

    socket.emit("Conquiz playerData",myplayer);
});

socket.on("Conquiz player init",(room,p)=>{
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

socket.on("Conquiz spectateur init",(room,p)=>{
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


socket.on("Conquiz new player",(room,player)=>{
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

socket.on("Conquiz remove player",(room)=>{
    currentRoom=room;
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

socket.on("Conquiz question", (question) => {
    $("#question-div").text(question);
    $("#modalQuestion").modal("show");
})

socket.on("Conquiz remove question", () => {
    $("#modalQuestion").modal("hide");
})
