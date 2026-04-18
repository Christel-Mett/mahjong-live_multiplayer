const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt'); 
const crypto = require('crypto');    // NEU: Für den Verifizierungs-Token
const nodemailer = require('nodemailer'); // NEU: Für den Mail-Versand
require('dotenv').config();
const saltRounds = 10;
const pwReset = require('./pw_reset');
const captcha = require('./captcha');
/*const app = express();
const session = require('express-session');*/
const helmet = require('helmet'); // Helmet laden
const app = express();
// Speicher für Login-Versuche pro IP (Rate-Limiting)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 100; // Limit: 100 Versuche pro IP
const WINDOW_TIME = 15 * 60 * 1000; // Zeitfenster: 15 Minuten

// Sicherheits-Header konfigurieren
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'", 
                "https://www.google.com", 
                "https://www.gstatic.com",
                "https://cdnjs.cloudflare.com" 
            ],
            "script-src-attr": ["'unsafe-inline'"],
            "frame-src": ["'self'", "https://www.google.com"],
            "connect-src": ["'self'", "wss:", "ws:", "https:", "http:"],
            "img-src": ["'self'", "data:", "https:", "blob:"], 
            "style-src": ["'self'", "'unsafe-inline'"],
            "worker-src": ["'self'", "blob:"] 
        },
    },
    // Erzwingt HTTPS für ein Jahr (HSTS)
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    // Steuert, welche Informationen beim Verlassen der Seite gesendet werden
    referrerPolicy: { 
        policy: "strict-origin-when-cross-origin" 
    },
    // Deaktiviert ungenutzte Browser-Funktionen für mehr Privatsphäre
    permissionsPolicy: {
        features: {
            camera: ["'none'"],
            microphone: ["'none'"],
            geolocation: ["'none'"],
            "interest-cohort": ["'none'"] // Verhindert Googles FLoC-Tracking
        },
    }
}));

// Express-Identität (X-Powered-By) verbergen
app.disable('x-powered-by');

const session = require('express-session');
const checkAuth = require('./auth');
app.set('trust proxy', 1); // NEU: Vertraut dem Nginx-Proxy
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
//        origin: "https://staging.mahjong-treff.de",
		  origin: process.env.APP_URL,
        methods: ["GET", "POST"]
    }
});

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => { if (!err) console.log('Datenbank verbunden!');
else console.log('Datenbank verbunden!');
 });

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, 
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// --- NEU: Session-Konfiguration ---
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true, 
        httpOnly: true,
        sameSite: 'lax', 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(express.json());

// --- NEU: Gezielte Zugriffskontrolle & Sicherheits-Middleware ---

// 1. GLOBALER DATEI-SCHUTZ: Verhindert den Direktaufruf von .js Dateien
app.use((req, res, next) => {
    // Pfad bereinigen (entfernt Query-Parameter wie ?v=123)
    const cleanPath = req.path.split('?')[0];
    const ext = path.extname(cleanPath).toLowerCase();

    // Wenn es keine JavaScript-Datei ist, direkt weiter
    if (ext !== '.js') {
        return next();
    }

    // EXAKTE Prüfung der Ausnahmen (kein .includes oder .endsWith)
    const isSocketIo = cleanPath.startsWith('/socket.io/');
    const isCaptcha = cleanPath === '/captcha.js';

    if (isSocketIo || isCaptcha) {
        return next();
    }

    // Schutz für alle anderen .js Dateien
    if (req.session && req.session.username) {
        return next();
    }

    res.status(403).send('Zugriff verweigert.');
});

// 2. ÖFFENTLICHER BEREICH: Jeder darf diese Dateien sehen
const publicFiles = ['/', '/index.html', '/impressum.html', '/datenschutz.html', '/nutzung.html', '/news.html', '/anleitung.html', '/style.css', '/captcha.js'];
publicFiles.forEach(file => {
    app.get(file, (req, res) => res.sendFile(path.join(__dirname, file === '/' ? 'index.html' : file)));
});

