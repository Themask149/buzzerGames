import { Server } from 'socket.io';
import express from "express";
import {createServer} from "http";
const app = express();
const http = createServer(app);
const port = 8080;
import path from "path";
import ejs from "ejs";

/**
 * @type {Socket}
 */
 const io = new Server(http);


 app.set('view engine', 'ejs');
 app.use('/jquery', express.static('node_modules/jquery/dist'));
 app.use('/bootstrap/css', express.static('node_modules/bootstrap/dist/css'));
 app.use('/bootstrap/js', express.static('node_modules/bootstrap/dist/js'));
 app.use('/ejs', express.static('node_modules/ejs'));
 app.use(express.static('public'));
 
 http.listen(port, function(err){
     if (err) console.log("Error in server setup")
     console.log("Server listening on Port", port);
 })

app.get('/', (req, res) => {
    res.render('home');
});
