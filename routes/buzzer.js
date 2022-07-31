import express from 'express';
import xss from 'xss';

export default function(io){

    const router = express.Router();

    

    router.get('/',(req,res)=>{
        res.render('buzzer/buzzerHome');
    });

    router.get('/debug',(req,res)=>{
        res.render('buzzer/host',{code: 10000, players:[{username:"test"},{username:"test2"},{username:"test3"}]});
    });

    const rooms=[{players:[],id:123456789}]
    const listeCodes=[]

    router.post('/',(req,res)=>{
        const infos = req.body;
        let roomID = 0;
        if (infos.action == "host"){
            roomID = Math.floor(Math.random()*899999)+100000;
            listeCodes.push(parseInt(roomID));
            console.log("Hosting room: "+roomID);
            res.redirect('/apps/buzzer/'+roomID);
        }  
    })

    router.get('/:code',(req,res)=>{
        const code = parseInt(req.params.code);
        if (listeCodes.includes(code)){
            res.status(200).render('buzzer/host',{code: code, players:[]});
        }
        else{
            res.status(404).render('home',{titre:"Pas de salles associées", root:"../../",title:"Erreur"});
        }

    })

    io.on('connection', (socket)=>{
        console.log(`[Connection] ${socket.id}` );

        socket.on('playerDataHost',(player)=>{
            console.log("Receiving playerDataHost")
            console.log(player.roomId);
            if (!rooms.find((room)=>{return player.roomID===room.id;})){
                player.username=xss(player.username);
                rooms.push({players:[player],id:player.roomID})
                socket.join(player.roomID);
                console.log(`[Hosting] ${player.username} host la room `+player.roomId);
                io.to(socket.id).emit('host launch',player)
            }
            
        })
    })





    return router;

    
}