// Gemeinsame Ressourcen (Bilder/Sounds) sind immer frei
app.use('/shared', express.static(path.join(__dirname, 'shared')));
// NEU: Download-Bereich für das Projekt-ZIP (öffentlich zugänglich)
app.use('/public/downloads', express.static(path.join(__dirname, 'public/downloads')));
// NEU: Zugriff auf das Chat-Modul im Hauptverzeichnis (NUR für eingeloggte User)
app.get('/chat-module.js', checkAuth, (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const stats = loginAttempts.get(clientIp) || { count: 0, firstAttempt: Date.now() };
    if (stats.count >= MAX_ATTEMPTS) return res.status(429).send('Rate limit exceeded');
    stats.count++;
    loginAttempts.set(clientIp, stats);
    next();
}, (req, res) => {
    res.sendFile(path.join(__dirname, 'chat-module.js'));
});

// 3. GESCHÜTZTER BEREICH: Zugriff nur mit aktiver Session
// Wir definieren erst die Middleware und DANN die statischen Ordner
app.use('/single', checkAuth);
app.use('/multi', checkAuth);
app.use('/auswahl', checkAuth);

// Jetzt die Ordner freigeben (nachdem checkAuth für diese Pfade oben schon "Ja" gesagt hat)
app.use('/single', express.static(path.join(__dirname, 'single')));
app.use('/multi', express.static(path.join(__dirname, 'multi')));
app.use('/auswahl', express.static(path.join(__dirname, 'auswahl')));

app.get('/lobby.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'lobby.html')));
// 4. SESSION-STEUERUNG: Brücke und Logout

// Minimales Rate-Limiting für die Session-Brücke (CodeQL Fix)
app.post('/set-session', (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const stats = loginAttempts.get(clientIp) || { count: 0, firstAttempt: now };

    if (now - stats.firstAttempt > WINDOW_TIME) {
        stats.count = 0;
        stats.firstAttempt = now;
    }

    if (stats.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ success: false, message: 'Zu viele Anfragen.' });
    }
    
    stats.count++;
    loginAttempts.set(clientIp, stats);
    next();
}, (req, res) => {
    const { username } = req.body;
    if (username && loggedInUsers.has(username)) {
        req.session.username = username;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false });
});

// DER ECHTE LOGOUT: Vernichtet den Cookie im Browser
app.get('/logout', (req, res) => {
    if (req.session && req.session.username) {
        loggedInUsers.delete(req.session.username); // Aus RAM löschen
    }
    req.session.destroy((err) => { // Cookie ungültig machen
        res.clearCookie('connect.sid'); // Session-Cookie explizit löschen
        res.redirect('/');
    });
});
//Ende des eingefügten Blocks


const onlineUsers = {}; 
const loggedInUsers = new Set(); // NEU: Der Speicher für den Türsteher
let waitingQueue = []; 
let layoutQueue = [];
const MAX_RANK_DIFF = 20; 

const activeGames = {};

// --- CHAT LOGIK (Flüchtig im RAM) ---
let chatHistory = [];
const MAX_CHAT_MSGS = 50;

function sanitize(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;'
    };
    const reg = /[&<>"'/]/ig;
    return text.replace(reg, (match) => (map[match]));
}

const meineLayouts = [
    'arrow', 'balance', 'bug', 'chip', 'eagle', 'enterprise', 'flowers', 'future', 'garden', 'glade', 
    'helios', 'inner_circle', 'km', 'mesh', 'rocket', 'the_door', 'time_tunnel'
];

// --- DIESE FUNKTION WURDE NACH OBEN VERSCHOBEN ---
function starteMatch(peer, snapper) {
    const roomID = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const layout = meineLayouts[Math.floor(Math.random() * meineLayouts.length)];
    const seed = Math.floor(Math.random() * 1000000);
    const startTime = Date.now() + 3000;

    activeGames[roomID] = {
        players: {
            [peer.socket.id]: { name: peer.name, points: 0 },
            [snapper.socket.id]: { name: snapper.name, points: 0 }
        },
        finishedCount: 0,
        timer: null
    };

    peer.socket.join(roomID);
    snapper.socket.join(roomID);

    peer.socket.emit('match_found', { 
        room: roomID, 
        layout, 
        seed, 
        startTime, 
        opponent: snapper.name 
    });

    snapper.socket.emit('match_found', { 
        room: roomID, 
        layout, 
        seed, 
        startTime, 
        opponent: peer.name 
    });

    console.log(`Match fixiert: ${peer.name} (R:${peer.rank}) vs ${snapper.name} (R:${snapper.rank})`);
broadcastUserList();
}

