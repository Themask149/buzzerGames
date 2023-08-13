// jshint esversion:6
var player = {
    host: false,
    roomId: null,
    username: "",
    socketId: "",
    points:0,
};

var currentRoom;

const socket = io();

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    player.username= $('#username').val();
    player.roomId=parseInt($("#code").val());
    player.socketId=socket.id;

    $("#user-card").hide("slow");
    $("#user-card").empty();
    $('#app-div').show("slow");
    

    socket.emit("4ALSplayerData",player);
});

socket.on("4ALS player init",(room,p)=>{
    player=p;
    room.players.forEach((player)=>{
        if (player.host){
            $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} (Host) </li>`);
        }
        else{
            $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} <div class="score"><button type="button" id="${player.username}-score" class="btn btn-success score-point edit">${p.points}</button></div></li>`);
        }
    });
    currentRoom=room;
    
});

socket.on("4ALS remove player",(player)=>{
    console.log(`Bye bye ${player.username}`);
    $(`#${player.username}`).remove();
});
socket.on("4ALS new player",(player)=>{
    $('#player-list').append(`<li class="list-group-item" id="${player.username}" >${player.username} <div class="score"><button type="button" id="${player.username}-score" class="btn btn-success score-point edit">${player.points}</button></div></li>`);
});
socket.on("4ALS update score",(p)=>{
    updateScore(currentRoom,p)
});

socket.on("4ALS current player",(r)=>{
    currentplayer=currentRoom.state.currentPlayer;
    if (currentplayer!=null){
        $(`#${currentplayer}`).css('background-color','white');
    }
    $(`#${r.state.currentPlayer}`).css('background-color','orange');
    currentRoom=r;
    

}
);

socket.on("4ALS start",(r)=>{
    currentRoom=r;
    var audio = new Audio('/components/start_of_4als.mp3');
    audio.play();
    for (let i=0;i<5;i++){
        changeCouleurInterieur(i,false);
        changeCouleurExterieur(i,false);
    }
    changeCouleurExterieur(0,true);
    changeCouleurInterieur(0,true);
});

socket.on("4ALS answer",(bool,state)=>{
    if (state.start){
        
        if (bool){
            changeCouleurInterieur(state.score,true);
            if (state.maxScore>currentRoom.state.maxScore){
                changeCouleurExterieur(state.maxScore-1,false);
                changeCouleurExterieur(state.maxScore,true);
            }
            if (state.score!=4){
                var audio = new Audio('/components/Ding.mp3');
                audio.play();
            }
        }
        else{
            for (let i=1;i<5;i++){
                changeCouleurInterieur(i,false);
            }
        }
        currentRoom.state=state;
    }
});

socket.on("4ALS end",(r,player)=>{
    console.log("END",r,player);
    if (r.state.maxScore != 4){
        for (let i=0;i<5;i++){
            changeCouleurInterieur(i,false);
        }
        var audio = new Audio('/components/times-up.mp3');
        audio.play();
    }
    else {
        var audio = new Audio('/components/4ALS.mp3');
        audio.play();

    }  
    updateScore(r,player);
})


socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("4ALSerror",(err)=>{
    alert(err);
    document.location.href="/";
});

function changeCouleurInterieur(n, bool){
    if (!bool){
        $(`#interieur-${n}`).css('fill','rgb(22, 45, 148)');
    }
    else
        $(`#interieur-${n}`).css('fill','orange');

}

function changeCouleurExterieur(n,bool){
    if (!bool){
        $(`#exterieur-${n}`).css('fill','rgb(216, 216, 216)');
    }
    else
        $(`#exterieur-${n}`).css('fill','darkorange');
}

function updateScore(r,p){
    currentRoom=r;
    $(`#${p.username}-score`).text(p.points);
}