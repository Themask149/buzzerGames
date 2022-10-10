// jshint esversion:6
import { Server } from 'socket.io';
import express from "express";
import {createServer} from "http";
const app = express();
const http = createServer(app);
const port = 8080;
const io = new Server(http);
import routeBuzzerFunction from './routes/buzzer.js';
import ejs from "ejs";

const routeBuzzer=routeBuzzerFunction(io);
/**
 * @type {Socket}
 */
app.use(express.urlencoded({
    extended: true
  }));
app.use(express.json());
 app.set('view engine', 'ejs');
 app.use('/jquery', express.static('node_modules/jquery/dist'));
 app.use('/bootstrap/css', express.static('node_modules/bootstrap/dist/css'));
 app.use('/bootstrap/js', express.static('node_modules/bootstrap/dist/js'));
 app.use('/ejs', express.static('node_modules/ejs'));
 app.use(express.static('public'));
 app.use('/apps/buzzer',routeBuzzer);

 
 http.listen(process.env.PORT || port, function(err){
     if (err) console.log("Error in server setup");
     console.log("Server listening on Port", port);
 });

app.get('/', (req, res) => {
    res.render('home',{titre:"Welcome !",root:"",title:"Accueil"});
});

app.get('/close',(req,res)=>{
    res.set("Connection", "close");
})
