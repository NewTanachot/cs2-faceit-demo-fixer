# CS2 Demo Fixer

Repairs CS2 demos (mostly from FACEIT) that crash the game as soon as `playdemo` starts. It is a static website that runs entirely in your browser: files are never uploaded.

**Use it at https://newtanachot.github.io/cs2-faceit-demo-fixer/** ([ภาษาไทย](https://newtanachot.github.io/cs2-faceit-demo-fixer/th.html))

## Usage

1. Open the site and drop in your `.dem`, `.dem.zst` or `.dem.gz` files (several at once is fine).
2. Download the `-fixed.dem` file and move it into `steamapps\common\Counter-Strike Global Offensive\game\csgo`.
3. Open the console in CS2 and type `playdemo <file name>`. The page has a button that copies the exact command.

## Why FACEIT demos crash

The crashes come from pet chickens. Valve added them in the Rush Hour update (22 September 2026) without mentioning them in the patch notes: players hatch an egg and raise the chicken, and once it grows to the Pullet stage it can join its owner's matches and follow them around the map.

When a FACEIT match starts, pet chickens spawn together with the players on the very first tick. So a chicken's starting data (its entity baseline) arrives at the exact moment CS2 creates every entity in the match, instead of in the setup data at the start of the file, where demos that play fine keep it. CS2's demo player doesn't handle that correctly and crashes. The bug itself is in CS2; pet chickens just trigger it much more often.

What points to pet chickens:

- **The chicken has an owner.** In crashing demos the `CChicken` entity has item-style owner data: `m_iAccountID` (the owner's account), `m_szCustomName` (the name given to the chicken), `m_owner` (the player who owns it) and `m_leader` (the player it follows). A map's own chickens never have an owner or a name.
- **It appears right where the game crashes.** In each crashing demo examined so far, there is no chicken while the demo loads, and a chicken appears on the first tick, exactly where CS2 crashes.
- **A demo that plays fine has no chicken.** A working Ancient demo has no chicken at any point in the match.
- **The timing fits.** Eggs started hatching on 28 September, and according to the game files a chicken must reach the Pullet stage before it can join a match. Crashing demos started turning up in late October. This is inferred from the dates; Valve hasn't confirmed it.

So any FACEIT match where someone brings a grown pet chicken can produce a crashing demo, on any map. What the chicken looks like doesn't matter: a plain chicken with no customization crashes the game too. If Valve fixes the bug in a future update, this tool won't be needed anymore.

## Host on GitHub Pages

1. Create a repository and upload every file in this folder, keeping the folder structure (`index.html` must be at the top level).
2. Go to **Settings > Pages**, set Source to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then click Save.
3. After a minute or so the site is live at `https://<username>.github.io/<repo>/`. The "Source code" link in the footer points back to the repository automatically.
4. Replace `https://newtanachot.github.io/cs2-faceit-demo-fixer/` in `index.html`, `th.html` and `sitemap.xml` with your own address (search engines and link previews read it from there), and change the counter name in `TALLY_URL` in `app.js` so your repairs aren't added to this site's count.

## Run locally

Run `python -m http.server 8000` in this folder and open `http://localhost:8000`. Opening `index.html` directly also works, but processing then runs on the page itself, so the page freezes while a demo is being repaired.

## Repair count

The page shows how many demos it has repaired for everyone. After each repair it sends one request to [Abacus](https://jasoncameron.dev/abacus/) (`/hit/newtanachot-cs2-demo-fixer/demos-fixed`), with no file name and nothing from the file. Copies served from `localhost` or opened from disk only read the number.

## What it fixes

**Crash at playback start.** In affected demos the first `DEM_Packet` carries an `svc_UpdateStringTable` that adds a new `instancebaseline` entry (usually `CChicken`, from a pet chicken that spawns with the players; see [Why FACEIT demos crash](#why-faceit-demos-crash)) together with the first non-delta `PacketEntities`. CS2 creates those entities on worker threads after the map's spawn groups load and reads that baseline from memory that has already been reused, crashing with an access violation in `engine2.dll` (`GetClassBaseline`).

The fixer appends the entry to the signon `svc_CreateStringTable` and the `DEM_StringTables` snapshot, removes the duplicate `instancebaseline` / `AnimAssetData` updates from that packet and from the `DEM_FullPacket` at the same tick, and rewrites the header offsets. Every other message is copied byte for byte, and all gameplay data stays identical (verified with [demoparser2](https://github.com/LaihoE/demoparser) on real demos: every tick row, kill, shot, damage event and grenade matches the original).

**Broken text in game events.** Invalid UTF-8 inside game-event strings (seen in a `player_disconnect` `networkid`) is replaced with `?` characters of the same length, so tools like demoparser2 can read the demo.

Modified messages are stored as valid snappy streams (a single literal block); they decode identically with Google's C++ snappy library.

## Command line

```
node cli.js 1-xxxxxxxx-....-1-1.dem.zst            # writes ...-fixed.dem next to the input
node cli.js input.dem output.dem
```

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `th.html` | The page in English and Thai. Each language has its own address so search engines index both; first-time Thai visitors to `index.html` are sent to `th.html` |
| `styles.css`, `app.js` | Page styles and logic |
| `favicon.svg`, `og-en.png`, `og-th.png` | Tab icon and link preview images |
| `sitemap.xml` | Page list to submit in Google Search Console |
| `worker.js`, `pipeline.js` | Background processing: read, decompress, repair |
| `demofix.js` | The repair logic (no dependencies, also runs in Node.js) |
| `cli.js` | Command-line version |
| `vendor/fzstd.js` | zstd decompressor |
| `fonts/` | Chakra Petch and Bai Jamjuree web fonts |

## Credits

- [fzstd](https://github.com/101arrowz/fzstd) by Arjun Barrett, MIT License (`vendor/fzstd.LICENSE`)
- [Chakra Petch](https://github.com/m4rc1e/Chakra-Petch) and [Bai Jamjuree](https://github.com/cadsondemak/Bai-Jamjuree) (Cadson Demak), SIL Open Font License 1.1 (`fonts/OFL.txt`)

Tested with CS2 1.41.9.2 (October 2026). Not affiliated with Valve or FACEIT.