// Intervall-Checker für die Warteschlange
setInterval(() => {
    if (waitingQueue.length < 2) return;
    const jetzt = Date.now();

    for (let i = 0; i < waitingQueue.length; i++) {
        for (let j = i + 1; j < waitingQueue.length; j++) {
            const p1 = waitingQueue[i];
            const p2 = waitingQueue[j];
            const diff = Math.abs(p1.rank - p2.rank);
            const wartedauerP1 = jetzt - p1.startTime;
            const wartedauerP2 = jetzt - p2.startTime;

            if (diff <= MAX_RANK_DIFF || wartedauerP1 > 30000 || wartedauerP2 > 30000) {
                waitingQueue.splice(j, 1);
                waitingQueue.splice(i, 1);
                starteMatch(p1, p2);
                return; 
            }
        }
    }
}, 1000);

// Intervall-Checker für die gestaffelte Layout-Gegnersuche (3 Phasen)
setInterval(() => {
    if (layoutQueue.length < 1) return;
    const jetzt = Date.now();

    for (let i = 0; i < layoutQueue.length; i++) {
        const p1 = layoutQueue[i];
        const dauerP1 = jetzt - p1.startTime;

        // --- Suche Partner primär in layoutQueue (Phasen 1, 2 und Phase 3-Intern) ---
        for (let j = 0; j < layoutQueue.length; j++) {
            if (i === j) continue;
            const p2 = layoutQueue[j];
            const diff = Math.abs(p1.rank - p2.rank);
            const maxWartezeit = Math.max(dauerP1, jetzt - p2.startTime);

            let matchGefunden = false;

            // PHASE 1: Beginnt sofort bei Queue-Beitritt (0 bis 30 Sekunden)
            if (maxWartezeit <= 30000) {
                if (p1.layoutId === p2.layoutId && diff <= MAX_RANK_DIFF) matchGefunden = true;
            } 
            // PHASE 2: Beginnt ab einer Wartezeit von 30.000ms (30 bis 60 Sekunden)
            else if (maxWartezeit <= 60000) {
                if (p1.layoutId === p2.layoutId) matchGefunden = true;
            } 
            // PHASE 3 (Intern): Beginnt ab einer Wartezeit von 60.000ms
            else {
                // Layout egal. Priorität auf Rang, dann jeder.
                if (diff <= MAX_RANK_DIFF) matchGefunden = true; 
                else matchGefunden = true; 
            }

            if (matchGefunden) {
                layoutQueue.splice(Math.max(i, j), 1);
                layoutQueue.splice(Math.min(i, j), 1);
                starteMatchSpeziell(p1, p2, p1.layoutId);
                return;
            }
        }

        // --- PHASE 3 (Extern): Suche in waitingQueue, wenn p1 > 60s wartet ---
        if (dauerP1 > 60000 && waitingQueue.length > 0) {
            // Option A: Erst passender Rang, sonst der Erste in der Schlange
            let targetIdx = waitingQueue.findIndex(wp => Math.abs(p1.rank - wp.rank) <= MAX_RANK_DIFF);
            if (targetIdx === -1) targetIdx = 0;

            const p2 = waitingQueue[targetIdx];
            layoutQueue.splice(i, 1);
            waitingQueue.splice(targetIdx, 1);
            
            starteMatchSpeziell(p1, p2, p1.layoutId);
            return;
        }
    }
}, 1000);


function starteMatchSpeziell(peer, snapper, gewähltesLayout) {
    const roomID = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const seed = Math.floor(Math.random() * 1000000);
    const startTime = Date.now() + 3000;

    activeGames[roomID] = {
        players: {
            [peer.socket.id]: { name: peer.name, points: 0 },
            [snapper.socket.id]: { name: snapper.name, points: 0 }
        },
        finishedCount: 0,
        timer: null
    };

    peer.socket.join(roomID);
    snapper.socket.join(roomID);

    const matchData = { 
        room: roomID, 
        layout: gewähltesLayout, 
        seed, 
        startTime 
    };

    peer.socket.emit('match_found', { ...matchData, opponent: snapper.name });
    snapper.socket.emit('match_found', { ...matchData, opponent: peer.name });

    console.log(`Layout-Match fixiert: ${peer.name} vs ${snapper.name} auf Layout: ${gewähltesLayout}`);
}


