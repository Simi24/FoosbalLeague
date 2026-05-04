# FoosRank — Roadmap pubblicazione

Stato: v0.15.1. Notifiche (email + in-app) già implementate.

## P0 — blocker lancio pubblico

### 0a. Quick-log friction killer (QR + session + rematch)
- [ ] Route `/quick/<league_code>` con league pre-selezionata
- [ ] Sticker QR template stampabile (PDF generator endpoint)
- [ ] Session mode: "Inizia sessione" con roster presenti
- [ ] Player picker a chip dropdown durante sessione (solo presenti)
- [ ] Bottone "Rematch stessa formazione" post-match
- [ ] Toast ELO animato +N subito dopo submit
- [ ] Target: <10s per loggare match

### 0b. Presence + auto-matchmaking
- [ ] Modello `Presence` (user_id, league_id, date, TTL fine giornata)
- [ ] Endpoint `POST /leagues/{id}/presence/check-in` + `check-out`
- [ ] Endpoint `GET /leagues/{id}/matchmaking/suggest?mode=1v1|2v2`
- [ ] Algo 1v1: pair con ELO più vicino non giocato oggi
- [ ] Algo 2v2: minimizza diff ELO tra team (coppie bilanciate)
- [ ] UI dashboard "Oggi in ufficio" con avatar presenti
- [ ] UI card "Match suggerito" con accept/reject/reshuffle
- [ ] Slack cmd `/foos in` → check-in + mostra chi c'è
- [ ] Daily digest mattutino (9am): "N persone in ufficio, match suggerito"

### 1. PWA installabile + offline shell
- [ ] Aggiungere `vite-plugin-pwa`
- [ ] `manifest.json` con icone 192/512, `display: standalone`, theme color
- [ ] Service worker via Workbox: cache JS/CSS/HTML (offline shell)
- [ ] Runtime cache API `NetworkFirst` con TTL 5min
- [ ] Test installabilità su Chrome Android + iOS Safari 16.4+
- [ ] Icona app + splash screen

### 2. Undo match (grace window)
- [ ] Endpoint `POST /matches/{id}/undo` — solo entro 24h dalla conferma
- [ ] Solo chi ha registrato o admin league
- [ ] Rollback ELO delle squadre coinvolte
- [ ] Audit log entry (chi/quando/perché)
- [ ] UI: bottone "Annulla" nel dettaglio match recente

### 3. Onboarding tutorial (4 step)
- [ ] Welcome screen post-signup
- [ ] Step 1: crea/unisciti a league
- [ ] Step 2: invita giocatori (o join by code)
- [ ] Step 3: registra primo match (mock/demo)
- [ ] Step 4: visualizza leaderboard
- [ ] Skip opzionale, dismiss persistente per user

### 4. Head-to-Head stats
- [ ] Endpoint `GET /players/{id}/h2h/{opponent_id}` — record + ELO swing storico
- [ ] UI: tab H2H su profilo giocatore
- [ ] Visualizzazione: W-L, goal fatti/subiti, ultimi 5 match, streak attiva

### 5. Player search globale
- [ ] Endpoint `GET /players/search?q=` (cross-league, filtro privacy)
- [ ] UI: search bar header con typeahead
- [ ] Rispetto visibilità profilo (public/private flag — vedi P1)

### 6. Demo league seeded
- [ ] Seed league pubblica read-only con 8 giocatori e ~30 match di esempio
- [ ] Link landing "Prova senza registrarti"
- [ ] Script seed idempotente in `backend/scripts/seed_demo.py`

---

## P1 — retention & growth

### 7. Seasons con reset
- [ ] UI gestione stagioni (modello backend già esiste)
- [ ] Cron trimestrale auto-reset ELO (configurabile per league)
- [ ] Leaderboard storica per stagione
- [ ] Badge "Campione stagione X"

### 8. Rank tiers
- [ ] Definizione soglie ELO: Bronzo <1200, Argento 1200-1400, Oro 1400-1600, Platino 1600-1800, Diamante 1800+
- [ ] Icone tier su profilo/leaderboard
- [ ] Animazione promozione/retrocessione

### 9. Win streak tracking
- [ ] Campo `current_streak` e `longest_streak` su Player
- [ ] Aggiornamento in match confirmation handler
- [ ] Display profilo + leaderboard filter "streak attiva"

### 10. League pubblica vs privata
- [ ] Flag `visibility: PUBLIC | PRIVATE` su League
- [ ] Directory league pubbliche cercabili
- [ ] Join diretto senza invite code su league pubbliche

### 11. K-factor editabile per league
- [ ] Campo `k_factor_config` su League settings
- [ ] UI admin: slider/preset (Chill 16, Standard 32, Competitivo 40)
- [ ] Default retrocompatibile con logica attuale

