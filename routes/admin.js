const express = require('express');
const router = express.Router();
const passport = require('passport');
const Category = require('../models/Category');
const News = require('../models/News');
const Guide = require('../models/Guide'); // Importa el modelo de Guía
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer'); // Para manejar archivos subidos

// Configuración de multer para manejar las subidas de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Carpeta donde se almacenan las imágenes, sin el prefijo 'public/'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
    }
});
const upload = multer({ storage: storage });

// Ruta para la página de inicio de sesión
router.get('/login', (req, res) => {
    res.render('admin/login', { message: req.flash('error') });
});

// Ruta para procesar el inicio de sesión
router.post('/login', passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/login',
    failureFlash: true
}));

// Ruta para el panel de administración (solo accesible si el usuario está autenticado)
router.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/admin/login');
    });
});

// Ruta para las configuraciones del sitio (solo accesible si el usuario está autenticado)
router.get('/settings', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const siteName = 'TFTHub'; // Ejemplo de nombre del sitio
            const categories = await Category.find(); // Obtener categorías de la base de datos
            res.render('admin/settings', { siteName, categories });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al obtener las categorías');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para manejar la actualización de las configuraciones del sitio
router.post('/settings', (req, res) => {
    if (req.isAuthenticated()) {
        const { siteName } = req.body;

        console.log(`Nuevo nombre del sitio: ${siteName}`);

        req.flash('success', 'Ajustes guardados con éxito.');
        res.redirect('/admin/settings');
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para añadir una nueva categoría
router.post('/settings/categories', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { categoryName } = req.body;
            const newCategory = new Category({ name: categoryName });
            await newCategory.save();
            req.flash('success', 'Categoría añadida con éxito.');
            res.redirect('/admin/settings');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al añadir la categoría');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para actualizar una categoría existente
router.post('/settings/categories/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { categoryName } = req.body;
            await Category.findByIdAndUpdate(req.params.id, { name: categoryName });
            req.flash('success', 'Categoría actualizada con éxito.');
            res.redirect('/admin/settings');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al actualizar la categoría');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para eliminar una categoría
router.post('/settings/categories/delete/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await Category.findByIdAndDelete(req.params.id);
            req.flash('success', 'Categoría eliminada con éxito.');
            res.redirect('/admin/settings');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al eliminar la categoría');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para el panel de noticias
router.get('/news', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const news = await News.find().populate('category'); // Asegúrate de hacer populate para obtener la información de la categoría
            const categories = await Category.find(); // Obtener categorías de la base de datos
            res.render('admin/news', { news, categories });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al obtener las noticias');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para añadir una nueva noticia
router.post('/news', upload.single('image'), async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { title, category, summary, content } = req.body;
            const image = req.file ? req.file.path : ''; // Ruta de la imagen cargada, ya sin 'public/'
            const news = new News({ title, category, summary, content, image });
            await news.save();
            req.flash('success', 'Noticia añadida con éxito.');
            res.redirect('/admin/news');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al añadir la noticia');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para eliminar una noticia
router.post('/news/delete/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await News.findByIdAndDelete(req.params.id);
            req.flash('success', 'Noticia eliminada con éxito.');
            res.redirect('/admin/news');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al eliminar la noticia');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para editar una noticia
router.get('/news/edit/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const news = await News.findById(req.params.id).populate('category');
            const categories = await Category.find();
            const message = req.flash('message') || ''; // Asigna un valor predeterminado en caso de que no haya mensaje
            res.render('admin/edit-news', { news, categories, message });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al obtener la noticia');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para actualizar una noticia
router.post('/news/edit/:id', upload.single('image'), async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { title, category, summary, content } = req.body;
            const image = req.file ? req.file.path : ''; // Ruta de la imagen cargada

            await News.findByIdAndUpdate(req.params.id, { 
                title, 
                category, 
                summary, 
                content, 
                ...(image && { image }) // Actualiza la imagen solo si se subió una nueva
            });
            req.flash('success', 'Noticia actualizada con éxito.');
            res.redirect('/admin/news');
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al actualizar la noticia');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Sección de Guías

// Mostrar todas las guías
router.get('/guides', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const guides = await Guide.find();
            res.render('admin/guides', { guides });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al obtener las guías');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Formulario para agregar una guía
router.get('/guides/new', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('admin/addGuide');
    } else {
        res.redirect('/admin/login');
    }
});

// Agregar una nueva guía
router.post('/guides', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { nombre, descripcion, detalles, videoURL } = req.body;
            const newGuide = new Guide({ nombre, descripcion, detalles, videoURL });
            await newGuide.save();
            req.flash('success', 'Guía añadida con éxito.');
            res.redirect('/admin/guides');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al agregar la guía');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Eliminar una guía
router.post('/guides/delete/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await Guide.findByIdAndDelete(req.params.id);
            req.flash('success', 'Guía eliminada con éxito.');
            res.redirect('/admin/guides');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al eliminar la guía');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Ruta para editar una guía
router.get('/guides/edit/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const guide = await Guide.findById(req.params.id);
            res.render('admin/edit-guide', { guide });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al obtener la guía');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Actualizar una guía
router.post('/guides/edit/:id', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const { nombre, descripcion, detalles, videoURL } = req.body;
            await Guide.findByIdAndUpdate(req.params.id, { nombre, descripcion, detalles, videoURL });
            req.flash('success', 'Guía actualizada con éxito.');
            res.redirect('/admin/guides');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al actualizar la guía');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Cambio de credenciales
router.post('/change-credentials', async (req, res) => {
    if (req.isAuthenticated()) {
        const { username, newPassword } = req.body;
        try {
            const user = await User.findOne({ username: req.user.username });
            if (user) {
                user.password = await bcrypt.hash(newPassword, 10);
                await user.save();
                req.flash('success', 'Contraseña actualizada con éxito.');
                res.redirect('/admin/settings');
            } else {
                req.flash('error', 'Usuario no encontrado.');
                res.redirect('/admin/settings');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al actualizar la contraseña');
        }
    } else {
        res.redirect('/admin/login');
    }
});

module.exports = router;
