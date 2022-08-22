// jshint esversion:6
import express from 'express';
import xss from 'xss';

export default function (io) {

    const router = express.Router();

    router.get('/', (req, res) => {
        res.render('buzzer/buzzerHome');
    });

    router.get('/debug', (req, res) => {
        res.render('buzzer/host', { code: 10000, players: [{ username: "test" }, { username: "test2" }, { username: "test3" }] });
    });

    var rooms = [{ players: [], id: 123456789, mode: "default" }];
    var listeCodes = [];

    router.post('/', (req, res) => {
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
        if (listeCodes.includes(code) && !room) {
            res.status(200).render('buzzer/host', { code: code, players: [] });
        }
        else if (listeCodes.includes(code) && room) {
            res.status(200).render('buzzer/player', { code: code, players: [] });
        }
        else {
            res.status(404).render('home', { titre: "Pas de salles associées", root: "../../", title: "Erreur" });
        }

    });

    io.on('connection', (socket) => {
        var p;
        var r;
        console.log(`[Connection] ${socket.id}`);

        socket.once('playerDataHost', (player) => {
            console.log("Receiving playerDataHost");
            if (!/^[A-Za-z0-9]*$/.test(player.username)) {
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
                r = { players: [p], id: player.roomId, options: { mode: "default-mode" } };
                rooms.push(r);
                socket.join(p.roomId);

                console.log(`[Hosting] ${p.username} host la room ` + p.roomId);
                io.to(socket.id).emit('host launch', p);
            }

        });

        socket.on('playerData', (player) => {
            if (!/^[A-Za-z0-9]*$/.test(player.username)) {
                io.in(p.roomId).emit("error", "Choississez un pseudo qu'avec des caractères alphanumériques")
                socket.disconnect();
            }
            else {
                console.log(`[Joining] ${player.username} join la room ` + player.roomId);
                player.username = xss(player.username);
                player.host = false;
                player.roomId = parseInt(player.roomId);
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
                    io.to(p.roomId).emit("new player", p);
                    socket.join(p.roomId);
                    io.to(socket.id).emit("player init", r, p);
                }
            }
        });

        socket.on("changeMode", (mode) => {
            console.log("Receiving changeMode")

            if (isHost(socket.id, p, r)) {
                console.log(`[Changing mode ${r.id}] from ${r.options.mode} to ${mode}`)
                r.options.mode = mode;
                socket.emit("modeChanged")
                console.log(rooms)
            }
        })

        socket.on("libere", (str) => {
            console.log(`[Free ${r.id}] ${p.username}`);
            if ((p.buzzed || p.locked) && !p.free) {
                console.log(`[Freeing ${r.id}] ${p.username}`)
                p.buzzed = false;
                p.locked = false;
                p.free = true;
                if (p.host && str==="all") {
                    socket.to(r.id).emit("libere");
                    if (r.options.mode === "default-mode") {
                        console.log("clearing buzz")
                        io.to(r.id).emit("clear buzz")
                    }
                }
            }
            else if (p.free  && !p.locked&&!p.buzzed){
                
            }
            else {
                io.in(p.roomId).emit("error", "Etat du buzzer non stable");
                io.in(p.roomId).disconnectSockets();
            }


        })

        socket.on("block", (str="only") => {
            console.log(`[Block ${r.id}] ${p.username}`);
            if ((p.buzzed || p.free) && !p.locked) {
                console.log(`[Blocking ${r.id}] ${p.username}`)
                p.buzzed = false;
                p.locked = true;
                p.free = false;
                if (p.host && str==="all") {
                    socket.to(r.id).emit("block");
                    console.log("testing")
                }
            }
            else if ((p.locked || p.buzzed) && !p.free){
                
            }
            else {
                io.in(p.roomId).emit("error", "Etat du buzzer non stable")
                io.in(p.roomId).disconnectSockets();
            }

        })

        socket.on("kick", (socketId) => {
            var bool = false;
            if (p.host) {
                bool = true;
                io.in(socketId).disconnectSockets();
            }
            if (bool) {
                io.to(socket.id).emit("kick-success");
            }
        })

        socket.on("buzz", () => {
            console.log(`[Buzz ${r.id}] ${p.username}`);
            console.log(p);
            if (r.options.mode === "default-mode" && p.free) {
                console.log(`[Buzz ${r.id}] ${p.username} confirmed`)
                socket.to(r.id).emit("block");
                p.buzzed = true;
                p.locked = false;
                p.free = false;
                io.to(r.id).emit("player buzz", p)
            }
        })

        socket.on("disconnect", () => {
            console.log(`[Disconnection] ${socket.id}`)
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
                rooms = rooms.filter((room) => room.id = !p.roomId);
                listeCodes = listeCodes.filter((code) => code !== p.roomId);
            }
        })


    });

    function isHost(socketId, player, room) {
        if (room) {
            player = room.players.find((player) => { return player.socketId === socketId });
            return player.host;
        }
        else return false;

    }





    return router;


}