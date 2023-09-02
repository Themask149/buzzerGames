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
    var rooms = [{ players: [], id: 123456789, spectateurs:[], state: { currentPlayer:null, start: false, maxScore: 0,score:0 },options:{roundTime:20}}];
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
            if (!/^[A-Za-z0-9]*$/.test(player.username)) {
                socket.disconnect();
            }
            else if (!rooms.find((room) => { return player.roomId === room.id; })) {
                player.username = xss(player.username);
                player.host = true;
                player.roomId = parseInt(player.roomId);
                p = player;
                r = { players: [p], id: player.roomId, state: { currentPlayer:null, start: false, maxScore: 0,score:0 } };
                rooms.push(r);
                socket.join(p.roomId);
                console.log(`[Hosting FAF] ${p.username} host la room ` + p.roomId);
                io.to(socket.id).emit('FAF host launch', p,r);
            }

        });

        socket.on('FAFplayerData', (player) => {
            if (!/^[A-Za-z0-9]*$/.test(player.username)) {
                io.in(player.socketId).emit("error", "Choississez un pseudo qu'avec des caractères alphanumériques");
                
            }
            else {
                console.log(`[Joining] ${player.username} join la room ` + player.roomId);
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
                    r.players.push(player);
                    io.to(p.roomId).emit("FAF new player", p);
                    socket.join(p.roomId);
                    io.to(socket.id).emit("FAF player init", r, p);
                }
            }
        });


    });

    return router;
}