var myplayer = {
    host: true,
    roomId: null,
    player: true,
    username: "",
    socketId: "",
    points:0,
};

const socket = io("/conquiztador");
var questions = [];
var questionsManche2 = [];
var indexQuestionsManche2 = 0;
var themesList = [];
var finaleQuestions = [];
var reponseEstimation;
var dateEstimation;
var timeFinale=60;

var currentPlayer;
var currentRoom;
var currentPoints=1;
var pointMaxManche2 = 6;
var rateManche2=60;
var pointsCountdown;
var secEcouler=0;
var timerManche2;
var timerFinale;
var tempsMovement=1;
var nbPas=50;
var reponsesEstimation=[];


lowLag.init();
lowLag.load('/components/Bonne_reponse.mp3');
lowLag.load('/components/Bonne_reponse__VICTOIRE2.mp3');
lowLag.load('/components/Buzzer_Joueur_1_Champion.mp3');
lowLag.load('/components/Buzzer_Joueur_2_Challenger.mp3');
lowLag.load('/components/Suspense_2.mp3');
lowLag.load('/components/Mauvaise_reponse.mp3');
lowLag.load('/components/Suspense_final.mp3');
lowLag.load('/components/Presentation_des_3_themes.mp3');
lowLag.load('/components/Ding.mp3');

// Mettre son finale et fin de timer
$("#form-pseudo").on('submit', function (e){
    e.preventDefault();
    myplayer.username= $('#username').val();
    myplayer.roomId=$("#code").val();
    myplayer.socketId=socket.id;
    stringQuestion=$("#listeQuestions").val();
    if (checkQuestions(stringQuestion)){
        $("#user-card").hide("slow");
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
        socket.emit("Conquiz playerDataHost",myplayer,themesList);
        socket.emit("Conquiz couleurs",$('#ColorInput1').val(),$('#ColorInput2').val());
    }
});

$('#conquiz-whitelist-button').on('click',(e)=>{
    if ($("#conquiz-whitelistCheckbox").is(":checked")){
        socket.emit("Conquiz whitelist",true,$('#conquiz-whitelist').val());
    }
    else{
        socket.emit("Conquiz whitelist",false,"");
    }
    
});

$('#conquiz-manche0-button').on('click',(e)=>{
    if (currentRoom.players.length==2){
        reponseEstimation=parseInt($('#conquiz-estimation-reponse-input').val());
        if (reponseEstimation==NaN){
            alert("Il faut une réponse numérique");
            return;
        }
        socket.emit("Conquiz estimation",$('#conquiz-estimation-question-input').val());
        dateEstimation=new Date().getTime();
        $("#success-alert").html(`<strong>Estimation envoyée ! </strong>`);
        $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
            $("#success-alert").slideUp(500);
        });
    }
    else{
        alert("Il faut 2 joueurs pour commencer");
    }
});

$('.block').on('click',(e)=>{
    if (currentRoom.players.length==2 && currentRoom.state.main!=null){
        var number = parseInt($(e.target).data("case"));
        $("#modal-question").modal("show");
        var question = questions[number-1];
        $(e.target).removeClass("block");
        $(e.target).addClass("used-block");
        $('#question-div').text(question.question);
        $('#reponse-div').text(question.answer);
        $('#question-div').data("points",(number-1)%3+1 )
        socket.emit("Conquiz question",question.question,e.target.id,(number-1)%3+1);
    }
})

$('.case-finale').on('click',(e)=>{
    if (currentRoom.state.finaleQuestions!=null){
        if (!$(e.target).hasClass("good-block")){
            var number = parseInt($(e.target).data("case"));
            $(e.target).addClass("good-block");
            $(e.target).text(finaleQuestions[number-1].answer);
            lowLag.play('/components/Ding.mp3');
            socket.emit("Conquiz finale answer",number);
        }
        else{
            var number = parseInt($(e.target).data("case"));
            $(e.target).removeClass("good-block");
            $(e.target).text(finaleQuestions[number-1].question);
            socket.emit("Conquiz finale unanswer",number);
        }
    }
})

$('#Faux-manche1').on('click',(e)=>{
    if (currentRoom.state.question!=null){
        $(`#${currentRoom.state.questionid}`).addClass("bad-block");
    }
    lowLag.play('/components/Mauvaise_reponse.mp3');
    socket.emit("Conquiz answer",false,$('#question-div').data("points"));
});