function broadcastUserList() {
    // 1. Hole alle Usernamen von Sockets, die aktuell WIRKLICH verbunden sind
    // Das ist die sicherste Quelle direkt aus dem Socket.io-Core
    const activeSocketUsernames = Array.from(io.sockets.sockets.values())
        .map(s => s.username)
        .filter(name => name && typeof name === 'string');

    // 2. Alle User aus aktiven Spielen sammeln (Sicherheitsnetz für Seitenwechsel)
    const playersInGame = new Set();
    Object.values(activeGames).forEach(game => {
        if (game && game.players) {
            Object.values(game.players).forEach(p => {
                if (p && p.name && p.name !== 'Spieler') {
                    playersInGame.add(p.name);
                }
            });
        }
    });

    // 3. Vereinigung: Wer einen Socket hat ODER im Spiel ist, kommt in die Liste
    const allRelevantUsers = [...new Set([...activeSocketUsernames, ...Array.from(playersInGame)])]
        .filter(name => name.trim() !== "");

    if (allRelevantUsers.length === 0) {
        io.emit('update_user_list', []);
        return;
    }

    const sql = `
        SELECT username, 
               (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang
        FROM users u1
        WHERE username IN (?)
        ORDER BY mp_points DESC
    `;

    db.query(sql, [allRelevantUsers], (err, results) => {
        if (err) {
            console.error("Fehler in broadcastUserList Query:", err);
            return;
        }

        const enrichedResults = results.map(user => ({
            ...user,
            // Rot markieren, wenn der Name im playersInGame Set steht
            ingame: playersInGame.has(user.username)
        }));

        io.emit('update_user_list', enrichedResults);
    });
}

// --- NEU: Verifizierungs-Endpunkt 
app.get('/verify', (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.send('Ungültiger Verifizierungs-Link.');
    }

    // Prüft den Token und schaltet den User frei
    const sql = "UPDATE users SET is_verified = 1, token = NULL WHERE token = ?";
    db.query(sql, [token], (err, result) => {
        if (err) {
            console.error("Verifizierungsfehler:", err);
            return res.send('Ein Fehler ist aufgetreten.');
        }

        if (result.affectedRows === 0) {
            return res.send('Der Link ist ungültig oder wurde bereits genutzt.');
        }

        // Erfolg: Einfaches Feedback für den Browser
			res.send('<h1>Erfolg!</h1><p>Dein Konto wurde verifiziert. Du kannst dich jetzt einloggen. Erfolgt innerhalb der nächsten 7 Tage kein erster Login wird das Konto unwiderruflich gelöscht.</p><a href="/">Zurück zum Login</a>');
    });
});

    // Route für die Passwort-Reset-Seite (liefert das HTML-Formular aus)
	app.get('/reset-password', (req, res) => {
	    res.sendFile(path.join(__dirname, 'reset-password.html'));
	});

