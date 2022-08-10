// jshint esversion:6
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

    const rooms=[{players:[],id:123456789}];
    const listeCodes=[];

    router.post('/',(req,res)=>{
        const infos = req.body;
        let roomID = 0;
        if (infos.action == "host"){
            roomID = Math.floor(Math.random()*899999)+100000;
            listeCodes.push(parseInt(roomID));
            console.log("Hosting room: "+roomID);
            res.redirect('/apps/buzzer/'+roomID);
        }
        else if (infos.action=='join'){
            res.redirect('/apps/buzzer/'+infos.code);
        } 
    });

    router.get('/:code',(req,res)=>{
        const code = parseInt(req.params.code);
        const room = rooms.find((room)=>{return code===room.id;});
        console.log(room);
        if (listeCodes.includes(code)&&!room){
            res.status(200).render('buzzer/host',{code: code, players:[]});
        }
        else if (listeCodes.includes(code)&&room){
            res.status(200).render('buzzer/player',{code: code, players:[]});
        }
        else {
            res.status(404).render('home',{titre:"Pas de salles associées", root:"../../",title:"Erreur"});
        }

    });

    io.on('connection', (socket)=>{
        console.log(`[Connection] ${socket.id}` );

        socket.on('playerDataHost',(player)=>{
            console.log("Receiving playerDataHost");
            if (!rooms.find((room)=>{return player.roomId===room.id;})){
                player.username=xss(player.username);
                player.host=true;
                player.roomId=parseInt(player.roomId);
                rooms.push({players:[player],id:player.roomId});
                socket.join(player.roomId);
                console.log(`[Hosting] ${player.username} host la room `+player.roomId);
                io.to(socket.id).emit('host launch',player);
            }
            
        });

        socket.on('playerData',(player)=>{
            console.log(`[Joining] ${player.username} join la room `+player.roomId);
            player.username=xss(player.username);
            player.host=false;
            player.roomId=parseInt(player.roomId);
            const room=rooms.find((room)=>{return player.roomId===room.id;});
            room.players.push(player);
            io.to(player.roomId).emit("new player",player);
            socket.join(player.roomId);
            console.log(room.players);
            io.to(socket.id).emit("player init",room);
        });
    });





    return router;

    
}