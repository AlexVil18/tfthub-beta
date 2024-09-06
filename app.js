const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const http = require('http');
const socketIo = require('socket.io');

// Modelos
const News = require('./models/News');
const Compos = require('./models/Compos');
const Category = require('./models/Category');
const User = require('./models/User');
const Guide = require('./models/Guide');

// Inicializar Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 5000;

// Conectar a MongoDB
mongoose.connect('mongodb://localhost/tfthub')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Configurar multer para cargas de archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads'); // Carpeta sin 'public/'
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Acceso a archivos subidos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesión y Passport
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use(flash()); // Inicializar mensajes flash
app.use(passport.initialize());
app.use(passport.session());

// Configurar Passport
require('./config/passport')(passport);

// Rutas principales
app.get('/', (req, res) => {
    News.find().populate('category').sort({ createdAt: -1 }).limit(3) // Limitar a las últimas 3 noticias para la página de inicio
        .then(news => {
            res.render('index', { news }); // Pasar noticias a la vista
        })
        .catch(err => {
            console.error('Error fetching news:', err);
            res.render('index', { news: [] }); // Pasar un array vacío en caso de error
        });
});

// Rutas para la administración
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// API para noticias, composiciones y guías
app.post('/api/news', upload.single('image'), (req, res) => {
    const { title, category, summary } = req.body;
    const image = req.file ? req.file.path : ''; // Ruta de la imagen cargada

    const news = new News({ title, category, summary, image });
    news.save()
        .then(() => {
            io.emit('news:update'); // Emitir evento para actualizar las noticias
            res.status(200).json({ message: 'Noticia creada correctamente' });
        })
        .catch(err => res.status(500).json({ error: err }));
});

app.post('/api/compos', upload.single('image'), (req, res) => {
    const { title, category, summary } = req.body;
    const image = req.file ? req.file.path : ''; // Ruta de la imagen cargada

    const compos = new Compos({ title, category, summary, image });
    compos.save()
        .then(() => res.status(200).json({ message: 'Compo añadida correctamente' }))
        .catch(err => res.status(500).json({ error: err }));
});

app.post('/api/guides', async (req, res) => {
    const { nombre, descripcion, detalles, videoURL } = req.body;

    if (!nombre || !descripcion || !detalles || !videoURL) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const guide = new Guide({ nombre, descripcion, detalles, videoURL });
    try {
        await guide.save();
        res.status(200).json({ message: 'Guía añadida correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/guides/edit/:id', async (req, res) => {
    const { nombre, descripcion, detalles, videoURL } = req.body;

    Guide.findByIdAndUpdate(req.params.id, { nombre, descripcion, detalles, videoURL })
        .then(() => res.status(200).json({ message: 'Guía actualizada correctamente' }))
        .catch(err => res.status(500).json({ error: err }));
});

app.delete('/api/guides/:id', async (req, res) => {
    Guide.findByIdAndDelete(req.params.id)
        .then(() => res.status(200).json({ message: 'Guía eliminada correctamente' }))
        .catch(err => res.status(500).json({ error: err }));
});

// Endpoint para obtener solo las últimas 3 noticias
app.get('/api/latest-news', (req, res) => {
    News.find().populate('category').sort({ createdAt: -1 }).limit(3) // Limitar a las últimas 3 noticias
        .then(news => res.status(200).json(news))
        .catch(err => res.status(500).json({ error: err }));
});

// Endpoint para obtener todas las noticias
app.get('/api/news', (req, res) => {
    News.find().populate('category').sort({ createdAt: -1 }) // No hay limitación aquí
        .then(news => res.status(200).json(news))
        .catch(err => res.status(500).json({ error: err }));
});

app.get('/api/compos', (req, res) => {
    Compos.find().sort({ createdAt: -1 })
        .then(compos => res.status(200).json(compos))
        .catch(err => res.status(500).json({ error: err }));
});

// Rutas para el apartado de noticias
app.get('/noticias', (req, res) => {
    News.find().populate('category').sort({ createdAt: -1 }) // Obtener todas las noticias para la página de noticias
        .then(news => {
            res.render('noticias', { news }); // Pasar noticias a la vista
        })
        .catch(err => {
            console.error('Error fetching news:', err);
            res.render('noticias', { news: [] }); // Pasar un array vacío en caso de error
        });
});

// Ruta para ver una noticia específica
app.get('/noticia/:id', (req, res) => {
    const { id } = req.params;
    News.findById(id)
        .populate('category') // Si necesitas la categoría
        .then(news => {
            if (news) {
                res.render('noticia', { news }); // Renderiza la vista 'noticia.ejs'
            } else {
                res.status(404).send('Noticia no encontrada');
            }
        })
        .catch(err => res.status(500).json({ error: err }));
});

// Rutas para el apartado de guías
app.get('/guias', (req, res) => {  // Cambiado de '/guides' a '/guias'
    Guide.find().sort({ createdAt: -1 }) // Obtener todas las guías
        .then(guides => {
            res.render('guias', { guides }); // Renderiza la vista de guías 'guias.ejs'
        })
        .catch(err => {
            console.error('Error fetching guides:', err);
            res.render('guias', { guides: [] }); // Pasar un array vacío en caso de error
        });
});

app.get('/guia/:id', (req, res) => {  // Cambiado de '/guide/:id' a '/guia/:id'
    const { id } = req.params;
    Guide.findById(id)
        .then(guide => {
            if (guide) {
                res.render('guia', { guide }); // Renderiza la vista de la guía 'guia.ejs'
            } else {
                res.status(404).send('Guía no encontrada');
            }
        })
        .catch(err => res.status(500).json({ error: err }));
});

// Inicializar Socket.io
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// Iniciar servidor
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
