// jshint esversion:6
import express from 'express';
import xss from 'xss';
import { adminAuth, isConnected, getUser } from '../API/connectivity.js';
import cookieParser from 'cookie-parser';


export default function (io) {

    const test = " test";
    const router = express.Router();
    router.use(cookieParser());

    router.get('/', (req, res) => {
        res.render('faf/fafHome');
    });
    var rooms = [{ players: [], id: 123456789, spectateurs:[], state: { start: false},options:{roundTime:20}}];
    var listeCodes = [];

    router.post('/', (req, res) => {
        const infos = req.body;
        let roomID = 0;
        if (infos.action == "host") {
            roomID = Math.floor(Math.random() * 899999) + 100000;
            listeCodes.push(parseInt(roomID));
            console.log("[Hosting] room " + roomID);
            res.redirect('/apps/faf/' + roomID);
        }
        else if (infos.action == 'join') {
            res.redirect('/apps/faf/' + infos.code);
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
            res.status(200).render('faf/host', { code: code, players: [] });
        }
        else if (listeCodes.includes(code) && room) {
            res.status(200).render('faf/player', { code: code, players: [] });
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

        socket.once('FAFplayerDataHost', (player) => {
            console.log("Receiving playerDataHost in FAF");
            if (!/^[A-Za-z0-9]*[A-Za-z0-9\s]+[A-Za-z0-9]*$/.test(player.username)) {
                socket.disconnect();
            }
            else if (!rooms.find((room) => { return player.roomId === room.id; })) {
                player.username = xss(player.username);
                player.host = true;
                player.roomId = parseInt(player.roomId);
                player.points = 0;
                player.player = true;
                p = player;
                r = { players: [], spectateurs: [], id: player.roomId, state: { start: false},options:{roundTime:20} };
                rooms.push(r);
                socket.join(p.roomId);
                console.log(`[Hosting FAF] ${p.username} host la room ` + p.roomId);
                io.to(socket.id).emit('FAF host launch', p,r);
            }

        });

        socket.on('FAFplayerData', (player) => {
            if (!/^[A-Za-z0-9]*[A-Za-z0-9\s]+[A-Za-z0-9]*$/.test(player.username)) {
                io.in(player.socketId).emit("FAF error", "Choississez un pseudo qu'avec des caractères alphanumériques");
                
            }
            else {
                console.log(`[Joining FAF] ${player.username} join la room ` + player.roomId);
                player.username = xss(player.username);
                player.host = false;
                player.roomId = parseInt(player.roomId);
                player.points = 0;
                p = player;
                r = rooms.find((room) => { return p.roomId === room.id; });
                if (!r) {
                    socket.disconnect();
                }
                else {
                    if (r.players.length>=2){
                        player.player = false;
                        r.spectateurs.push(p);
                        socket.join(p.roomId);
                        io.to(p.roomId).emit('FAF new spectateur', r,p);
                        io.to(socket.id).emit("FAF spectateur init", r, p);
                }
                    else{
                        player.player = true;
                        r.players.push(player);
                        io.to(p.roomId).emit("FAF new player", r, p);
                        socket.join(p.roomId);
                        io.to(socket.id).emit("FAF player init", r, p);
                    }
                }
            }
            console.log("Room :"+JSON.stringify(r));
        });

        socket.on("FAF time", (r) => {
            if (p && p.host) {
                r.options.roundTime = roundTime;
                io.to(p.roomId).emit("FAF time", r);
            }
        });


        socket.on("FAF kick", (socketId) => {
            var bool = false;
            if (p.host) {
                bool = true;
                io.in(socketId).emit("error", "Vous avez été kické de la partie")
                io.in(socketId).disconnectSockets();
            }
            if (bool) {
                io.to(socket.id).emit("kick-success");
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Disconnection] ${socket.id}`);
            if (p && !p.host) {
                console.log(`Bye bye ${p.username}`);

                if (p.player){

                    
                    if (r) {
                        r.players = r.players.filter((player) => player.username !== p.username);
                    }
                    io.to(p.roomId).emit("FAF remove player", r);
                }
                else{
                    
                    if (r) {
                        r.spectateurs = r.spectateurs.filter((player) => player.username !== p.username);
                    }
                    io.to(p.roomId).emit("FAF remove spectateur", r,p);
                }

            }
            else if (p && p.host) {
                console.log(`Bye bye host ${p.username}`);
                io.in(p.roomId).disconnectSockets();
                rooms = rooms.filter((room) => room.id !== p.roomId);
                listeCodes = listeCodes.filter((code) => code !== p.roomId);
            }
        });


    });

    return router;
}