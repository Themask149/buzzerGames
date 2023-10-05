var myplayer = {
    host: true,
    roomId: null,
    player: true,
    username: "",
    socketId: "",
    points:0,
};

const socket = io("/conquiztador");
const questions = [];

var currentPlayer;
var currentRoom;

$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    myplayer.username= $('#username').val();
    myplayer.roomId=$("#code").val();
    myplayer.socketId=socket.id;
    stringQuestion=$("#listeQuestions").val();
    if (checkQuestions(stringQuestion)){
        $("#user-card").hide("slow");
        $("#user-card").empty();
        $('#app-div-manche1').show("slow");
        $('#settings-button').show("slow");
        $('#settings-button').on("click", (e)=>{
            if ($('#settings').is(':visible')){
                $('#settings').hide("slow");
            }
            else{
                $('#settings').show("slow");
            }
        });
    }

    socket.emit("Conquiz playerDataHost",myplayer);
});

$('#conquiz-whitelist-button').on('click',(e)=>{
    if ($("#conquiz-whitelistCheckbox").is(":checked")){
        socket.emit("Conquiz whitelist",true,$('#conquiz-whitelist').val());
    }
    else{
        socket.emit("Conquiz whitelist",false,"");
    }
    
});

$('.block').on('click',(e)=>{
    if (currentRoom.players.length==2){
        var number = parseInt($(e.target).data("case"));
        $("#modal-question").modal("show");
        var question = questions[number-1];
        $('#question-div').text(question.question);
        $('#reponse-div').text(question.answer);
        $('#question-div').data("points",number%3+1 )
        socket.emit("Conquiz question",question.question);
    }
})

$('#Faux-manche1').on('click',(e)=>{
    socket.emit("Conquiz answer",false,$('#question-div').data("points"));
});

$('#Vrai-manche1').on('click',(e)=>{
    socket.emit("Conquiz answer",true,$('#question-div').data("points"));
});

socket.on('Conquiz host launch',(player,room)=>{
    myplayer=player;
    currentRoom=room;
});

socket.on('Conquiz new spectateur',(room,spectateur)=>{
    currentRoom=room;
    $('#spectateurs-list').append(`<li class="list-group-item" id="spectateur-${spectateur.username}">${spectateur.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" id="${spectateur.socketId}-kick" class="btn btn-secondary kick">kick</button> </div> </span></li>`);
    $(document).on('click',`#${spectateur.socketId}-kick`,(e)=>{
        e.preventDefault();
        console.log('kick');
        socket.emit("FAF kick",player.socketId);
    });
});

socket.on("Conquiz new player",(room,player)=>{
    console.log("new player : "+JSON.stringify(player));
    currentRoom=room;
    var i=1;
    if (1<=room.players.length<=2){
        room.players.forEach((player)=>{
            addPlayer(player,i);
            i++;
        });
    }
    
});

socket.on("Conquiz remove player",(room)=>{
    currentRoom=room;
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

socket.on("Conquiz remove spectateur",(room,player)=>{
    currentRoom=room;
    $(`#${player.username}`).remove();
});

socket.on("Conquiz current player",async (room)=>{
    currentRoom=room;
    if (currentPlayer!=null){
        $(`#joueur-${currentPlayer}`).css('background-color','whitesmoke');
    }
    currentPlayer=room.players[room.state.main].username;
    $(`#joueur-${currentPlayer}`).css('background-color','orange');
});

function checkQuestions(stringQuestion){
    var questionsList = stringQuestion.split("$");
    if (questionsList.length!=9){
        alert("Il faut au moins 9 questions");
        return false;
    }
    else{
        for (let i = 0; i < questionsList.length; i++) {
            const element = questionsList[i];
            var question = element.split(";");
            if (question.length!=2){
                alert("Il faut Question;Réponse");
                return false;
            }
            else{
                questions.push({question:question[0],answer:question[1]});
            }
        }
        return true;
    }
}

function addPlayer(player,i){
    $(`#joueur${i}-name`).data("username",player.username);
    $(`#joueur${i}-name`).html(`<h3 id="joueur-${player.username}">${player.username}</h3> <button type="button" id="${player.socketId}-kick" class="btn btn-secondary kick">kick</button>`);
    $(`#joueur-${player.username}`).data("place",i);
    $(`#joueur${i}-score-div`).html(`<button type="button" id="${player.username}-score" class="btn btn-success score-point edit" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
    $(document).off('click', `#${player.username}-score`);
    $(document).on('click',`#${player.username}-score`,(e)=>{
        e.preventDefault();
        console.log('score '+player.username);
        $('#pseudo-modal').text(`${player.username}`);
        $('#modal-score-label').text("Donnez le nombre de points à ajouter ou à enlever (mettre un - ) :");
        $('#btn-validate').attr("data-username", `${player.username}`);
        $('#btn-validate').off('click');
        $('#btn-validate').on('click',(e)=>{
            validerPoints(e.target);
        });
    });
    $(document).off('click', `#${player.username}-kick`);
    $(document).on('click',`#${player.socketId}-kick`,(e)=>{
        if (!currentRoom.state.start){
            e.preventDefault();
            console.log('kick');
            socket.emit("Conquiz kick",player.socketId);
        }
    });
    $(document).off('click', `#joueur-${player.username}`);
    $(document).on('click',`#joueur-${player.username}`,(e)=>{
        if (!currentRoom.state.start&&currentRoom.state.main!=player.username){
            socket.emit("Conquiz current player",player.username,i-1);
        }
    });
}