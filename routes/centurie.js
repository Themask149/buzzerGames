import express from 'express';
import xss from 'xss';
import cookieParser from 'cookie-parser';
import { adminAuth, isConnected, getUser } from '../API/connectivity.js';

export default function (io) {
    const router = express.Router();
    router.use(cookieParser());

    // router.all('*', (req, res, next) => {
    //     res.send('Désolé, je code encore cette partie...');
    // });
    router.get('/', (req, res) => {
        res.redirect('centurie/home');
    });
    router.get('/login',(req, res) => {
        isConnected(req, res, (connected) => {
            if (connected) {
                res.redirect('home');
            }
            else {
                res.render('centurie/login', { connected: connected });
            }
        });
        
    });
    router.get('/register', (req, res) => {
        isConnected(req, res, (connected) => {
            if (connected) {
                res.redirect('home');
            }
            else {
                res.render('centurie/register', { connected: connected });
            }
        });
    });
    router.get('/home', (req, res) => {
        isConnected(req, res, (connected) => {
            res.render('centurie/home', { connected: connected });
        });
    });

    router.get('/logout', (req, res) => {
        isConnected(req, res, (connected) => {
            if (connected) {
                res.cookie('token', '', { maxAge: 1 });        
            }
            res.redirect('home');
        });
    });

    router.get('/profil', (req, res) => {
        getUser(req, res, (user) => {
            if (user) {
                console.log(user);
                res.render('centurie/profil', { user: user, connected: true });
            }
            else {
                res.redirect('logout');
            }
        });
    });


    router.get('/dashboard', adminAuth, (req, res) => {
        res.render('centurie/dashboard');
    });

    return router;
}
