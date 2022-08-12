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

    const rooms=[{players:[],id:123456789,mode:"default"}];
    const listeCodes=[];

    router.post('/',(req,res)=>{
        const infos = req.body;
        let roomID = 0;
        if (infos.action == "host"){
            roomID = Math.floor(Math.random()*899999)+100000;
            listeCodes.push(parseInt(roomID));
            console.log("[Hosting] room "+roomID);
            res.redirect('/apps/buzzer/'+roomID);
        }
        else if (infos.action=='join'){
            res.redirect('/apps/buzzer/'+infos.code);
        } 
    });

    router.get('/:code',(req,res)=>{
        const code = parseInt(req.params.code);
        const room = rooms.find((room)=>{return code===room.id;});
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
        var p;
        var r;
        console.log(`[Connection] ${socket.id}` );

        socket.once('playerDataHost',(player)=>{
            console.log("Receiving playerDataHost");
            if (!rooms.find((room)=>{return player.roomId===room.id;})){
                player.username=xss(player.username);
                player.host=true;
                player.roomId=parseInt(player.roomId);
                player.buzzed=false;
                player.locked=true;
                player.free=false;
                p=player;
                r={players:[p],id:player.roomId,options:{mode:"default-mode"}};
                rooms.push(r);
                socket.join(p.roomId);
                
                console.log(`[Hosting] ${p.username} host la room `+p.roomId);
                io.to(socket.id).emit('host launch',p);
            }
            
        });

        socket.on('playerData',(player)=>{
            console.log(`[Joining] ${player.username} join la room `+player.roomId);
            player.username=xss(player.username);
            player.host=false;
            player.roomId=parseInt(player.roomId);
            p=player;
            r=rooms.find((room)=>{return p.roomId===room.id;});
            p.free=r.players[0].free;
            p.locked=r.players[0].locked;
            p.buzzed=r.players[0].buzzed;
            r.players.push(player);
            io.to(p.roomId).emit("new player",p);
            socket.join(p.roomId);
            io.to(socket.id).emit("player init",r,p);
        });

        socket.on("changeMode", (mode)=>{
            console.log("Receiving changeMode")
            
            if (isHost(socket.id,p,r)){
                console.log(`[Changing mode] from ${r.options.mode} to ${mode}`)
                r.options.mode=mode;
                socket.emit("modeChanged")
                console.log(rooms)
            }
        })

        socket.on("libere", ()=>{
            if ((p.buzzed||p.locked)&&!p.free&&p.host){
                socket.to(r.id).emit("libere");
                p.buzzed = false;
                p.locked= false;
                p.free=true;
            }
            else if ((p.buzzed||p.locked)&&!p.free&&!p.host){
                p.buzzed = false;
                p.locked= false;
                p.free=true;
            }
            
        })

        socket.on("block", ()=>{
            if ((p.buzzed||p.free)&&!p.locked&&p.host){
                socket.to(r.id).emit("block");
                p.buzzed = false;
                p.locked= true;
                p.free=false;
            }
            else if ((p.buzzed||p.free)&&!p.locked&&!p.host){
                p.buzzed = false;
                p.locked= true;
                p.free=false;
            }
            
        })
    });

    function isHost(socketId,player,room){
        if (room){
            player= room.players.find((player)=>{return player.socketId===socketId});
            return player.host;
        }
        else return false;
        
    }





    return router;

    
}