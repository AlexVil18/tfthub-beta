const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Ruta de inicio de sesión
router.get('/admin/login', (req, res) => res.render('login'));

// Procesar inicio de sesión
router.post('/admin/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/admin/login',
        failureFlash: true
    })(req, res, next);
});

// Ruta de logout
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return next(err);
        }
        req.flash('success_msg', 'Sesión cerrada correctamente');
        res.redirect('/admin/login');
    });
});

module.exports = router;