### 12. Shareable match card
- [ ] Endpoint `GET /matches/{id}/share-image.png` — OG image dinamica
- [ ] OG meta tag su pagina match
- [ ] Bottone "Condividi" → Web Share API su mobile

### 13. Weekly digest email
- [ ] Cron lunedì 9:00 locale utente
- [ ] Template: top performer settimana, match pending, tua posizione, streak
- [ ] Unsubscribe link (SES compliance)

### 14a. Gamification — Coin system (cosmetic first)
- [ ] Modello `CoinWallet` (user_id, balance, lifetime_earned)
- [ ] Modello `CoinTransaction` (audit trail earn/spend)
- [ ] Earn rules: +10 match giocato, +20 vinto, +50 upset (ELO diff >100), +50/100/200 streak 3/5/10, +100 achievement, +15 daily first match
- [ ] Daily earn cap ~250 coin (anti-farming)
- [ ] Shop UI + inventory
- [ ] Cosmetic items: avatar frame, titoli, leaderboard theme, celebrazione post-match
- [ ] No gameplay effect in Fase 1 — validation prima

### 14b. Gamification — Consumables (Fase 2, post-validation)
- [ ] Flag `gamification_enabled` per league
- [ ] Modalità "Casual mode" vs "Ranked mode" (ELO dampened o separato)
- [ ] Consumable handicap opponent: Cap-8, Slow start, No chain
- [ ] Consumable boost self: ELO Shield, Double or nothing, Underdog fuel
- [ ] Consumable chaos: Blind pick (team random), Handicap roll, Mystery buff
- [ ] Attivazione pre-match, visibile a tutti player, lock dopo start
- [ ] Log consumable attivi per match (dispute resolution)
- [ ] Admin override: può annullare match con consumable contestato
- [ ] Balance iteration plan — rilascio incrementale 2-3 consumable alla volta

### 14c. Gamification — Events stagionali
- [ ] "Weekend chaos" — consumable gratis, coin x2
- [ ] "Tournament ranked week" — consumable disabilitati
- [ ] Consumable limited-edition per event
- [ ] Banner homepage quando event attivo

### 14. Tournament brackets
- [ ] Modello Tournament (single/double elimination, round robin)
- [ ] Generazione bracket + seeding via ELO
- [ ] UI bracket view responsive

---

## P2 — polish

### 15. Dark mode
- [ ] Toggle header + persist localStorage
- [ ] Rispetta `prefers-color-scheme` default
- [ ] Audit Tailwind classes per dark variant

### 16. i18n IT/EN
- [ ] Setup `react-i18next`
- [ ] Estrazione stringhe esistenti
- [ ] Lingua auto da browser + switcher manuale

### 17. Achievement rarity tiers
- [ ] Tier: Common / Rare / Epic / Legendary
- [ ] Colori/effetti diversi per tier
- [ ] Filtro achievement per rarità

### 18. Follow/friends
- [ ] Modello Follow (follower_id, following_id)
- [ ] Endpoint follow/unfollow/list
- [ ] Feed attività amici

### 19. Export dati (GDPR)
- [ ] Endpoint `GET /users/me/export` — JSON con tutti i dati utente
- [ ] Trigger da settings profilo
- [ ] Delete account cascade

### 20. XP / level system
- [ ] Campo XP su Player (match giocato = 10 XP, vinto = 20 XP, achievement = variabile)
- [ ] Curva livelli (formula quadratica)
- [ ] Display livello su avatar

### 21. Calendar integration
- [ ] Endpoint "schedula match" genera .ics
- [ ] Link "Add to Google Calendar" nel match pending
- [ ] Reminder 1h prima via email

---

## Publication infra (parallel track)

- [ ] Frontend Dockerfile prod stage (build statico per S3/CloudFront)
- [ ] `.env.example` + rimozione Cognito ID da `docker-compose.yaml`
- [ ] Route53 + ACM + dominio custom
- [ ] README utente-facing (signup → gioca → leaderboard)
- [ ] LICENSE (MIT)
- [ ] CloudWatch dashboard + request ID tracing
- [ ] Mobile QA pass su device reale

---

## Ordine sprint suggerito

| Sprint | Focus | Feature |
|--------|-------|---------|
| 1 | **Quick-log + Presence** (retention core) | #0a #0b |
| 2 | PWA + undo | #1 #2 |
| 3 | Onboarding + demo | #3 #6 |
| 4 | Social/competitive | #4 #5 |
| 5 | Infra pubblicazione | Publication track |
| 6 | Seasons + tiers + streak | #7 #8 #9 |
| 7 | Coin cosmetic (validation) | #14a |
| 8 | Growth | #10 #12 #13 |
| 9 | Consumables Fase 2 (se #14a valida) | #14b |
| 10+ | Polish + P2 | P2 |
