const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/tfthub', {
    
});

const newUser = new User({
    username: 'admin',
    password: '123456'
});

bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save()
            .then(user => {
                console.log('Usuario administrador creado');
                mongoose.connection.close();
            })
            .catch(err => console.log(err));
    });
});
