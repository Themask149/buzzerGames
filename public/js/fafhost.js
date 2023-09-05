// jshint esversion:6
var myplayer = {
    host: true,
    roomId: null,
    player: true,
    username: "",
    socketId: "",
    points:0,
};

const socket = io();

var currentRoom;
var roundTime=20;
var period=100;
var step=10*period/roundTime;
var countdownInterval;


$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    myplayer.username= $('#username').val();
    myplayer.roomId=$("#code").val();
    myplayer.socketId=socket.id;

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

    socket.emit("FAFplayerDataHost",myplayer);
});

$('#Start').on('click',(e)=>{
    for (var i=1;i<=4;i++){
        changeCouleurInterieur(i,100);
        changeCouleurExterieur(i,100);
    }
    $('#Start').hide("slow");
    $('#settings-button').hide("slow");
    step=10*period/roundTime;
    countdownInterval=setInterval(updateCountdown,period);
});

$('#faf-time-button').on('click',(e)=>{
    roundTime=$('#faf-time').val();
    socket.emit("FAF time",roundTime);
});

socket.on('FAF host launch',(player,room)=>{
    myplayer=player;
    currentRoom=room;
});

socket.on('FAF new spectateur',(room,spectateur)=>{
    currentRoom=room;
    $('#spectateurs-list').append(`<li class="list-group-item" id="${spectateur.username}">${spectateur.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" id="${spectateur.socketId}-kick" class="btn btn-secondary kick">kick</button> </div> </span></li>`);
    $(document).on('click',`#${spectateur.socketId}-kick`,(e)=>{
        e.preventDefault();
        console.log('kick');
        socket.emit("FAF kick",player.socketId);
    });
});

socket.on("FAF new player",(room,player)=>{
    currentRoom=room;
    var i=1;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            addPlayer(player,i);
            i++;
        });
    }
    
});

socket.on("FAF remove player",(room)=>{
    if (room.players.length==0 || room.players.length==1){
        i=1;
        room.players.forEach((player)=>{
            addPlayer(player,i);
            i++;
        });
        while (i<=2){
            $(`#joueur${i}-name`).text(`Joueur ${i}`);
            $(`#joueur${i}-score-div`).html("");
            i++;
        }
    }
    else {
        alert("Inconsistence du nombre de joueur: "+ JSON.stringify(room));
        document.location.href="/";
    }
})

socket.on("FAF remove spectateur",(room,player)=>{
    currentRoom=room;
    $(`#${player.username}`).remove();
});


socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("FAF error",(err)=>{
    alert(err);
    document.location.href="/";
});

function addPlayer(player,i){
    $(`#joueur${i}-name`).data("username",player.username);
    $(`#joueur${i}-name`).html(`<h3>${player.username}</h3> <button type="button" id="${player.socketId}-kick" class="btn btn-secondary kick">kick</button>`);
    $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
    $(document).on('click',`#${player.username}-score`,(e)=>{
        e.preventDefault();
        console.log('score '+player.username);
        $('#pseudo-modal').text(`${player.username}`);
        $('#modal-score-label').text("Donnez le nombre de points à ajouter ou à enlever (mettre un - ) :");
        $('#btn-validate').attr("data-username", `${player.username}`);
        $('#btn-validate').on('click',(e)=>{
            validerPoints(e.target);
        });
    });
    $(document).on('click',`#${player.socketId}-kick`,(e)=>{
        if (!currentRoom.state.start){
            e.preventDefault();
            console.log('kick');
            socket.emit("FAF kick",player.socketId);
        }
    });
}


function changeCouleurInterieur(n, percent){
    $(`#grad-interieur-${n}-orange`).attr('offset', `${percent}%`);
    $(`#grad-interieur-${n}-blue`).attr('offset', `${percent}%`);
}

function changeCouleurExterieur(n,bool){
    if (!bool){
        $(`#exterieur-${n}`).css('fill','rgb(216, 216, 216)');
    }
    else
        $(`#exterieur-${n}`).css('fill','darkorange');
}

function updateCountdown(){
    try{    
        if ($(`#grad-interieur-4-orange`).attr('offset')=="0%"&&$(`#grad-interieur-4-blue`).attr('offset')=="0%"){
            if ($(`#grad-interieur-3-orange`).attr('offset')=="0%"&&$(`#grad-interieur-3-blue`).attr('offset')=="0%"){
                if ($(`#grad-interieur-2-orange`).attr('offset')=="0%"&&$(`#grad-interieur-2-blue`).attr('offset')=="0%"){
                    if ($(`#grad-interieur-1-orange`).attr('offset')=="0%"&&$(`#grad-interieur-1-blue`).attr('offset')=="0%"){
                        clearInterval(countdownInterval);
                        $('#Start').show("slow");
                        $('#settings-button').show("slow");
                    }
                    else{
                        updateColor(1)
                    }
                }
                else{
                    updateColor(2)
                }
            }
            else{
                updateColor(3)
            }
        }
        else{
            updateColor(4)
        }
    }
    catch(err){
        console.log(err);
    }
    
}

function updateColor(n){
    if ($(`#grad-interieur-${n}-orange`).attr('offset')=="100%"&&$(`#grad-interieur-${n}-blue`).attr('offset')=="100%"){
        var newPercent = Math.max(0, extractNumberFromPercent($(`#grad-interieur-${n}-orange`).attr('offset')) - step / (n*10));
        $(`#grad-interieur-${n}-orange`).attr('offset',`${newPercent}%`);
        return
    }
    else if ($(`#grad-interieur-${n}-blue`).attr('offset')!="0%"){
        var newPercentOrange = Math.max(0, extractNumberFromPercent($(`#grad-interieur-${n}-orange`).attr('offset')) - step / (n*10));
        var newPercentBlue = Math.max(0, extractNumberFromPercent($(`#grad-interieur-${n}-blue`).attr('offset')) - step / (n*10));
        $(`#grad-interieur-${n}-orange`).attr('offset',`${newPercentOrange}%`);
        $(`#grad-interieur-${n}-blue`).attr('offset',`${newPercentBlue}%`);
        return
    }
}

function extractNumberFromPercent(percent){
    return parseFloat(percent.substring(0,percent.length-1));
}