$('#Vrai-manche1').on('click',(e)=>{
    if (currentRoom.state.question!=null){
        $(`#${currentRoom.state.questionid}`).addClass("good-block");
    }
    lowLag.play('/components/Bonne_reponse.mp3');
    socket.emit("Conquiz answer",true,$('#question-div').data("points"));
});

$('#Suspense-manche1').on('click',(e)=>{
    lowLag.play('/components/Suspense_2.mp3');
    socket.emit("Conquiz suspense");
});

$('#Vrai-manche2').on('click',(e)=>{
    socket.emit("Conquiz update score",currentPlayer,currentPoints.toString());
    liberer();
    currentPlayer=null;
})

$('#Faux-manche2').on('click',(e)=>{
    socket.emit("Conquiz update score",currentPlayer,(-currentPoints).toString());
    liberer();
    currentPlayer=null;
})

$('#question-suivante').on('click',(e)=>{
    questionSuivante()
})

$('#show-modal-manche2').on('click',(e)=>{
    $("#modal-manche2").modal("show");
    $("#show-modal-manche2").hide();
})

function questionSuivante(){
    if (indexQuestionsManche2<questionsManche2.length){
        socket.emit("Conquiz question manche2",questionsManche2[indexQuestionsManche2]);
        indexQuestionsManche2+=1;
    }
    else{
        console.log("Fin des questions");
    }
}

$("#Show-Themes").on('click',async (e)=>{
    $("#Show-Themes").hide("slow");
    $("#Show-Themes").off('click');
    socket.emit("Conquiz theme");
    lowLag.play('/components/Presentation_des_3_themes.mp3');
    $("#theme1").css("visibility","visible");
    await sleep(1300);
    $("#theme2").css("visibility","visible");
    await sleep(1300);
    $("#theme3").css("visibility","visible");
});

$('#Start-Finale').on('click',(e)=>{
    if (currentRoom.players.length==2){
        socket.emit("Conquiz start finale");
        $("#modal-finale").modal("show");
    }
});

$('#Start-Manche2').on('click',(e)=>{
    if (currentRoom.players.length==2){
        socket.emit("Conquiz start manche2");
        $("#show-modal-manche2").show();
    }
});

$('#Start-Manche1').on('click',(e)=>{
    if (currentRoom.players.length==2){
        socket.emit("Conquiz start manche1");
    }
});

$("#liberer").on('click',(e)=>{
    liberer();
});
$("#bloquer").on('click',(e)=>{
    block();
});

$("#Block-finale").on('click',(e)=>{
    if (!currentRoom.state.block){
        socket.emit("Conquiz block finale");
    }
});

$("#stop-countdown-manche2").on('click',(e)=>{
    if ($("#stop-countdown-manche2").data("stopped")=="no"){
        console.log("Stopped Timer")
        clearInterval(pointsCountdown);
        clearInterval(timerManche2);
        secEcouler=Math.floor((new Date().getTime()-dateEstimation));
        $("#stop-countdown-manche2").text("Restart");
        $("#stop-countdown-manche2").data("stopped","yes");
    }
    else{
        dateEstimation=new Date().getTime()-secEcouler;
        pointsCountdown=setInterval(updatePoints,1000)
        timerManche2=setInterval(updateTimer,100);
        $("#stop-countdown-manche2").text("Stop");
        $("#stop-countdown-manche2").data("stopped","no");
    }
});

socket.on("Conquiz block finale",(r)=>{
    currentRoom=r;
    timerFinale=clearInterval(timerFinale);
})

$("#Unblock-finale").on('click',(e)=>{
    if (currentRoom.state.block){
        socket.emit("Conquiz unblock finale");
    }
});

socket.on("Conquiz unblock finale",(r)=>{
    currentRoom=r;
    timerFinale=setInterval(updateFinaleTimer,1000);
})
const takeEveryTwo = (arr) => arr.filter((item, index) => (index % 2) === 0);

$("#conquiz-manche2-button").on('click',(e)=>{
    if ($('#conquiz-pointmax').val()){
        pointMaxManche2=$('#conquiz-pointmax').val();
    }
    if ($("#conquiz-rate").val()){
        rateManche2=$("#conquiz-rate").val();
    }
    if ($("#conquiz-questions").val()){
        questionsManche2 = $("#conquiz-questions").val().split("\n");
        questionsManche2 = takeEveryTwo(questionsManche2);
    }
    currentPoints=1;
    pointsCountdown=setInterval(updatePoints,1000)
    timerManche2=setInterval(updateTimer,100);
    dateEstimation=new Date().getTime();
    secEcouler=0;
    liberer();
    $("#modal-manche2").modal("hide");

})


