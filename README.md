# Progressi

Web app personale per tenere traccia dei progressi con corsa e palestra.
Pensata per iPhone (si installa sulla schermata Home e funziona offline),
con **tutti i dati salvati solo sul dispositivo**.

## Stack

| Cosa | Con cosa |
| --- | --- |
| Interfaccia | [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org), build con [Vite](https://vite.dev) |
| Dati | [Dexie.js](https://dexie.org) su IndexedDB (database del browser, resta sul telefono) |
| App installabile / offline | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
| Grafici | [Recharts](https://recharts.org) |
| Navigazione | react-router (HashRouter, compatibile con GitHub Pages) |
| Font | Outfit, self-hosted (nessuna richiesta a server esterni) |
| Pubblicazione | GitHub Pages tramite GitHub Actions |

## Avvio in locale

```bash
npm install
npm run dev
```

Apri l'indirizzo stampato nel terminale (di solito `http://localhost:5173`).

### Provare dall'iPhone sulla stessa rete Wi-Fi

`npm run dev` espone il server anche sulla rete locale (`--host`): nel terminale
compare una riga `Network: http://192.168.x.x:5173`. Apri quell'indirizzo con
Safari sull'iPhone. Nota: l'installazione come app e il funzionamento offline
richiedono HTTPS, quindi funzionano solo sul sito pubblicato, non in locale.

### Altri comandi

```bash
npm run build     # controlla i tipi e crea la versione ottimizzata in dist/
npm run preview   # serve la cartella dist/ per provare la build
npm run icons     # rigenera le icone PNG della PWA (public/icons)
```

## Struttura del progetto

```
src/
  main.tsx              punto di ingresso (font, tema, router)
  App.tsx               elenco delle pagine (rotte)
  styles/theme.css      TUTTE le variabili del tema: colori, raggi, ombre, spaziature
  styles/global.css     reset e utility
  db/                   schema Dexie, tipi dei dati, esercizi preimpostati
  lib/                  funzioni pure: date, formattazione, backup, calcoli
  hooks/                hook React (impostazioni, tema, toast)
  components/ui/        mattoncini riutilizzabili (Card, Button, Field, Metric, Sheet...)
  components/charts/    impostazioni comuni dei grafici (assi, tooltip, scale)
  components/body/      grafico peso, indicatore vita/altezza, modulo misurazioni
  components/running/   grafici distanza/passo/FC e modulo corsa
  components/layout/    struttura pagina e barra di navigazione
  pages/                una cartella-pagina per sezione
scripts/generate-icons.mjs   genera le icone senza dipendenze esterne
.github/workflows/deploy.yml pubblicazione automatica su GitHub Pages
```

## Privacy e backup

- Il sito pubblicato e' statico: nessun server riceve i dati. Tutto vive in
  IndexedDB sul dispositivo (e nel browser che usi).
- Cancellare i dati del sito da Safari, o eliminare l'app dalla Home, cancella
  anche i dati: fai un backup ogni tanto.
- **Impostazioni > Backup**: *Esporta* crea un file JSON (su iPhone si apre il
  menu di condivisione, salvalo in File/iCloud); *Importa* lo ripristina
  sostituendo tutto. Se passano piu' di 14 giorni dall'ultimo backup compare
  un promemoria.

## Pubblicazione su GitHub Pages

1. Crea un repository **pubblico** su GitHub (senza README, .gitignore o licenza:
   il progetto li ha gia').
2. Collega e carica il codice:
   ```bash
   git remote add origin https://github.com/<utente>/<repo>.git
   git push -u origin main
   ```
3. Su GitHub: **Settings > Pages > Build and deployment > Source** e scegli
   **GitHub Actions**.
4. Il workflow parte da solo a ogni push su `main`. Dopo 1-2 minuti l'app e'
   raggiungibile su `https://<utente>.github.io/<repo>/`.
5. Su iPhone apri quell'indirizzo con Safari, tocca **Condividi > Aggiungi alla
   schermata Home**.

Il percorso base (`/<repo>/`) viene ricavato automaticamente dal nome del
repository durante la build in GitHub Actions: non c'e' nulla da configurare.

## Fasi di sviluppo

1. **Setup** — progetto, tema, navigazione, database, impostazioni e backup, PWA, workflow
2. Metriche corporee
3. Corsa (con schermata separata per la frequenza cardiaca)
4. Palestra
5. Dashboard
6. Report per il coach
7. Rifinitura del design e deploy