function broadcastLayoutStats() {
    const stats = {};
    meineLayouts.forEach(layoutId => {
        const roomName = `layout_${layoutId}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        stats[layoutId] = room ? room.size : 0;
    });
    io.emit('layout_stats_update', stats);
}

io.on('connection', (socket) => {
    broadcastLayoutStats();
    socket.on('re-identify', (username) => {
        if (username) {
            // Namen am Socket und im Set registrieren für den Türsteher-Schutz
            socket.username = username;
            loggedInUsers.add(username);
            
            // WICHTIG: Nur den Namen als String speichern, 
            // damit broadcastUserList ihn korrekt verarbeiten kann.
            onlineUsers[socket.id] = username;
            
            console.log(`Türsteher: Re-Identify für ${username} (Socket: ${socket.id})`);
            broadcastUserList();
        }
        
    });
    
    // Dieser Block muss EIGENSTÄNDIG hier stehen:
    socket.on('reset_password_final', (data) => {
        pwReset.handleResetFinal(socket, db, data);
    });

    
socket.on('reconnect_user', (data) => {
        const username = data.username;
        const sql = `
            SELECT username, mp_points,
                   (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang
            FROM users u1 
            WHERE username = ?
        `;
        db.query(sql, [username], (err, results) => {
            if (!err && results.length > 0) {
                // Namen im Set und am Socket registrieren
                loggedInUsers.add(username);
                socket.username = username;

                onlineUsers[socket.id] = { 
                    username: results[0].username, 
                    mp_points: results[0].mp_points,
                    rang: results[0].rang 
                };

                // Erfolgreichen Reconnect bestätigen
                socket.emit('login_response', { 
                    success: true, 
                    username: username, 
                    points: results[0].mp_points,
                    rang: results[0].rang 
                });
                
                broadcastUserList();
            }
        }); // <-- Hier fehlte vermutlich die schließende Klammer ) oder das Semikolon
    });
        
socket.on('login_attempt', (data) => {
        const { username, password } = data;
        const clientIp = socket.handshake.address;
        const now = Date.now();

        // 1. IP-Eintrag in der Map erstellen oder abrufen
        if (!loginAttempts.has(clientIp)) {
            loginAttempts.set(clientIp, { count: 0, firstAttempt: now });
        }

        const stats = loginAttempts.get(clientIp);

        // 2. Zeitfenster-Reset: Wenn 15 Min rum sind, Zähler auf 0
        if (now - stats.firstAttempt > WINDOW_TIME) {
            stats.count = 0;
            stats.firstAttempt = now;
        }

        // 3. Sperre prüfen
        if (stats.count >= MAX_ATTEMPTS) {
            console.log(`Rate-Limit: IP ${clientIp} blockiert (Versuche: ${stats.count})`);
            return socket.emit('login_response', { 
                success: false, 
                message: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' 
            });
        }

        // 4. Versuch registrieren
        stats.count++;
        
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err || results.length === 0) {
                socket.emit('login_response', { success: false, message: 'Benutzer nicht gefunden.' });
                return;
            }
        
            const user = results[0];
        
            if (user.is_verified !== 1) {
                socket.emit('login_response', { 
                    success: false, 
                    message: 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach.' 
                });
                return;
            }
        
            const match = await bcrypt.compare(password, user.password);
        
           if (match) {
                // --- NEU: Zeitstempel aktualisieren & Warn-Status zurücksetzen ---
                const updateSql = "UPDATE users SET last_login = NOW(), deletion_warning_sent = NULL WHERE id = ?";
                db.query(updateSql, [user.id], (updErr) => {
                    if (updErr) console.error("Fehler beim Update des Login-Zeitstempels:", updErr);
                });
                // --- ENDE NEU ---

                // KORREKTUR: Original-Schreibweise aus DB nutzen
                const dbUsername = user.username;

                // 1. TÜRSTEHER-CHECK:
                if (loggedInUsers.has(dbUsername)) {
                    const isReallyOnline = Object.values(onlineUsers).some(u => 
                        (typeof u === 'object' ? u.username : u) === dbUsername
                    );
                    
                    if (isReallyOnline) {
                        console.log(`Türsteher: Blockiere Doppelanmeldung für ${dbUsername}`);
                        socket.emit('login_response', { 
                            success: false, 
                            message: 'Dieser Benutzer ist bereits an einem anderen Ort eingeloggt.' 
                        });
                        return; 
                    } else {
                        loggedInUsers.delete(dbUsername);
                    }
                }

                // 2. JETZT EINTRAGEN (mit dbUsername)
                socket.username = dbUsername; 
                loggedInUsers.add(dbUsername);
                
                onlineUsers[socket.id] = { 
                    username: dbUsername, 
                    mp_points: user.mp_points 
                };

                console.log(`Türsteher: ${dbUsername} (Socket: ${socket.id}) zur Gästeliste hinzugefügt.`);

                socket.emit('login_response', { 
                    success: true, 
                    username: dbUsername, 
                    points: user.mp_points 
                });
                
                broadcastUserList();
            } else {
                socket.emit('login_response', { success: false, message: 'Falsches Passwort.' });
            }
        });
    });

socket.on('register_attempt', async (data) => {
    const { username, password, email, captchaToken } = data;
   
    try {
        // 1. Direkt hier den Bot-Check durchführen
        const isHuman = await captcha.verifyCaptcha(captchaToken);
        if (!isHuman) {
            return socket.emit('register_response', { 
                success: false, 
                message: 'Bot-Schutz: Verifizierung fehlgeschlagen.' 
            });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const token = crypto.randomBytes(32).toString('hex'); // NEU: Token generieren

		  // 2. VORAB-PRÜFUNG: Existiert der Name oder die Mail schon (Case-Insensitive)?
        db.query(
            'SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR email = ?',
            [username, email],
            (err, results) => {
                if (err) {
                    console.error("DB Fehler bei Registrierungs-Check:", err);
                    return socket.emit('register_response', { success: false, message: 'Datenbankfehler.' });
                }
                
                if (results.length > 0) {
                    return socket.emit('register_response', { 
                        success: false, 
                        message: 'Benutzername oder E-Mail bereits vergeben.' 
                    });
                }

                // 3. ERST JETZT: Tatsächliches Einfügen (Dein alter Code, nun hier drin)
                db.query(
                    'INSERT INTO users (username, password, email, mp_points, is_verified, token) VALUES (?, ?, ?, 0, 0, ?)',
                    [username, hashedPassword, email, token],
                    (err) => {
                        if (err) {
                            let userMessage = 'Registrierung fehlgeschlagen.';
                            if (err.code === 'ER_DUP_ENTRY') {
                                if (err.message.includes('email')) {
                                    userMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
                                } else if (err.message.includes('username')) {
                                    userMessage = 'Dieser Benutzername ist bereits vergeben.';
                                }
                            }
                            socket.emit('register_response', { success: false, message: userMessage });
                        } else {
                            const mailOptions = {
                                from: `"Mahjong-Treff" <${process.env.MAIL_USER}>`,
                                to: email,
                                subject: 'Bestätige deine Registrierung',
                                text: `Hallo ${username}, bitte bestätige dein Konto unter: ${process.env.APP_URL}/verify?token=${token}`,
                                html: `<p>Hallo ${username},</p><p>bitte bestätige dein Konto durch Klick auf den folgenden Link:</p><a href="${process.env.APP_URL}/verify?token=${token}">Konto verifizieren</a>`
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) console.error("Mail-Fehler:", error);
                            });

                            socket.emit('register_response', { success: true });
                        }
                    }
                );
            }
        );
    } catch (e) { 
        console.error("Serverfehler Registrierung:", e);
        socket.emit('register_response', { success: false, message: 'Serverfehler.' }); 
    }
});

socket.on('forgot_password_attempt', (email) => {
    // Hier rufen wir die Funktion aus der neuen Datei auf
    // Wir übergeben socket, db und transporter, damit die Datei damit arbeiten kann
    pwReset.handleForgotPassword(socket, db, email, transporter);
});

    
    socket.on('join_queue', () => {
        const userObj = onlineUsers[socket.id];
        const username = typeof userObj === 'object' ? userObj.username : userObj;
        if (!username) return;

        // Wir nutzen die exakt gleiche Subquery-Logik wie in der Rangliste
        const rankSql = `
            SELECT (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS aktuellerRang, 
                   mp_points 
            FROM users u1 
            WHERE username = ?
        `;

        db.query(rankSql, [username], (err, results) => {
            let meinRang = 999;
            let punkte = 0;
            if (!err && results.length > 0) {
                meinRang = results[0].aktuellerRang;
                punkte = results[0].mp_points;
            }
            
            waitingQueue = waitingQueue.filter(p => p.socket.id !== socket.id);
            waitingQueue.push({ 
                socket, 
                name: username, 
                rank: meinRang,
                points: punkte,
                startTime: Date.now() 
            });
            
            console.log(`Queue-Check: ${username} eingereiht mit Rang ${meinRang} (${punkte} Punkte)`);
        });
    });


    socket.on('join_layout_queue', (data) => {
        const userObj = onlineUsers[socket.id];
        const username = (userObj && typeof userObj === 'object') ? userObj.username : userObj;
        if (!username) return;

        const rankSql = `
            SELECT (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS aktuellerRang, 
                   mp_points 
            FROM users u1 
            WHERE username = ?
        `;

        db.query(rankSql, [username], (err, results) => {
            let meinRang = 999;
            let punkte = 0;
            if (!err && results.length > 0) {
                meinRang = results[0].aktuellerRang;
                punkte = results[0].mp_points;
            }

            layoutQueue = layoutQueue.filter(p => p.socket.id !== socket.id);
            layoutQueue.push({ 
                socket, 
                name: username, 
                rank: meinRang, 
                points: punkte,
                layoutId: data.layoutId, 
                startTime: Date.now() 
            });

            console.log(`Layout-Queue: ${username} sucht Layout '${data.layoutId}' mit Rang ${meinRang}`);
        });
    });

    socket.on('cancel_layout_queue', () => {
        layoutQueue = layoutQueue.filter(p => p.socket.id !== socket.id);
    });


    
	   socket.on('get_leaderboard', () => {
        const sql = `
            SELECT username, mp_points,
                   (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang
            FROM users u1 
            ORDER BY mp_points DESC
        `;
        db.query(sql, (err, results) => {
            if (err) return;
            socket.emit('leaderboard_data', results);
        });
    });

    socket.on('cancel_queue', () => {
        waitingQueue = waitingQueue.filter(p => p.socket.id !== socket.id);
    });

    socket.on('joinRoom', (data) => { 
        socket.join(data.room); 
        if (!activeGames[data.room]) {
            activeGames[data.room] = { players: {}, finishedCount: 0, timer: null };
        }
        activeGames[data.room].players[socket.id] = { 
            name: data.name, 
            points: 0, 
            finished: false 
        };
    });

    socket.on('playerMove', (data) => {
        if (activeGames[data.room] && activeGames[data.room].players[socket.id]) {
            activeGames[data.room].players[socket.id].points = data.punkte;
        }
        socket.to(data.room).emit('opponentMove', data);
    });

    socket.on('gameFinished', (data) => {
        const room = activeGames[data.room];
        if (!room || !room.players[socket.id] || room.players[socket.id].finished) return;

        const player = room.players[socket.id];
        player.finished = true;
        player.points = data.finalPoints;
        room.finishedCount++;

        if (room.finishedCount === 1) {
            io.to(data.room).emit('gracePeriodStarted');
            room.timer = setTimeout(() => {
                beendeRaumEndgültig(data.room);
            }, 30000);
        } else if (room.finishedCount >= 2) {
            if (room.timer) clearTimeout(room.timer);
            beendeRaumEndgültig(data.room);
        }
    });

    function beendeRaumEndgültig(roomID) {
        const room = activeGames[roomID];
        if (!room) return;

        const scores = Object.values(room.players).map(p => ({
            name: p.name,
            points: p.points
        }));

        scores.forEach(score => {
            const sql = "UPDATE users SET mp_points = mp_points + ? WHERE username = ?";
            db.query(sql, [score.points, score.name], (err) => {
                if (err) console.error(`Fehler für ${score.name}:`, err);
            });
        });

        io.to(roomID).emit('finalScoreboard', { scores });
        delete activeGames[roomID];
        broadcastUserList();    
    }

    socket.on('join_layout_room', (layoutId) => {
        socket.join(`layout_${layoutId}`);
        broadcastLayoutUserList(layoutId);
        broadcastLayoutStats();
    });

    socket.on('leave_layout_room', (layoutId) => {
        socket.leave(`layout_${layoutId}`);
        broadcastLayoutUserList(layoutId);
        broadcastLayoutStats();
    });
 
    function broadcastLayoutUserList(layoutId) {
        const roomName = `layout_${layoutId}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        
        if (!room || room.size === 0) {
            io.to(roomName).emit('update_layout_userlist', []);
            return;
        }

        const socketIds = Array.from(room);
        const usernames = socketIds
            .map(id => {
                const user = onlineUsers[id];
                return (user && typeof user === 'object') ? user.username : user;
            })
            .filter(name => name !== undefined);

        if (usernames.length === 0) {
            io.to(roomName).emit('update_layout_userlist', []);
            return;
        }

        const sql = `
            SELECT username, 
                   (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang
            FROM users u1
            WHERE username IN (?)
            ORDER BY mp_points DESC
        `;

        db.query(sql, [usernames], (err, results) => {
            if (err) {
                console.error("Fehler beim Abrufen der Layout-Ränge:", err);
                return;
            }
            io.to(roomName).emit('update_layout_userlist', results);
        });
    }
    
    socket.on('send_chat_message', (msg) => {
        const userObj = onlineUsers[socket.id];
        const username = (userObj && typeof userObj === 'object') ? userObj.username : userObj;
    
        if (username && msg && msg.trim() !== "") {
            const chatData = {
                user: username,
                text: sanitize(msg).substring(0, 200),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
    
            const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
            const gameRoom = rooms.find(r => r.startsWith('room_'));
    
            if (gameRoom) {
                io.to(gameRoom).emit('receive_chat_message', chatData);
            } else {
                chatHistory.push(chatData);
                if (chatHistory.length > MAX_CHAT_MSGS) chatHistory.shift();
					// Sendet die Nachricht nur an Sockets, die NICHT in einem Spiel-Raum sind
					io.sockets.sockets.forEach((s) => {
					    if (s.rooms.size <= 1) { // Ein Socket ist immer in seinem eigenen ID-Raum. Size 1 = nur Lobby.
					        s.emit('receive_chat_message', chatData);
					    }
					});
            }
        }
    });

    socket.emit('chat_history', chatHistory);

socket.on('logout', () => {
        if (socket.username) {
            const nameToRemove = socket.username;
            console.log(`Türsteher: ${nameToRemove} hat sich aktiv abgemeldet.`);
            
            loggedInUsers.delete(nameToRemove);
            delete onlineUsers[socket.id];
            
            // Wichtig: Wir nullen den Namen am Socket, damit broadcastUserList 
            // diesen Socket nicht mehr zählt
            socket.username = null; 
            
            broadcastUserList();
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            const savedUsername = socket.username;
            const savedSocketId = socket.id;

            // 2 Sekunden Puffer für Seitenwechsel (Lobby -> Spiel)
            setTimeout(() => {
                // Prüfen, ob der User mit einem NEUEN Socket zurückgekehrt ist
                const stillHasActiveSocket = Array.from(io.sockets.sockets.values())
                    .some(s => s.username === savedUsername);
                
                if (!stillHasActiveSocket) {
                    // Nur wenn wirklich kein Socket mehr da ist, aus dem Login-Set löschen
                    loggedInUsers.delete(savedUsername);
                    console.log(`Türsteher: ${savedUsername} nach Timeout endgültig entfernt.`);
                    
                    if (onlineUsers[savedSocketId]) {
                        delete onlineUsers[savedSocketId];
                    }
                    broadcastUserList();
                }
            }, 2000); 
        }

        waitingQueue = waitingQueue.filter(p => p.socket.id !== socket.id);
        layoutQueue = layoutQueue.filter(p => p.socket.id !== socket.id);
        broadcastLayoutStats();
    });

		socket.on('disconnect', () => {
		    if (socket.username) {
		        const savedUsername = socket.username;
		        const savedSocketId = socket.id;
		
		        // Puffer, um kurzes Flackern beim Seitenwechsel zu verhindern
		        setTimeout(() => {
		            // Prüfen, ob der User inzwischen mit einer NEUEN Socket-ID wieder da ist
		            const isStillOnline = Object.values(onlineUsers).some(u => u && u.username === savedUsername);
		            
		            if (!isStillOnline) {
		                // Wenn er nicht mehr online ist, aufräumen
		                loggedInUsers.delete(savedUsername);
		                console.log(`Türsteher: ${savedUsername} nach Timeout endgültig entfernt.`);
		                
		                // Sicherstellen, dass wir nicht den Socket eines neuen Logins löschen
		                if (onlineUsers[savedSocketId]) {
		                    delete onlineUsers[savedSocketId];
		                }
		                broadcastUserList();
		            }
		        }, 2000); 
		    }
		
		    // Warteschlangen werden immer sofort bereinigt
		    waitingQueue = waitingQueue.filter(p => p.socket.id !== socket.id);
		    layoutQueue = layoutQueue.filter(p => p.socket.id !== socket.id);
		    broadcastLayoutStats();
		});
    
});

server.listen(process.env.PORT, () => console.log(`Server läuft auf Port ${process.env.PORT}`));


