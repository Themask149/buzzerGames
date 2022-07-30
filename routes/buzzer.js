import express from 'express';
const router = express.Router();

router.get('/',(req,res)=>{
    res.render('buzzer/buzzerHome');
});

router.get('/debug',(req,res)=>{
    res.render('buzzer/host',{code: 10000, players:[{username:"test"},{username:"test2"},{username:"test3"}]});
});

const rooms=[]

router.post('/',(req,res)=>{
    const infos = req.body;
    let roomID = 0;
    if (infos.action == "host"){
        roomID = Math.floor(Math.random()*899999)+100000;
    }
    console.log(roomID);
    res.redirect('/buzzer/apps/'+roomID);
    
})

export default router;