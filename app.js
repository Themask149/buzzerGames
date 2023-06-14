// jshint esversion:6
import { Server } from 'socket.io';
import express from "express";
import https from "https";
import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

dotenv.config();
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
    };

mongoose.connect(process.env.MONGOLINK,{useNewUrlParser: true, useUnifiedTopology: true});

const app = express();
const server = https.createServer(options,app);
const port = process.env.PORT || 8080;
const io = new Server(server);
import routeBuzzerFunction from './routes/buzzer.js';
import routeCenturieFunction from './routes/centurie.js';
import routeLoginAPIFunction from './API/loginAPI.js';
import routeQuizzAPIFunction from './API/quizzAPI.js';

const routeBuzzer=routeBuzzerFunction(io);
const routeCenturie=routeCenturieFunction(io);
const routeLoginAPI=routeLoginAPIFunction(io);
const routeQuizzAPI=routeQuizzAPIFunction(io);

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
app.use('/centurie',routeCenturie);
app.use('/api',routeLoginAPI);
app.use('/api',routeQuizzAPI);
app.use(cookieParser());

 
server.listen(process.env.PORT || port, function(err){
     if (err) console.log("Error in server setup");
     console.log("Server listening on Port", port);
 });

app.get('/', (req, res) => {
    res.render('home',{titre:"Welcome !",root:"",title:"Accueil"});
});




app.get('/close',(req,res)=>{
    res.set("Connection", "close");
});
//this is just testing

