
lowLag.init();
lowLag.load('/components/Ding.mp3');
answer="";

$("#randomQuestion").click(function () {
    lowLag.play('Ding');
    $('#answer').text('');
    $.get("/api/quizz/qrandom", function (data) {
        $("#question").text(data.question.question);
        answer = data.question.answers[0];

    })
});

$("#randomAnswer").click(function () {
    lowLag.play('Ding');
    $("#answer").text(answer);
});
