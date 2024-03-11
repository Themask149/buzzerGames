// jshint esversion:6
import express from 'express';
import cookieParser from 'cookie-parser';


export default function (io) {

    const router = express.Router();
    router.use(cookieParser());

    router.get('/', (req, res) => {
        res.render('randomquestion/main.ejs');
    });        

    return router;
}