$("#finale-launch").on('click',(e)=>{
    questionsfinale = $('#listeFinale').val();
    if (checkFinale(questionsfinale)){
        socket.emit("Conquiz finale questions",finaleQuestions);
    }
    else{
        alert("Erreur dans les questions de la finale");
    }
    if ($("#conquiz-finale-time").val()){
        timeFinale=$("#conquiz-finale-time").val();
        $('#countdown-finale').text(timeFinale);
    }
    $('#modal-finale').modal("hide");
    socket.emit("Conquiz launch finale");
    timerFinale=setInterval(updateFinaleTimer,1000);
})

socket.on('Conquiz host launch',(player,room)=>{
    myplayer=player;
    currentRoom=room;
    $('#modal-manche0').modal("show");
    for (let i = 1; i <= 3; i++) {
        $(`#theme${i}`).text(room.state.themesList[i-1]);
    }
});

socket.on('Conquiz new spectateur',(room,spectateur)=>{
    currentRoom=room;
    $('.spectateurs-list').append(`<li class="list-group-item spectateur-${spectateur.username}">${spectateur.username} <div class="btn-group btn-group-sm" role="group"> <button type="button" class="${spectateur.socketId}-kick" class="btn btn-secondary kick">kick</button> </div> </span></li>`);
    $(document).on('click',`.${spectateur.socketId}-kick`,(e)=>{
        e.preventDefault();
        console.log('kick');
        socket.emit("Conquiz kick",spectateur.socketId);
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
            $(`.joueur${i}-name`).text(`Joueur ${i}`);
            $(`.joueur${i}-score-div`).html("");
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
    $(`.spectateur-${player.username}`).remove();
});

socket.on("Conquiz current player",async (room)=>{
    currentRoom=room;
    $(`.joueur-${room.players[0].username}`).css('background-color','whitesmoke');
    $(`.joueur-${room.players[1].username}`).css('background-color','whitesmoke');
    currentPlayer=room.players[room.state.main].username;
    $(`.joueur-${currentPlayer}`).css('background-color','orange');
});

socket.on("Conquiz couleurs",(room)=>{
    currentRoom=room;
    $('#grad-interieur-blue').css("stop-color",room.options.couleurs[0]);
    $('#grad-interieur-orange').css("stop-color",room.options.couleurs[1]);
});

function estimationReponse(reponse,username,i){
    reponsesEstimation.push(reponse);
    $(`#joueur${i}-reponse-div`).text("Reponse: "+reponse);
    $(`#joueur${i}-ecart-div`).text("Ecart: "+Math.abs(reponseEstimation-reponse));
    $(`#joueur${i}-temps-div`).text("Temps: "+(new Date().getTime()-dateEstimation)/1000);
    $(`#valider-reponse${i}`).show("fast");
    $(`#valider-reponse${i}`).on('click',(e)=>{
        $(`#modal-manche0`).modal("hide");
        socket.emit("Conquiz estimation validation",username);
        socket.emit("Conquiz current player",currentRoom.players[i-1].username,i-1);
    })
    if (reponsesEstimation.length==2){
        if (Math.abs(reponsesEstimation[0]-reponseEstimation)>Math.abs(reponsesEstimation[1]-reponseEstimation)){
            $(`.joueur-${username}`).css('background-color','orange');
        }
        else{
            $(`.joueur-${currentRoom.players[2-i].username}`).css('background-color','orange');
        }
    }
}

socket.on("Conquiz estimation reponse",(reponse,player)=>{
    if (currentRoom.players[0].username==player.username){
        estimationReponse(reponse,player.username,1);
    }
    else if (currentRoom.players[1].username==player.username){
        estimationReponse(reponse,player.username,2);
    }
    else{
        alert("Erreur de joueur");
    }
})

socket.on("Conquiz update score",async (player,room)=>{
    currentRoom=room;
    $(`.${player.username}-score`).text(player.points);
    if (room.state.manche==2){
        console.log(room);
        moveBarre(room.players[0].points,room.players[1].points)
    }
});

socket.on("Conquiz start finale", (room) => {
    console.log("start manche finale");
    currentRoom=room;
    clearInterval(pointsCountdown);
    $('#app-div-manche2').hide("slow");
    $('#app-div-finale').show("slow");
    socket.emit("Conquiz remove current player");
    room.players.forEach((player)=>{
        $(document).off('click', `.joueur-${player.username}`);
    })  
});

socket.on("Conquiz finale questions", (room) => {
    currentRoom=room;
    setFinaleQuestions(room.state.finaleQuestions);
});

socket.on("Conquiz start manche2", (room) => {
    console.log("start manche2");
    currentRoom=room;
    $('#app-div-manche1').hide("slow");
    $('#app-div-manche2').show("slow");
    timerFinale=clearInterval(timerFinale);
    pointsCountdown=clearInterval(pointsCountdown);
    currentPoints=1;
    secEcouler=0;
    socket.emit("Conquiz remove current player");
    room.players.forEach((player)=>{
        $(document).off('click', `.joueur-${player.username}`);
    })
    $(document).keydown(function(e){
        if (e.code === "Space"){
            questionSuivante();
        }
    });
    moveBarre(room.players[0].points,room.players[1].points); 
});

socket.on("Conquiz start manche1", (room) => {
    console.log("start manche1");
    currentRoom=room;
    currentPlayer=null;
    clearInterval(pointsCountdown);
    $('#app-div-manche2').hide("slow");
    $('#app-div-manche1').show("slow");
    var i=0;
    for (let i =0;i<2;i++){
        $(document).on('click',`.joueur-${room.players[i].username}`,(e)=>{
            socket.emit("Conquiz current player",room.players[i].username,i);
        });
    }
});

socket.on("Conquiz remove current player", (room) => {
    currentRoom=room;
    $(`.joueur-${currentPlayer}`).css('background-color','whitesmoke');
    currentPlayer=null;
});

socket.on("Conquiz question",(room,question)=>{
    currentRoom=room;
})

socket.on("Conquiz buzzed", (room,rang)=>{
    console.log("buzzed")
    currentRoom=room;
    currentPlayer=rang-1;
    myplayer.state="buzzed";
    if (rang==1){
        lowLag.play('/components/Buzzer_Joueur_1_Champion.mp3');
    }
    else{
        lowLag.play('/components/Buzzer_Joueur_2_Challenger.mp3');
    }
    $("#buzzer").off('click');
    $("#buzzer-state").text("Buzzed");
    $("#buzzer-circle").attr('fill',"red");
    $(`.joueur${rang}-card`).css('background-color',room.options.couleurs[rang-1]);
    if (pointsCountdown || timerManche2) {
        $('#validate-answer').show("fast");
    }

})

socket.on("Conquiz son",(bool)=>{
    if (bool){
        lowLag.play('/components/Bonne_reponse.mp3');
    }
    else{
        lowLag.play('/components/Mauvaise_reponse.mp3');
    }
})

socket.on("Conquiz end", ()=>{
    lowLag.play('/components/Bonne_reponse__VICTOIRE2.mp3');
    clearInterval(pointsCountdown);
    clearInterval(timerManche2);
});

socket.on("disconnect",()=>{
    alert("L'hôte s'est déconnecté");
    document.location.href="/";
});

socket.on("Conquiz error",(err)=>{
    alert(err);
});

function checkQuestions(stringQuestion){
    themesList = [];
    questions = [];
    var questionsList = stringQuestion.split("€");
    if (questionsList.length!=6){
        alert("Il faut au moins 3 thèmes et 9 questions");
        return false;
    }
    else{
        themesList.push(questionsList[0]);
        themesList.push(questionsList[2]);
        themesList.push(questionsList[4]);
        for (let i = 1; i < questionsList.length; i=i+2) {
            var temp = questionsList[i].split("$");
            if (temp.length!=3){
                alert("Il faut 3 questions par thème");
                return false;
            };
            temp.forEach((element) => {
                var question = element.split(";");
                if (question.length!=2){
                    alert("Il faut Question;Réponse");
                    return false;
                }
                else{
                    questions.push({question:question[0],answer:question[1]});
                }
            })
        }
        return true;
    }
}

function checkFinale(stringQuestion){

    finaleQuestions = [];
    var questionsList = stringQuestion.split("$");
    if (questionsList.length!=10){
        return false;
    }
    else{
        questionsList.forEach((element) => {
            var question = element.split(";");
            if (question.length!=2){
                return false;
            }
            else{
                finaleQuestions.push({question:question[0],answer:question[1]});
            }
        });
        return true;
    }
    
}


function addPlayer(player,i){
    $(`.joueur${i}-name`).data("username",player.username);
    $(`.joueur${i}-name`).html(`<h3 class="joueur-${player.username}">${player.username}</h3> <button type="button" class="btn btn-secondary kick ${player.socketId}-kick">kick</button>`);
    $(`.joueur-${player.username}`).data("place",i);
    $(`.joueur${i}-score-div`).html(`<button type="button" class="btn btn-success score-point edit ${player.username}-score" data-bs-toggle="modal" data-bs-target="#modalGivePoints">0</button>`);
    $(document).off('click', `.${player.username}-score`);
    $(document).on('click',`.${player.username}-score`,(e)=>{
        e.preventDefault();
        console.log('score '+player.username);
        $('#pseudo-modal').text(`${player.username}`);
        $('#modal-score-label').text("Donnez le nombre de points à ajouter ou à enlever (mettre un - ) :");
        $('#btn-validate').attr("data-username", `${player.username}`);
        $('#btn-validate').attr("data-place", `${i}`);
        $('#btn-validate').off('click');
        $('#btn-validate').on('click',(e)=>{
            validerPoints(e.target);
        });
    });
    $(document).off('click', `.${player.username}-kick`);
    $(document).on('click',`.${player.socketId}-kick`,(e)=>{
        if (!currentRoom.state.start){
            e.preventDefault();
            console.log('kick');
            socket.emit("Conquiz kick",player.socketId);
        }
    });
    $(document).off('click', `.joueur-${player.username}`);
    $(document).on('click',`.joueur-${player.username}`,(e)=>{
        if (!currentRoom.state.start&&currentRoom.state.main!=player.username){
            socket.emit("Conquiz current player",player.username,i-1);
        }
    });
}


function validerPoints(target){
    $('#btn-validate').off('click');
    socket.emit("Conquiz update score",target.dataset.place-1,$("#score-input").val());
}

function liberer(){
    socket.emit("Conquiz libere");
    $('#validate-answer').hide("fast");
    $("#buzzer-state").text("BUZZ");
    $("#buzzer-circle").attr('fill',"green");
    currentRoom.players.forEach((player)=>{
        $(`.joueur-${player.username}`).css('background-color','whitesmoke');
    });
    for (let i =1;i<=2;i++){
        $(`.joueur${i}-card`).css('background-color','');
    }
    
}

function block(){
    socket.emit("Conquiz block");
    $("#buzzer-state").text("Bloqué");
    $("#buzzer-circle").attr('fill',"yellow");
}

function updatePoints(){
    nbPoint=parseInt(((Date.now()-dateEstimation)/1000)/rateManche2);
    if (nbPoint!=currentPoints && nbPoint<=pointMaxManche2){
        currentPoints=nbPoint;
        $("#success-alert").html(`<strong>Nous passons à ${currentPoints} </strong>`);
        $("#success-alert").fadeTo(2000, 500).slideUp(500, function(){
            $("#success-alert").slideUp(500);
        });
        socket.emit("Conquiz update currentPoints",currentPoints);
    }
}

async function moveBarre(pointsA,pointsB){
    console.log(pointsA,pointsB);
    var unPoint=100.0/18.0;
    var baseA = 100-extractNumberFromPercent($("#grad-interieur-white-1").attr("offset"));
    var ecartA = pointsA*unPoint-baseA;
    var baseB = extractNumberFromPercent($("#grad-interieur-white-2").attr("offset"));
    var ecartB = pointsB*unPoint-baseB;
    console.log(ecartA,ecartB,baseA,baseB);
    for (let i =0;i<=nbPas;i++){
        $("#grad-interieur-white-1").attr("offset",`${100-baseA-ecartA*i/nbPas}%`);
        var offsetB=baseB+ecartB*i/nbPas;
        $("#grad-interieur-white-2").attr("offset",`${offsetB}%`);
        $("#grad-interieur-orange").attr("offset",`${offsetB}%`);
        await sleep(tempsMovement*1000/nbPas);
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractNumberFromPercent(percent){
    return parseFloat(percent.substring(0,percent.length-1));
}

function updateTimer(){
    secEcouler=Math.floor((new Date().getTime()-dateEstimation)/1000);
    $('#countdown-manche2').text(`${Math.floor(secEcouler/60)}:${secEcouler%60}`)
}

function updateFinaleTimer(){
    var timeEcouler=parseInt($('#countdown-finale').text());
    if (timeEcouler==5){
        lowLag.play('/components/Suspense_final.mp3');
        socket.emit("Conquiz finale suspense");
    }
    if (timeEcouler==0){
        clearInterval(timerFinale);
    }
    $('#countdown-finale').text(`${timeEcouler-1}`)
}

function setFinaleQuestions(questions){
    for (let i = 1; i <= 10; i++) {
        $(`#finale-${i}`).text(questions[i-1].question);
    }
}

function hideFinaleQuestions(){
    for (let i = 1; i <= 10; i++) {
        $(`#finale-${i}`).text("");
    }
}