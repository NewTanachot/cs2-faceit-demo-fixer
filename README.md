# CS2 Demo Fixer

Repairs CS2 demos (mostly from FACEIT) that crash the game as soon as `playdemo` starts. It is a static website that runs entirely in your browser: files are never uploaded.

## Usage

1. Open the site and drop in your `.dem`, `.dem.zst` or `.dem.gz` files (several at once is fine).
2. Download the `-fixed.dem` file and move it into `steamapps\common\Counter-Strike Global Offensive\game\csgo`.
3. Open the console in CS2 and type `playdemo <file name>`. The page has a button that copies the exact command.

## Host on GitHub Pages

1. Create a repository and upload every file in this folder, keeping the folder structure (`index.html` must be at the top level).
2. Go to **Settings > Pages**, set Source to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then click Save.
3. After a minute or so the site is live at `https://<username>.github.io/<repo>/`. The "Source code" link in the footer points back to the repository automatically.

## Run locally

Run `python -m http.server 8000` in this folder and open `http://localhost:8000`. Opening `index.html` directly also works, but processing then runs on the page itself, so the page freezes while a demo is being repaired.

## What it fixes

**Crash at playback start.** In affected demos the first `DEM_Packet` carries an `svc_UpdateStringTable` that adds a new `instancebaseline` entry (usually `CChicken`, on maps with chickens such as Dust2 and Nuke) together with the first non-delta `PacketEntities`. CS2 creates those entities on worker threads after the map's spawn groups load and reads that baseline from memory that has already been reused, crashing with an access violation in `engine2.dll` (`GetClassBaseline`).

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
| `index.html`, `styles.css`, `app.js` | The page |
| `worker.js`, `pipeline.js` | Background processing: read, decompress, repair |
| `demofix.js` | The repair logic (no dependencies, also runs in Node.js) |
| `cli.js` | Command-line version |
| `vendor/fzstd.js` | zstd decompressor |
| `fonts/` | Chakra Petch and Bai Jamjuree web fonts |

## Credits

- [fzstd](https://github.com/101arrowz/fzstd) by Arjun Barrett, MIT License (`vendor/fzstd.LICENSE`)
- [Chakra Petch](https://github.com/m4rc1e/Chakra-Petch) and [Bai Jamjuree](https://github.com/cadsondemak/Bai-Jamjuree) (Cadson Demak), SIL Open Font License 1.1 (`fonts/OFL.txt`)

Tested with CS2 1.41.9.2 (October 2026). Not affiliated with Valve or FACEIT.
