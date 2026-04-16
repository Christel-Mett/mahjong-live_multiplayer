# Mahjong-Live Multiplayer

Online-Solitair-Mahjong Spiel (Node.js), Multiplayer.  
**Live-Demo:** [mahjong-treff.de](https://mahjong-treff.de)
**Hauptsprache:** Deutsch (English via auto-translation).

## Über dieses Projekt
Dieses Projekt ist ein browserbasiertes Solitär-Mahjong-Spiel mit Einzel- und Mehrspielermodus. Es basiert technisch auf Node.js und nutzt Three.js für die Darstellung.

## Entwicklung & Methodik
Dieses Projekt wurde unter Anwendung von **Vibecoding** realisiert. 

Wichtiger Hinweis zum Hintergrund: Ich bin kein professioneller Softwareentwickler oder Programmierer. Die Architektur und die Logik des Spiels entstanden durch eine intensive, iterative Zusammenarbeit zwischen mir (als Visionär und Tester) und Künstlicher Intelligenz (als ausführende Instanz für den Code). 

Dieser moderne Ansatz ermöglichte es mir, ohne tiefe eigene Programmierkenntnisse ein komplexes Mehrspieler-System und eine 3D-Visualisierung umzusetzen. Wer den Code analysiert, wird daher die Handschrift fortschrittlicher KI-Modelle finden, die nach meinen Vorgaben und durch mein Feedback gesteuert wurden.

## Rechtliches & Lizenzen
Dieses Projekt ist Open Source und unter der **GNU General Public License (GPL) v3** veröffentlicht.

* **Grafiken:** Die Steinsymbole und Layouts basieren auf dem "KMahjongg"-Projekt (KDE Games).
* **Hintergrund:** "Chinese Landscape" © Eugene Trounev (GPL).
* **Engine:** Nutzt Three.js (MIT Lizenz).

Weitere Details findest du in der `CREDITS.txt`.

## Installation
Eine detaillierte Anleitung zur Installation und Konfiguration (Datenbank, Node.js, Umgebungsvariablen) befindet sich in der Datei `INSTALL.txt`.

### Kurzübersicht:
1.  Abhängigkeiten installieren: `npm install`
2.  Datenbank aus `maria.sql` importieren.
3.  `.env` Datei basierend auf den eigenen Zugangsdaten erstellen.
4.  Server starten: `node server.js`
