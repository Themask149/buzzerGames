import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../model/user.js';
import emailValidator from 'deep-email-validator';
import { adminAuth, isConnected } from './connectivity.js';
const saltRounds = 10;
const maxAge = 60 * 60 * 24 * 7;


export default function (io) {
	const router = express.Router();

	router.post('/register', async (req, res) => {
		console.log(
			'New register request from ' +
			req.body.username +
			' with email ' +
			req.body.email
		);
		if (!req.body.username || !req.body.email || !req.body.password) {
			console.log('One of the fields is empty');
			res.json({
				status: 'error',
				error: 'Veuillez remplir tous les champs !'
			});
			return;
		} else if (
			typeof req.body.username !== 'string' ||
			!/^[a-zA-Z]+$/.test(req.body.username)
		) {
			console.log('Username is not a string or contains numbers');
			return res.json({
				status: 'error',
				error: "Le nom d'utilisateur doit être une chaîne de caractères constituée de lettres !"
			});
		}
		var test = await emailValidator.validate(req.body.email);
		if (!test.valid) {
			console.log('Email is not valid');
			return res.json({
				status: 'error',
				error: 'Email invalide !'
			});
		}
		console.log(req.body.email + ' passes the test ');

		try {
			const hashedPassword = await bcrypt.hash(
				req.body.password,
				saltRounds
			);
			const user = await User.create({
				username: req.body.username,
				email: req.body.email,
				password: hashedPassword
			});
			const token = jwt.sign(
				{
					id: user._id,
					username: user.username,
					role: user.role
				},
				process.env.JWT_SECRET,
				{
					expiresIn: maxAge
				}
			);
			console.log('User created:', user.username);
			res.cookie('token', token, {
				httpOnly: true,
				maxAge: maxAge * 1000,
				sameSite: 'strict'
			});
			res.status(201).json({
				status: 'success'
			});
		} catch (error) {
			console.log(error)
			console.log('Register duplication error');
			return res.json({
				status: 'error',
				error: "Email ou nom d'utilisateur déjà utilisé !"
			});
		}
	});

	router.post('/login', async (req, res) => {
		console.log('New login request from ' + req.body.username);
		if (!req.body.username || !req.body.password) {
			console.log('One of the fields is empty');
			res.json({
				status: 'error',
				error: 'Veuillez remplir tous les champs !'
			});
			return;
		} else if (
			typeof req.body.username !== 'string' ||
			!/^[a-zA-Z]+$/.test(req.body.username)
		) {
			console.log('Username is not a string or contains numbers');
			res.json({
				status: 'error',
				error: "Le nom d'utilisateur doit être une chaîne de caractères constituée de lettres !"
			});
			return;
		}
		const user = await User.findOne({
			username: req.body.username
		}).lean();
		if (!user) {
			console.log('User not found');
			res.json({
				status: 'error',
				error: 'Utilisateur/Mot de passe incorrect !'
			});
			return;
		}
		if (await bcrypt.compare(req.body.password, user.password)) {
			console.log('User found');
			const token = jwt.sign(
				{
					id: user._id,
					username: user.username,
					role: user.role
				},
				process.env.JWT_SECRET,
				{
					expiresIn: maxAge
				}
			);
			res.cookie('token', token, {
				httpOnly: true,
				maxAge: maxAge * 1000,
				sameSite: 'strict'
			});
			res.status(200).json({
				status: 'success',
				token: token
			});
			return;
		}
		else {
			console.log('Password is incorrect');
			res.json({
				status: 'error',
				error: 'Utilisateur/Mot de passe incorrect !'
			});
			return;
		}
	});

	router.post('/change-password', async (req, res) => {
		
	});

	// Create CRUD API for users

	// router.get('/users', adminAuth, async (req, res) => {
	// 	User.find().lean().then(users => {
	// 		const usersWithoutPass = users.map(user => {
	// 			const { password, ...userWithoutPass } = user._doc;
	// 			return userWithoutPass;
	// 		});
	// 		res.status(200).json(usersWithoutPass);
	// 	})
	// 		.catch(err => {
	// 			res.status(500).json({ error: err.message });
	// 		});
	// });

	// router.post('/users', adminAuth, async (req, res) => {
	// 	const { username, email, password, role } = req.body;
	// 	const hashedPassword = await bcrypt.hash(password, saltRounds);
	// 	const user = new User({
	// 		username: username,
	// 		email: email,
	// 		password: hashedPassword,
	// 		role: role
	// 	});
	// 	user.save()
	// 		.then(user => {
	// 			const { password, ...userWithoutPass } = user._doc;
	// 			res.status(201).json(userWithoutPass);
	// 		})
	// 		.catch(err => {
	// 			res.status(500).json({ error: err.message });
	// 		});
	// });

	// router.get('/users/:username', adminAuth, async (req, res) => {
	// 	User.findOne({ username: req.params.username }).lean().then(user => {
	// 		const { password, ...userWithoutPass } = user._doc;
	// 		res.status(200).json(userWithoutPass);
	// 	})
	// 		.catch(err => {
	// 			res.status(500).json({ error: err.message });
	// 		});
	// });

	// router.put('/users/:username', adminAuth, async (req, res) => {
	// 	const { username, email, password, role } = req.body;
	// 	const hashedPassword = await bcrypt.hash(password, saltRounds);
	// 	User.findOneAndUpdate({ username: req.params.username }, {
	// 		username: username,
	// 		email: email,
	// 		password: hashedPassword,
	// 		role: role
	// 	}, { new: true }).lean().then(user => {
	// 		const { password, ...userWithoutPass } = user._doc;
	// 		res.status(200).json(userWithoutPass);
	// 	})
	// 		.catch(err => {
	// 			res.status(500).json({ error: err.message });
	// 		});
	// });

	// router.delete('/users/:username', adminAuth, async (req, res) => {
	// 	User.findOneAndDelete({ username: req.params.username }).lean().then(user => {
	// 		const { password, ...userWithoutPass } = user._doc;
	// 		res.status(200).json(userWithoutPass);
	// 	})
	// 		.catch(err => {
	// 			res.status(500).json({ error: err.message });
	// 		});
	// });

		

	return router;


}
