# 📚 Mahjong-Live Multiplayer - Vollständige Dokumentation

**Version:** 1.0  
**Sprache:** Deutsch (mit English-Auto-Translation)  
**Live-Demo:** [mahjong-treff.de](https://mahjong-treff.de)  
**Lizenz:** GNU General Public License v3.0

---

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Architektur & Technologie-Stack](#architektur--technologie-stack)
3. [Verzeichnisstruktur](#verzeichnisstruktur)
4. [Installation & Konfiguration](#installation--konfiguration)
5. [Datenbankstruktur](#datenbankstruktur)
6. [Server-Module & Funktionen](#server-module--funktionen)
7. [Socket.io Event-Handling](#socketio-event-handling)
8. [Sicherheitsfeatures](#sicherheitsfeatures)
9. [Frontend-Architektur](#frontend-architektur)
10. [Spielmodi & Matchmaking](#spielmodi--matchmaking)
11. [API-Dokumentation](#api-dokumentation)
12. [Deployment & Betrieb](#deployment--betrieb)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Projektübersicht

**Mahjong-Live Multiplayer** ist ein browserbasiertes **Solitär-Mahjong-Spiel** mit vollständiger **Multiplayer-Funktionalität**. Das Projekt kombiniert:

- ✅ **Einzelspieler-Modus** (Single-Player)
- ✅ **Mehrspielermodus** (Multiplayer mit Live-Matchmaking)
- ✅ **Echtzeit-Chat** zwischen Spielern
- ✅ **Ranking-System** (Punkte-basiert)
- ✅ **Benutzerregistrierung & -authentifizierung**
- ✅ **Verschiedene Spiel-Layouts** (17 verschiedene Level-Designs)
- ✅ **Sicherheit durch Helmet, CSRF-Schutz und Rate-Limiting**

### Besonderheiten

Das Projekt wurde unter Anwendung des **Vibecoding-Ansatzes** entwickelt – einer modernen Methodik, die es Nicht-Profis ermöglicht, komplexe Systeme mit AI-Unterstützung zu bauen.

---

## 🏗️ Architektur & Technologie-Stack

### Backend

| Komponente | Technologie | Version | Zweck |
|------------|------------|---------|-------|
| **Runtime** | Node.js | LTS | JavaScript-Ausführung auf dem Server |
| **Webserver** | Express.js | 5.2.1 | HTTP-Request-Handling & Routing |
| **WebSocket** | Socket.io | 4.8.3 | Echtzeit-Kommunikation zwischen Client & Server |
| **Datenbank** | MySQL/MariaDB | 8.0+ | Benutzerdaten, Punkte, Rankings |
| **Authentifizierung** | bcrypt | 6.0.0 | Password-Hashing & Verifikation |
| **Sicherheit** | Helmet | 8.1.0 | Security-Header Management |
| **Mail-Versand** | Nodemailer | 8.0.3 | E-Mail-Verifikation & Password-Reset |
| **Rate-Limiting** | express-rate-limit | 8.3.2 | DDoS- & Brute-Force-Schutz |
| **Umgebungsvariablen** | dotenv | 17.3.1 | Konfiguration & Secrets |
| **HTTP-Client** | axios | 1.16.0 | API-Anfragen (z.B. reCAPTCHA) |

### Frontend

| Komponente | Technologie | Zweck |
|------------|------------|-------|
| **3D-Grafik** | Three.js | 3D-Rendering der Mahjong-Steine |
| **Real-time Updates** | Socket.io Client | Live-Datenaktualisierung |
| **Layout & Styling** | HTML/CSS | UI-Struktur & Responsive Design |
| **Interaktion** | Vanilla JavaScript | Event-Handling & Game-Logic |

### Infrastruktur-Requirements

```
- Node.js (LTS empfohlen)
- MariaDB oder MySQL Server
- SMTP-Server (für E-Mails)
- reCAPTCHA v3 API (für Bot-Schutz)
- SSL/TLS-Zertifikat (für HTTPS)
```

---

## 📂 Verzeichnisstruktur

```
mahjong-live_multiplayer/
│
├── 📄 server.js                    # Hauptserver-Datei (Express + Socket.io)
├── 📄 package.json                 # NPM-Abhängigkeiten
├── 📄 package-lock.json            # Abhängigkeits-Lock-Datei
│
├── 🔐 Authentifizierung
│   ├── auth.js                     # Session-Middleware für geschützte Routes
│   ├── captcha.js                  # reCAPTCHA v3 Verifizierung
│   └── pw_reset.js                 # Passwort-Reset-Logik
│
├── 📧 E-Mail & Reset
│   ├── pw_reset.js                 # Passwort-Reset-Handling
│   └── reset-password.html         # Reset-Passwort-Formular
│
├── 💬 Chat-Modul
│   └── chat-module.js              # Chat-Funktionalität für eingeloggte User
│
├── 🎮 Game-Modi
│   ├── single/                     # Einzelspieler-Modus (Assets & JS)
│   ├── multi/                      # Multiplayer-Modus (Assets & JS)
│   └── auswahl/                    # Layout-Auswahl-Screen
│
├── 🌐 Public Resources (Shared)
│   └── shared/                     # Bilder, Sounds, 3D-Modelle (öffentlich)
│
├── 📄 Frontend-Seiten
│   ├── index.html                  # Startseite & Login/Registrierung
│   ├── lobby.html                  # Haupt-Lobby (nach Login)
│   ├── anleitung.html              # Spielanleitung
│   ├── style.css                   # Globale CSS-Styles
│   └── reset-password.html         # Passwort-Reset-Seite
│
├── ⚙️ Konfiguration
│   ├── .env                        # Umgebungsvariablen (NICHT in Git!)
│   ├── .env.example                # Vorlage für .env
│   └── maria.sql                   # Datenbank-Schema
│
├── 📋 Dokumentation
│   ├── README.md                   # Projekt-Übersicht
│   ├── INSTALL.txt                 # Installations-Anleitung
│   ├── CREDITS.txt                 # Lizenzen & Attribution
│   ├── DOKUMENTATION.md            # Diese Datei
│   └── LICENSE.txt                 # GPL v3 Lizenz
│
├── 🔧 Systemverwaltung
│   ├── cleanup.js                  # Bereinigung alter Konten (täglicher Cron)
│   └── .gitignore                  # Git-Ignore-Regeln
│
└── .github/                        # GitHub-Actions & Workflows (leer/optional)
```

---

## 🚀 Installation & Konfiguration

### Schritt 1: Voraussetzungen prüfen

```bash
# Node.js Version prüfen (mindestens 14.x)
node --version

# npm Version prüfen
npm --version

# MySQL/MariaDB Version prüfen
mysql --version
```

### Schritt 2: Repository klonen & Dependencies installieren

```bash
# Repository klonen
git clone https://github.com/Christel-Mett/mahjong-live_multiplayer.git
cd mahjong-live_multiplayer

# Dependencies installieren
npm install
```

### Schritt 3: Datenbank einrichten

```bash
# Mit MariaDB/MySQL verbinden
mysql -u root -p

# Datei importieren (in der MySQL-Konsole)
CREATE DATABASE mahjong_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mahjong_db;
SOURCE maria.sql;

# Benutzer für die App erstellen (optional aber empfohlen)
CREATE USER 'mahjong_user'@'localhost' IDENTIFIED BY 'dein_sicheres_passwort';
GRANT ALL PRIVILEGES ON mahjong_db.* TO 'mahjong_user'@'localhost';
FLUSH PRIVILEGES;
```

### Schritt 4: Umgebungsvariablen konfigurieren

```bash
# .env-Datei erstellen
cp .env.example .env

# .env öffnen und ausfüllen
nano .env
```

**Erforderliche Umgebungsvariablen:**

```env
# === Server Configuration ===
PORT=3000
APP_URL=https://deine-domain.de

# === Database ===
DB_HOST=localhost
DB_USER=mahjong_user
DB_PASSWORD=dein_sicheres_passwort
DB_NAME=mahjong_db

# === Mail Server (SMTP) ===
MAIL_HOST=smtp.gmail.com           # Beispiel: Gmail
MAIL_PORT=465
MAIL_USER=deine-email@gmail.com
MAIL_PASS=dein_app_spezifisches_passwort  # Nicht dein normales Passwort!

# === Session Security ===
SESSION_SECRET=generiere_einen_zufaelligen_string_hier

# === reCAPTCHA (Bot-Schutz) ===
RECAPTCHA_SECRET_KEY=dein_recaptcha_secret_key
```

### Schritt 5: Server starten

```bash
# Einmaliges Starten (für Tests)
node server.js

# Mit PM2 starten (für dauerhaften Betrieb)
npm install -g pm2
pm2 start server.js --name "mahjong-live"
pm2 save
```

### Schritt 6: Server im Browser testen

```
http://localhost:3000
```

---

## 🗄️ Datenbankstruktur

### Tabelle: `users`

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- bcrypt-gehashed
    email VARCHAR(100) UNIQUE NOT NULL,
    mp_points INT DEFAULT 0,                 -- Multiplayer-Punkte (Ranking)
    is_verified TINYINT DEFAULT 0,           -- E-Mail bestätigt? (0=nein, 1=ja)
    token VARCHAR(64) NULLABLE,              -- E-Mail-Verifikations-Token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULLABLE,
    deletion_warning_sent TIMESTAMP NULLABLE, -- Wann wurde Lösch-Warnung gesendet?
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_mp_points (mp_points)          -- Für Ranking-Abfragen
);
```

### Wichtige Datenbankabfragen

**Top 10 Spieler abrufen:**
```sql
SELECT username, mp_points,
       (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang
FROM users u1
ORDER BY mp_points DESC
LIMIT 10;
```

**Rang eines Spielers berechnen:**
```sql
SELECT (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.mp_points > u1.mp_points) AS rang,
       mp_points
FROM users u1
WHERE username = 'spielername';
```

---

## 🎮 Server-Module & Funktionen

### 1. **server.js** - Hauptserver-Datei (40KB)

Die zentrale Datei mit folgenden Komponenten:

#### Express-App-Setup
```javascript
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: {...} });
```

#### Sicherheits-Header (Helmet)
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- Referrer-Policy
- Permissions-Policy (verhindert Camera, Microphone, Geolocation)

#### Middleware-Schichten

| Layer | Funktion | Schutz |
|-------|----------|--------|
| 1. Helmet | Security-Header | XSS, Clickjacking, etc. |
| 2. Session | Benutzer-Authentifizierung | Nicht-autorisierter Zugriff |
| 3. Rate-Limiting | Brute-Force-Schutz | Login-Spam |
| 4. File-Protection | Verhindert direkte .js-Aufrufe | JavaScript-Injection |

#### Routing-Übersicht

| Route | Methode | Auth | Zweck |
|-------|---------|------|-------|
| `/` | GET | Nein | Startseite |
| `/index.html` | GET | Nein | Login/Registrierung |
| `/lobby.html` | GET | Ja | Hauptlobby |
| `/single/*` | GET | Ja | Einzelspieler-Dateien |
| `/multi/*` | GET | Ja | Multiplayer-Dateien |
| `/chat-module.js` | GET | Ja | Chat-Modul laden |
| `/verify` | GET | Nein | E-Mail-Verifikation |
| `/reset-password` | GET | Nein | Passwort-Reset-Seite |
| `/logout` | GET | Ja | Abmelden |

### 2. **auth.js** - Session-Middleware

```javascript
// Prüft, ob Benutzer authentifiziert ist
function checkAuth(req, res, next) {
    if (req.session && req.session.username) {
        return next();
    }
    res.status(401).redirect('/');
}
```

### 3. **captcha.js** - reCAPTCHA v3 Integration

```javascript
async function verifyCaptcha(token) {
    // Sendet Token an Google reCAPTCHA API
    // Gibt true/false zurück
}
```

### 4. **pw_reset.js** - Passwort-Reset-Handling

Verwaltet den kompletten Passwort-Reset-Flow:
1. User fordert Reset an
2. Server sendet E-Mail mit Token
3. User klickt auf Link & setzt neues Passwort
4. Token wird validiert und Passwort aktualisiert

### 5. **chat-module.js** - Chat-Funktionalität

Nur für authentifizierte Benutzer. Bietet:
- Private Chat-Nachrichten
- Lobby-Chat
- In-Game-Chat während Matches
- Nachrichten-Sanitization (XSS-Schutz)

### 6. **cleanup.js** - Speicher-Management

Täglich ausgelöst (via Cron) für:
- Löschen nicht-verifizierter Accounts (nach 7 Tagen Inaktivität)
- Bereinigung von "Zombie"-Spielen
- Speicher-Optimierung

---

## 🔌 Socket.io Event-Handling

Socket.io ermöglicht **Echtzeit-Kommunikation** zwischen Client & Server. Alle Events laufen über WebSocket-Verbindungen.

### Authentifizierung & Session

#### `re-identify`
**Zweck:** Benutzername beim Socket registrieren  
**Payload:**
```javascript
socket.emit('re-identify', 'spielername');
```

#### `login_attempt`
**Zweck:** Benutzer-Login mit Benutzername & Passwort  
**Payload:**
```javascript
socket.emit('login_attempt', {
    username: 'spieler123',
    password: 'passwort'
});
```

**Response:**
```javascript
socket.on('login_response', (data) => {
    if (data.success) {
        console.log(`Hallo ${data.username}, Punkte: ${data.points}`);
    }
});
```

#### `register_attempt`
**Zweck:** Neue Benutzer registrieren  
**Payload:**
```javascript
socket.emit('register_attempt', {
    username: 'newuser',
    password: 'sicher123',
    email: 'user@example.com',
    captchaToken: 'recaptcha_token'
});
```

### Matchmaking & Queue-System

Das System hat **zwei verschiedene Matching-Modi**:

#### 1. **Ranked Queue** (Rang-basiert)

```javascript
// Queue beitreten
socket.emit('join_queue');

// Serverzeitraum: 1000ms
// Phase 1 (0-30s): Spieler mit ähnlichem Rang suchen (±20)
// Phase 2 (30-60s): Rang egal
// Phase 3 (60s+): Beliebige Matches

// Event wenn Match gefunden:
socket.on('match_found', (data) => {
    console.log(`Match mit ${data.opponent} in Raum ${data.room}`);
    console.log(`Layout: ${data.layout}, Seed: ${data.seed}`);
    console.log(`Start in ${data.startTime - Date.now()}ms`);
});
```

#### 2. **Layout-spezifische Queue** (Layout-Wahl)

```javascript
// Layout-spezifische Queue beitreten
socket.emit('join_layout_queue', {
    layoutId: 'arrow'  // 17 verfügbare Layouts
});

// Phases:
// Phase 1 (0-30s): Gleicher Layout + ähnlicher Rang
// Phase 2 (30-60s): Gleicher Layout (Rang egal)
// Phase 3 (60s+): Beliebiger Opponent aus ranked Queue

socket.on('match_found', (data) => { /* ... */ });

// Queue verlassen
socket.emit('cancel_layout_queue');
```

### Spiel-Events während des Matches

#### `joinRoom`
```javascript
socket.emit('joinRoom', {
    room: 'room_1234567890_123',
    name: 'spielername'
});
```

#### `playerMove`
```javascript
socket.emit('playerMove', {
    room: 'room_123',
    punkte: 150,
    // weitere Game-State-Daten
});

// Gegenspieler empfängt:
socket.on('opponentMove', (data) => {
    updateOpponentScore(data.punkte);
});
```

#### `gameFinished`
```javascript
socket.emit('gameFinished', {
    room: 'room_123',
    finalPoints: 250
});

// 30-Sekunden Grace Period für langsame Verbindungen
// Dann automatisches Ende & Punkt-Verteilung
socket.on('finalScoreboard', (data) => {
    data.scores.forEach(score => {
        console.log(`${score.name}: +${score.points} Punkte`);
    });
});
```

### Benutzer-Listen & Status

#### `update_user_list`
```javascript
socket.on('update_user_list', (users) => {
    // users: Array mit {username, rang, mp_points, ingame}
    // ingame = true wenn Spieler gerade ein Spiel spielt (rot markieren)
});
```

#### `get_leaderboard`
```javascript
socket.emit('get_leaderboard');

socket.on('leaderboard_data', (leaderboard) => {
    // leaderboard: Sortierte Liste aller Spieler mit Rängen
});
```

#### `layout_stats_update`
```javascript
socket.on('layout_stats_update', (stats) => {
    // stats: {arrow: 3, balance: 1, bug: 0, ...}
    // Zeigt wie viele Spieler je Layout wartend sind
});
```

### Chat-Events

#### `send_chat_message`
```javascript
socket.emit('send_chat_message', 'Hallo zusammen!');
```

#### `receive_chat_message`
```javascript
socket.on('receive_chat_message', (msg) => {
    console.log(`${msg.user} (${msg.time}): ${msg.text}`);
});
```

### Verbindungs-Management

#### `disconnect`
```javascript
socket.on('disconnect', () => {
    // Server prüft nach 2s ob User mit neuem Socket zurück kommt
    // Wenn nein: aus Login-Set löschen
    // Zeigt Seitenwechsel-Flackern
});
```

---

## 🔒 Sicherheitsfeatures

Das Projekt implementiert mehrere Sicherheitsebenen:

### 1. **Authentifizierung & Autorisierung**

| Feature | Implementierung |
|---------|-----------------|
| Password Hashing | bcrypt mit 10 Saltrounds |
| Session Management | Express-Session mit secure Cookies |
| E-Mail Verification | Token-basiert vor Login möglich |
| Double-Submit Prevention | CSRF-Token Handling |
| Single-Login | User kann nur 1x gleichzeitig online sein (Türsteher-System) |

### 2. **Rate-Limiting**

```javascript
const MAX_ATTEMPTS = 100;
const WINDOW_TIME = 15 * 60 * 1000;  // 15 Minuten

// Pro IP-Adresse:
// - Max 100 Login-Versuche pro 15 Min
// - HTTP 429 Status wenn überschritten
```

### 3. **Input-Sanitization**

```javascript
function sanitize(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;'
    };
    return text.replace(/[&<>"'\/]/g, (m) => map[m]);
}
```

Verhindert XSS-Angriffe durch HTML-Escaping.

### 4. **Bot-Schutz**

- **reCAPTCHA v3** bei Registrierung
- Score-basiert: 0.0 = Bot, 1.0 = Mensch
- Automatisch bei verdächtigem Verhalten

### 5. **Security-Header (Helmet)**

```javascript
// CSP: Woher darf Content kommen?
"script-src": ["'self'", "https://cdnjs.cloudflare.com"]

// HSTS: Immer HTTPS verwenden
hsts: { maxAge: 31536000, preload: true }

// Referrer-Policy: Nur Origin weitergeben
referrer-policy: "strict-origin-when-cross-origin"

// Permissions-Policy: Keine Camera, Microphone, Geolocation
permissions-policy: { camera: ["'none'"], ... }
```

### 6. **Datenbank-Sicherheit**

- **Prepared Statements:** Verhindert SQL-Injection
- **Passwort-Hashing:** Plaintext werden nie gespeichert
- **Least Privilege:** App-User hat nur nötige Permissions

### 7. **File-Access Protection**

```javascript
// .js Dateien können nur mit aktiver Session geladen werden
// Ausnahmen: socket.io, captcha.js (öffentlich)
// Geschützte Ordner: /single, /multi, /auswahl (nur mit Auth)
```

---

## 🎨 Frontend-Architektur

### **index.html** - Startseite & Login

```html
<!-- Registrierungs-Tab -->
<div id="register-tab">
    <input type="text" id="regUsername" placeholder="Benutzername">
    <input type="password" id="regPassword" placeholder="Passwort">
    <input type="email" id="regEmail" placeholder="E-Mail">
    <!-- reCAPTCHA Captcha eingebunden -->
    <button onclick="registerUser()">Registrieren</button>
</div>

<!-- Login-Tab -->
<div id="login-tab">
    <input type="text" id="loginUsername" placeholder="Benutzername">
    <input type="password" id="loginPassword" placeholder="Passwort">
    <button onclick="loginUser()">Anmelden</button>
</div>
```

**JavaScript-Logik (in index.html):**
```javascript
function registerUser() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const email = document.getElementById('regEmail').value;
    const captchaToken = grecaptcha.getResponse();
    
    socket.emit('register_attempt', {
        username, password, email, captchaToken
    });
}

socket.on('register_response', (data) => {
    if (data.success) {
        alert('Registrierung erfolgreich! Bitte bestätige deine E-Mail.');
        // E-Mail mit Verifikations-Link wird gesendet
    }
});
```

### **lobby.html** - Hauptlobby nach Login

```html
<!-- Benutzerliste -->
<div id="userListContainer">
    <!-- Dynamisch gefüllt via Socket -->
</div>

<!-- Queue-Button -->
<button id="queueBtn">Zur Suche</button>

<!-- Layout-Auswahl -->
<div id="layoutSelector">
    <button onclick="selectLayout('arrow')">Arrow Layout</button>
    <button onclick="selectLayout('balance')">Balance Layout</button>
    <!-- ... 17 Layouts insgesamt ... -->
</div>

<!-- Chat -->
<div id="chatBox">
    <div id="chatMessages"></div>
    <input type="text" id="chatInput" placeholder="Nachricht...">
    <button onclick="sendChat()">Senden</button>
</div>

<!-- Leaderboard -->
<div id="leaderboard"></div>
```

### **style.css** - Responsive Design

- Flexbox-Layout für Mobile
- Responsive Breakpoints (320px, 768px, 1024px)
- CSS Grid für Komponenten-Layout
- Animations & Transitions

### **single/index.html** - Einzelspielermodus

Enthält Three.js Canvas für 3D-Grafiken:
```html
<canvas id="gameCanvas"></canvas>
<script src="../../shared/three.min.js"></script>
<script src="single-game-logic.js"></script>
```

**Game-Logik:**
- 3D-Stein-Rendering mit Three.js
- Mahjong-Regeln Implementierung
- Timer & Scoring-System

### **multi/index.html** - Multiplayer-Modus

Analog zu Single-Player, plus:
```javascript
// Opponent's Bewegungen empfangen
socket.on('opponentMove', (data) => {
    updateOpponentStones(data.stoneIndices);
    updateOpponentScore(data.punkte);
});

// Eigene Moves zu Opponent senden
socket.emit('playerMove', {
    room: roomID,
    stoneIndices: [5, 12, 17],  // Welche Steine wurden entfernt
    punkte: 150
});
```

---

## 🎯 Spielmodi & Matchmaking

### **Modus 1: Einzelspieler (Single)**

```
Startseite → Einzelspieler → Layout auswählen → Spiel
     ↓
  Timer läuft
     ↓
  Alle Steine entfernt? → Erfolg / Neuer Versuch
```

**Keine Netzwerk-Kommunikation, nur lokale Game-Logic**

### **Modus 2: Multiplayer (Multi)**

#### Option A: Ranked Queue
```
Lobby → "Zum Spielen" Button
        ↓
    Queue (maximal 5 Min warten)
        ↓
    Rank-Matchmaking:
    - Phase 1 (0-30s): Rang ±20 Match
    - Phase 2 (30-60s): Rang egal
    - Phase 3 (60s+): Erste verfügbar
        ↓
    Match_found Event
        ↓
    Random Layout + Seed
        ↓
    3s Countdown
        ↓
    Spiel startet
```

#### Option B: Layout-Spezifisches Matching
```
Lobby → Layout auswählen (17 Optionen)
        ↓
    Layout-Queue
        ↓
    Matching:
    - Phase 1 (0-30s): Gleich Layout + Rang ±20
    - Phase 2 (30-60s): Gleich Layout (Rang egal)
    - Phase 3 (60s+): Beliebiger Opponent
        ↓
    Match_found Event (mit gewähltem Layout)
        ↓
    Spiel startet
```

### **Match-Flow**

```javascript
// Server berechnet alle 1 Sekunde
setInterval(() => {
    for (let i = 0; i < queue.length; i++) {
        for (let j = i + 1; j < queue.length; j++) {
            if (rankDiff <= 20 || waitedLonger(30s)) {
                // Match gefunden!
                starteMatch(player1, player2);
                // Beide Spieler erhalten 'match_found' Event
                // Room-ID, Layout, Seed, Start-Zeit
            }
        }
    }
}, 1000);
```

### **Punkt-Verteilung**

Nach Spiel-Ende:
```javascript
// Finale Scoreboard anzeigen (30s Grace-Period)
// Beide Spieler erhalten 'finalScoreboard' Event
// Punkte direkt in DB geschrieben:
// UPDATE users SET mp_points = mp_points + ? WHERE username = ?

// Beispiel:
// Spieler A: 250 Punkte → +250 Punkte
// Spieler B: 180 Punkte → +180 Punkte
// (Keine Abzüge, Kooperativ)
```

---

## 📡 API-Dokumentation

### HTTP-Routes

#### **GET /verify?token={TOKEN}**
E-Mail-Verifikation nach Registrierung  
**Parameter:** `token` (64-Zeichen String)  
**Response:** HTML-Seite mit Erfolgs-/Fehler-Nachricht  
**Rate-Limit:** 100 pro 15 Min pro IP

#### **GET /reset-password**
Zeigt Passwort-Reset-Formular  
**Auth:** Nicht erforderlich  
**Response:** HTML-Seite

#### **POST /set-session**
Verbindet Socket-Session mit HTTP-Session  
**Payload:** `{ username }`  
**Response:** `{ success: true/false }`  
**Rate-Limit:** 100 pro 15 Min pro IP

#### **GET /logout**
Benutzer abmelden  
**Auth:** Erforderlich  
**Response:** Redirect zu `/`  
**Effekt:** Cookie gelöscht, Benutzer aus loggedInUsers entfernt

#### **Static Files**
- `/` → index.html
- `/style.css` → CSS-Datei
- `/shared/*` → Öffentliche Ressourcen (Bilder, Sounds)
- `/single/*` → Nur mit Auth
- `/multi/*` → Nur mit Auth
- `/auswahl/*` → Nur mit Auth

### Socket.io Events (vollständige Referenz)

#### **Server → Client**

| Event | Daten | Beschreibung |
|-------|-------|-------------|
| `login_response` | `{success, username, points, message}` | Login-Antwort |
| `register_response` | `{success, message}` | Registrierungs-Antwort |
| `match_found` | `{room, layout, seed, startTime, opponent}` | Match-Benachrichtigung |
| `update_user_list` | `Array<{username, rang, mp_points, ingame}>` | Aktuelle Benutzerliste |
| `update_layout_userlist` | `Array<{username, rang, mp_points}>` | Layout-spezifische Liste |
| `leaderboard_data` | `Array<{username, rang, mp_points}>` | Top-100 Spieler |
| `layout_stats_update` | `{arrow: 3, balance: 1, ...}` | Warteschlangen-Status |
| `opponentMove` | `{stoneIndices, punkte, ...}` | Gegenspieler-Action |
| `gracePeriodStarted` | — | 30s Grace-Period nach Spiel-Ende |
| `finalScoreboard` | `{scores: [{name, points}]}` | Endstand mit Punkten |
| `opponentLeft` | — | Gegenspieler hat Spiel verlassen |
| `receive_chat_message` | `{user, text, time}` | Chat-Nachricht erhalten |
| `chat_history` | `Array<{user, text, time}>` | Letzte 50 Chat-Nachrichten |

#### **Client → Server**

| Event | Daten | Beschreibung |
|-------|-------|-------------|
| `re-identify` | `"username"` | Socket mit Username registrieren |
| `login_attempt` | `{username, password}` | Login versuchen |
| `register_attempt` | `{username, password, email, captchaToken}` | Registrierung versuchen |
| `forgot_password_attempt` | `"email"` | Passwort-Reset anfragen |
| `join_queue` | — | Ranked-Queue beitreten |
| `join_layout_queue` | `{layoutId}` | Layout-spezifische Queue beitreten |
| `cancel_queue` | — | Queue verlassen |
| `cancel_layout_queue` | — | Layout-Queue verlassen |
| `get_leaderboard` | — | Leaderboard abfragen |
| `joinRoom` | `{room, name}` | Match-Room beitreten |
| `playerMove` | `{room, stoneIndices, punkte}` | Move im Spiel senden |
| `gameFinished` | `{room, finalPoints}` | Spiel beendet |
| `send_chat_message` | `"nachricht text"` | Chat-Nachricht senden |
| `join_layout_room` | `"layoutId"` | Layout-Raum zum Zuschauen betreten |
| `leave_layout_room` | `"layoutId"` | Layout-Raum verlassen |
| `logout` | — | Manuell abmelden |

---

## 🚀 Deployment & Betrieb

### **Production-Deployment (Beispiel mit nginx + PM2)**

#### 1. Server vorbereiten
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git mariadb-server nginx

# Node.js LTS installieren (über NodeSource)
curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 global installieren
sudo npm install -g pm2
```

#### 2. Repository klonen & einrichten
```bash
cd /var/www
git clone https://github.com/Christel-Mett/mahjong-live_multiplayer.git mahjong
cd mahjong
npm install --production

# .env mit Production-Secrets erstellen
cp .env.example .env
nano .env
```

#### 3. Datenbank einrichten
```bash
sudo mysql -u root

# In MySQL:
CREATE DATABASE mahjong_prod CHARACTER SET utf8mb4;
CREATE USER 'mahjong'@'localhost' IDENTIFIED BY 'SICHERES_PASSWORT';
GRANT ALL PRIVILEGES ON mahjong_prod.* TO 'mahjong'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Schema importieren
mysql -u mahjong -p mahjong_prod < maria.sql
```

#### 4. PM2 konfigurieren
```bash
# Ecosystem-Datei erstellen
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mahjong-live',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# PM2 starten
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup systemd -u www-data --hp /var/www
```

#### 5. nginx Reverse-Proxy konfigurieren
```bash
sudo nano /etc/nginx/sites-available/mahjong
```

**Inhalt:**
```nginx
upstream mahjong_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name mahjong-treff.de www.mahjong-treff.de;
    
    # Redirect zu HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mahjong-treff.de www.mahjong-treff.de;
    
    # SSL-Zertifikat (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/mahjong-treff.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mahjong-treff.de/privkey.pem;
    
    # SSL-Konfiguration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Logging
    access_log /var/log/nginx/mahjong_access.log;
    error_log /var/log/nginx/mahjong_error.log;
    
    # Proxy-Einstellungen
    location / {
        proxy_pass http://mahjong_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket Support
    location /socket.io {
        proxy_pass http://mahjong_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. nginx aktivieren & Zertifikat erstellen
```bash
sudo ln -s /etc/nginx/sites-available/mahjong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Let's Encrypt SSL-Zertifikat
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d mahjong-treff.de -d www.mahjong-treff.de
```

#### 7. Automatischer Cleanup (Cron)
```bash
crontab -e

# Täglich um 3 Uhr morgens aufräumen
0 3 * * * cd /var/www/mahjong && node cleanup.js
```

#### 8. Monitoring einrichten
```bash
# PM2 Plus (kostenlos für kleine Apps)
pm2 link [your_secret_key] [your_public_key]
pm2 save

# Logs anzeigen
pm2 logs mahjong-live

# Metriken anzeigen
pm2 monit
```

### **Checkliste vor Production**

- [ ] `.env` mit Production-Werten (nicht im Repository!)
- [ ] HTTPS/SSL aktiviert
- [ ] reCAPTCHA Secret Key konfiguriert
- [ ] SMTP-Server erreichbar & getestet
- [ ] Datenbank-Backups eingerichtet
- [ ] Firewall konfiguriert (nur Port 80/443)
- [ ] Monitoring/Alerting aktiv
- [ ] Log-Rotation eingerichtet
- [ ] PM2 Restart bei Server-Neustart

---

## 🔧 Troubleshooting

### Problem: "Datenbank verbunden!" Nachricht aber DB nicht erreichbar

**Ursache:** Fehler wird nicht korrekt angezeigt (Line 87 in server.js hat einen Bug)

```javascript
// FALSCH:
db.connect(err => { if (!err) console.log('Datenbank verbunden!');
else console.log('Datenbank verbunden!');  // ← Error-Fall zeigt auch "verbunden"
 });

// RICHTIG:
db.connect(err => {
    if (err) {
        console.error('Datenbank-Fehler:', err);
    } else {
        console.log('Datenbank erfolgreich verbunden!');
    }
});
```

**Lösung:** Umgebungsvariablen prüfen:
```bash
echo $DB_HOST
echo $DB_USER
echo $DB_NAME
```

### Problem: Registrierung funktioniert nicht

**Schritte zum Debuggen:**

1. **reCAPTCHA aktivieren?**
   ```javascript
   // In Console checken:
   console.log(window.grecaptcha); // Sollte nicht undefined sein
   ```

2. **SMTP-Einstellungen testen:**
   ```bash
   # Terminal:
   telnet smtp.gmail.com 465
   # Sollte verbinden
   ```

3. **Server-Logs prüfen:**
   ```bash
   pm2 logs mahjong-live
   # Nach "Registrierungs-Fehler" suchen
   ```

4. **Datenbank direkt testen:**
   ```bash
   mysql -u mahjong -p mahjong_db
   SELECT * FROM users; # Sollte leer sein initial
   ```

### Problem: Login funktioniert, aber "Duplikat-Login"-Fehler

**Ursache:** User wurde nicht vollständig aus loggedInUsers gelöscht

**Lösung:**
```javascript
// In der Socket.io Connection:
// Manuell löschen (wenn nötig)
loggedInUsers.delete(username);

// Oder in der DB:
// Alte Sessions löschen mit cleanup.js
node cleanup.js
```

### Problem: Spieler-Matching funktioniert nicht

**Debug-Tipps:**

1. **Queue-Länge prüfen:**
   ```javascript
   // In server.js Console:
   console.log('Ranked Queue:', waitingQueue.length);
   console.log('Layout Queue:', layoutQueue.length);
   ```

2. **Matching-Logik testen:**
   - Min. 2 Spieler erforderlich
   - Rang-Differenz max. 20 (Phase 1)
   - Oder 30+ Sekunden Wartezeit

3. **Logs für Matching:**
   ```bash
   pm2 logs | grep "Queue-Check"
   pm2 logs | grep "Match fixiert"
   ```

### Problem: WebSocket-Fehler "CORS policy: No 'Access-Control-Allow-Origin'"

**Ursache:** Socket.io CORS falsch konfiguriert

**Lösung in server.js:**
```javascript
const io = new Server(server, {
    cors: {
        origin: process.env.APP_URL,  // Muss genau match!
        methods: ["GET", "POST"]
    }
});
```

**Und in .env:**
```env
APP_URL=https://deine-domain.de  # Exakt wie im Browser-URL!
```

### Problem: Chat-Nachrichten erscheinen nicht

**Häufige Ursachen:**

1. **User nicht authentifiziert:** `loggedInUsers.has(username)` prüfen
2. **Socket-Fehler:** Logs prüfen
3. **Nachrichten-Länge:** Max. 200 Zeichen, wird gekürzt

**Debug:**
```javascript
// In Console vor Chat:
console.log('Aktueller User:', onlineUsers[socket.id]);
console.log('Alle Online:', Object.values(onlineUsers));
```

---

## 📖 Zusätzliche Ressourcen

### Externe Dokumentationen
- [Express.js Docs](https://expressjs.com/)
- [Socket.io Docs](https://socket.io/docs/)
- [Three.js Docs](https://threejs.org/docs/)
- [MySQL/MariaDB Docs](https://mariadb.com/docs/)
- [bcrypt.js Docs](https://github.com/dcodeIO/bcrypt.js)

### Mahjong-Regeln
- [KMahjongg Projekt](https://games.kde.org/en/kmahjongg)
- [Solitair-Mahjong Anleitung](https://www.solitaire-mahjongg.de/)

### Sicherheit
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Dokumentation](https://helmetjs.github.io/)
- [Rate-Limiting Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📄 Lizenz & Attribution

Dieses Projekt ist Open Source unter der **GNU General Public License v3.0**.

### Credits
- **3D-Engine:** Three.js (MIT)
- **Steinsymbole:** KMahjongg (KDE Games, GPL)
- **Hintergrund:** "Chinese Landscape" © Eugene Trounev (GPL)
- **Backend-Libraries:** Express, Socket.io, bcrypt, Helmet, MySQL2, Nodemailer (MIT/kompatibel)

---

**Letzte Aktualisierung:** Mai 2026  
**Autor:** Christel-Mett  
**Repository:** https://github.com/Christel-Mett/mahjong-live_multiplayer
