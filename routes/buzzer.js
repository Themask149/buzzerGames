// jshint esversion:6
import express from 'express';
import xss from 'xss';
import { adminAuth, isConnected, getUser } from '../API/connectivity.js';
import cookieParser from 'cookie-parser';


export default function (io) {

    const test = " test";
    const router = express.Router();
    router.use(cookieParser());

    router.get('/',adminAuth, (req, res) => {
        res.render('buzzer/buzzerHome');
    });


    var rooms = [{ players: [], id: 123456789,}];
    var listeCodes = [];

    router.post('/',adminAuth, (req, res) => {
        const infos = req.body;
        let roomID = 0;
        if (infos.action == "host") {
            roomID = Math.floor(Math.random() * 899999) + 100000;
            listeCodes.push(parseInt(roomID));
            console.log("[Hosting] room " + roomID);
            res.redirect('/apps/buzzer/' + roomID);
        }
        else if (infos.action == 'join') {
            res.redirect('/apps/buzzer/' + infos.code);
        }
    });

    router.get('/:code', (req, res) => {
        const code = parseInt(req.params.code);
        const room = rooms.find((room) => { return code === room.id; });
        console.log("[JOIN] " + code + " " + room + "");
        //log each room of rooms
        console.log("Rooms :");
        rooms.forEach((room) => {
            console.log(room.id);
        });
        console.log(listeCodes);
        if (listeCodes.includes(code) && !room) {
            res.status(200).render('buzzer/host', { code: code, players: [] });
        }
        else if (listeCodes.includes(code) && room) {
            res.status(200).render('buzzer/player', { code: code, players: [] });
        }
        else {
            isConnected(req, res, (connected,role) => {
                res.status(404).render('home', { titre: "Pas de salles associées", root: "../../", title: "Erreur",connected:connected });
            });
        }

    });

    io.on('connection', (socket) => {
        var p;
        var r;
        console.log(`[Connection] ${socket.id}`);

        socket.once('playerDataHost', (player) => {
            console.log("Receiving playerDataHost");
            if (!/^[A-Za-z0-9]*[A-Za-z0-9\s]+[A-Za-z0-9]*$/.test(player.username)) {
                socket.disconnect();
            }
            else if (!rooms.find((room) => { return player.roomId === room.id; })) {
                player.username = xss(player.username);
                player.host = true;
                player.roomId = parseInt(player.roomId);
                player.buzzed = false;
                player.locked = true;
                player.free = false;
                p = player;
                r = { players: [p], id: player.roomId,buzzes:[], options: { mode: "default-mode", point: false } };
                rooms.push(r);
                socket.join(p.roomId);

                console.log(`[Hosting] ${p.username} host la room ` + p.roomId);
                io.to(socket.id).emit('host launch', p,r);
            }

        });

        socket.on('playerData', (player) => {
            if (!/^[A-Za-z0-9]*[A-Za-z0-9\s]+[A-Za-z0-9]*$/.test(player.username)) {
                io.in(player.socketId).emit("error", "Choississez un pseudo qu'avec des caractères alphanumériques");
                
            }
            else {
                console.log(`[Joining] ${player.username} join la room ` + player.roomId);
                player.username = xss(player.username);
                player.host = false;
                player.roomId = parseInt(player.roomId);
                player.points=0;
                p = player;
                r = rooms.find((room) => { return p.roomId === room.id; });
                if (!r) {
                    socket.disconnect();
                }
                else {
                    p.free = r.players[0].free;
                    p.locked = r.players[0].locked;
                    p.buzzed = r.players[0].buzzed;
                    r.players.push(player);
                    io.to(p.roomId).emit("new player", p,r.options.point);
                    socket.join(p.roomId);
                    io.to(socket.id).emit("player init", r, p);
                }
            }
        });

        socket.on("changeMode", (mode) => {
            console.log("Receiving changeMode");

            if (p.host) {
                console.log(`[Changing mode ${r.id}] from ${r.options.mode} to ${mode}`);
                r.options.mode = mode;
                socket.emit("modeChanged");
                console.log(rooms);
            }
        });

        socket.on("libere", (str) => {
            console.log(`[Free ${r.id}] ${p.username}`);
            if ((p.buzzed || p.locked) && !p.free) {
                console.log(`[Freeing ${r.id}] ${p.username}`);
                p.buzzed = false;
                p.locked = false;
                p.free = true;
                if (p.host && str==="all") {
                    socket.to(r.id).emit("libere");
                    console.log("clearing buzz");
                    io.to(r.id).emit("clear buzz");
                    r.buzzes=[];
                }
            }
            else if (p.free  && !p.locked&&!p.buzzed){
                
            }
            else {
                io.in(p.roomId).emit("error", "Etat du buzzer non stable");
                io.in(p.roomId).disconnectSockets();
            }


        });

        socket.on("block", (str="only") => {
            console.log(`[Block ${r.id}] ${p.username}`);
            if ((p.buzzed || p.free) && !p.locked) {
                console.log(`[Blocking ${r.id}] ${p.username}`);
                p.buzzed = false;
                p.locked = true;
                p.free = false;
                if (p.host && str==="all") {
                    socket.to(r.id).emit("block");
                    console.log("testing");
                }
            }
            else if ((p.locked || p.buzzed) && !p.free){
                
            }
            else {
                io.in(p.roomId).emit("error", "Etat du buzzer non stable");
                io.in(p.roomId).disconnectSockets();
            }

        });

        socket.on("soloblock", (socketId) => {
            var player = r.players.find((player) => { return player.socketId === socketId; });
            if (player) {
                if (player.buzzed || player.free) {
                    console.log(`[Block ${r.id}] ${player.username}`);
                    io.to(socketId).emit("block");
                }
                if (player.locked) {
                    console.log(`[Free ${r.id}] ${player.username}`);
                    io.to(socketId).emit("libere");
                }
            }
        });

        socket.on("kick", (socketId) => {
            var bool = false;
            if (p.host) {
                bool = true;
                io.in(socketId).disconnectSockets();
            }
            if (bool) {
                io.to(socket.id).emit("kick-success");
            }
        });

        socket.on("buzz", () => {
            console.log(`[Buzz ${r.id}] ${p.username}`);
            if (r.options.mode === "default-mode" && p.free && !p.host) {
                console.log(`[Buzz ${r.id}] ${p.username} confirmed default`);
                socket.to(r.id).emit("block");
                io.to(r.players[0].socketId).emit("buzzed");
                p.buzzed = true;
                p.locked = false;
                p.free = false;
                r.buzzes.push({player:p.username,time:Date.now()-p.ping});
                r.buzzes.sort((a,b)=>{
                    return a.time-b.time;
                });
                io.to(r.id).emit("player buzz", r.buzzes, r.options.point);
            }
            else if (r.options.mode === "multi-mode" && p.free && !p.host){
                console.log(`[Buzz ${r.id}] ${p.username} confirmed multi`);
                io.to(r.players[0].socketId).emit("buzzed");
                p.buzzed = true;
                p.locked = false;
                p.free = false;
                r.buzzes.push({player:p.username,time:Date.now()-p.ping});
                r.buzzes.sort((a,b)=>{
                    return a.time-b.time;
                });
                io.to(r.id).emit("player buzz", r.buzzes, r.options.point);
            }
            else if (p.host){
                p.buzzed = true;
                p.locked = false;
                p.free = false;
            }
        });

        socket.on("changePointsMode",(bool)=>{
            if (bool != r.options.point){
                r.options.point=bool;
                if (bool){
                    resetPoints(r);
                    io.to(p.roomId).emit("show scores", r);
                }
                else{
                    io.to(p.roomId).emit("unshow scores", r);
                }
            }
        });

        socket.on('resetPoints',()=>{
            resetPoints(r);
            io.to(p.roomId).emit("show scores",r);
        });

        socket.on('change points', (username,points)=>{
            console.log(username);
            console.log(points);
            var player = r.players.find((player) => { return player.username === username; });
            player.points += parseInt(points);
            io.to(p.roomId).emit("update score",player);
        });

        socket.on("disconnect", () => {
            console.log(`[Disconnection] ${socket.id}`);
            if (p && !p.host) {
                console.log(`Bye bye ${p.username}`);

                io.to(p.roomId).emit("remove player", p);
                if (r) {
                    r.players = r.players.filter((player) => player.username !== p.username);
                }

            }
            else if (p && p.host) {
                console.log(`Bye bye host ${p.username}`);
                io.in(p.roomId).disconnectSockets();
                rooms = rooms.filter((room) => room.id !== p.roomId);
                listeCodes = listeCodes.filter((code) => code !== p.roomId);
            }
        });

        socket.on("latencyIn",(start)=>{
            p.ping=(Date.now()-start)/2;
        });


        setInterval(() => {
            const start = Date.now();
            if (p){
                io.in(p.roomId).emit("latencyOut", start);
            }
            
          }, 10000);
        
        


    });

    
    function resetPoints(r){
        r.players.forEach((p)=>{
            p.points=0;
        });
    }





    return router;


}
