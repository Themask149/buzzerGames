import express from 'express';
const router = express.Router();

router.get('/',(req,res)=>{
    res.render('buzzer/buzzerHome');
});

export default router;