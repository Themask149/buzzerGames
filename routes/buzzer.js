import express from 'express';
const router = express.Router();

router.get('/',(req,res)=>{
    res.render('buzzer/buzzerHome');
});

router.get('/debug',(req,res)=>{
    res.render('buzzer/host',{code: 10000, players:[{username:"test"},{username:"test2"},{username:"test3"}]});
});

const rooms=[]
const listeCodes=[]

router.post('/',(req,res)=>{
    const infos = req.body;
    let roomID = 0;
    if (infos.action == "host"){
        roomID = Math.floor(Math.random()*899999)+100000;
        listeCodes.push(roomID);
        rooms.push({roomID:roomID,players:[]});
    }
    console.log(roomID);
    res.redirect('/apps/buzzer'+roomID);
    
})

router.get('/:code',(req,res)=>{
    const params = req.params;
    if (params.code in listeCodes){
        console.log(listeCodes)
    }
    else{
        console.log(req.params);
        res.status("404").send("Pas de room associé à ce code")
    }

})

export default router;