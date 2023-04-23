import jwt from 'jsonwebtoken';

function adminAuth(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('login');
            } else {
                if (decodedToken.role === 'admin') {
                    next();
                }
                else {
                    res.redirect('login');
                }
            }
        });
    }
    else {
        res.redirect('login');
    }
}

function isAdmin(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                next(false);
            } else {
                if (decodedToken.role === 'admin') {
                    next(true);
                }
                else {
                    next(false);
                }
            }
        });
    }
    else {
        next(false);
    }
}

function isConnected(req, res, next) {
    if (req.cookies.token) {
        const token = req.cookies.token;
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                next(false)
            } else {
                if (decodedToken.role) {
                    next(true)
                }
            }
        });
    }
    else {
        next(false);
    }
}

export { adminAuth, isAdmin,isConnected };