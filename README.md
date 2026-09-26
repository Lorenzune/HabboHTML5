# Habbo Classic Client Asset Bundles (`.hab`)
### Technical Documentation & Complete Asset Repository

This directory contains the unpacked resources, metadata, and original `.hab` binary packages extracted from the **Habbo Classic** desktop client (Electron / AIR build).

---

## 📑 Table of Contents

- [Overview](#overview)
- [The `.hab` Binary Format Specification](#the-hab-binary-format-specification)
  - [Header Structure (20 bytes)](#header-structure-20-bytes)
  - [Index Section (DEFLATE / JSON)](#index-section-deflate--json)
  - [Payload Data Section](#payload-data-section)
- [Folder & Asset Breakdown](#folder--asset-breakdown)
  - [Core Components (`extracted_assets/generated/`)](#core-components-extracted_assetsgenerated)
  - [Local Assets & Overlays (`extracted_assets/local_include/`)](#local-assets--overlays-extracted_assetslocal_include)
  - [Original Raw Packages (`extracted_assets/raw_hab_bundles/`)](#original-raw-packages-extracted_assetsraw_hab_bundles)
- [Asset Types & Supported Formats](#asset-types--supported-formats)
- [How Extraction Works](#how-extraction-works)
- [Manifest & Metadata Reference](#manifest--metadata-reference)

---

## 📖 Overview

The Habbo Classic client uses the `.hab` format as high-efficiency resource archives. These archives package all graphical sprites, isometric geometries, window layout definitions, audio effects, typography, and internationalization files required by the client to render the Habbo Hotel universe.

The official Windows client distribution for this build can be downloaded directly from the Habbo CDN:
- 📦 **Official Client Package**: [HabboClassicWin.zip](https://images.habbo.com/habbo-clients/classic-electron/win/prod/56_1864cc909528cf4e66e4a58e3537d4be/HabboClassicWin.zip)
- 🌐 **Client Versions & Endpoints API**: The current client versions, build hashes, and download URLs across all platforms (Classic Electron, Flash/AIR, Unity) can be checked directly via the official endpoint: [https://sandbox.habbo.com/gamedata/clienturls](https://sandbox.habbo.com/gamedata/clienturls)

In the [`extracted_assets/`](./extracted_assets) directory:
1. Every component folder contains the **unpacked, ready-to-use assets** (PNGs, MP3s, XML layouts, TTF fonts, etc.).
2. Every component folder includes its original **`.hab` file** and an exported **`_manifest_index.json`** for complete transparency.
3. The `extracted_assets/raw_hab_bundles/` folder contains a clean copy of all 38 original `.hab` files organized in their original directory tree.

---

## 🔬 The `.hab` Binary Format Specification

The `.hab` container is a Sulake proprietary binary package designed for random access and fast streaming decompression.

### Header Structure (20 bytes)

Every `.hab` file starts with a 20-byte little-endian header:

| Offset (Bytes) | Field Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `0x00 - 0x03` | **Magic Signature** | `4-byte ASCII` | Constant signature `HAB\0` (`0x48 0x41 0x42 0x00`). |
| `0x04 - 0x05` | **Format Version** | `uint16_le` | Bundle format version (default: `1`). |
| `0x06 - 0x07` | **Flags** | `uint16_le` | Feature flags (default: `0x0001`). |
| `0x08 - 0x0B` | **Index Stored Size** | `uint32_le` | Byte size of the compressed index block on disk. |
| `0x0C - 0x0F` | **Index Original Size** | `uint32_le` | Byte size of the uncompressed JSON index. |
| `0x10 - 0x13` | **Payload Size** | `uint32_le` | Total byte size of the concatenated asset data block. |

### Index Section (DEFLATE / JSON)

Immediately following the 20-byte header (at byte offset `20` up to `20 + Index Stored Size`):
- Compressed using standard **zlib / DEFLATE**.
- When decompressed, it parses as an UTF-8 encoded JSON object describing the package contents and entry offsets:

```json
{
  "format": "hab",
  "version": 1,
  "name": "habbo-loader-ui",
  "entries": [
    {
      "name": "button_skin_green_hc_png",
      "mimeType": "image/png",
      "offset": 0,
      "storedLength": 1824,
      "originalLength": 1824,
      "compression": "none"
    },
    {
      "name": "balloon.xml",
      "mimeType": "text/xml",
      "offset": 1824,
      "storedLength": 284,
      "originalLength": 525,
      "compression": "deflate"
    }
  ]
}
```

### Payload Data Section

Starts at offset `20 + Index Stored Size` with total length equal to `Payload Size`:
- Contains each asset binary slice stored at `entry.offset` with length `entry.storedLength`.
- Entries flagged with `"compression": "deflate"` must be passed through `zlib.inflateSync()`.
- Entries flagged with `"compression": "none"` are stored as raw uncompressed bytes.

---

## 📁 Folder & Asset Breakdown

### Core Components (`extracted_assets/generated/`)

| Folder | Resources | Contents & Purpose |
| :--- | :---: | :--- |
| **`habbo-window-manager-com/`** | **1,181** | Complete Habbo UI system. Contains every XML window layout (dialogs, alert boxes, scrollbars, tabs, buttons, borders, frames) and UI texture skin. |
| **`habbo-sound-manager-flash10-com/`** | **21** | Original game audio in `.mp3` format: catalog purchases, camera shutter, console messages, respect chimes, call for help, and SnowStorm effects. |
| **`habbo-free-flow-chat-com/`** | **395** | Modern free-flow room chat engine: speech bubble styles, emotes, fonts, color palettes, and animation frames. |
| **`habbo-room-content/`** | **261** | Room textures, default floor/wall patterns, landscape templates, and room canvas assets. |
| **`habbo-room-ui-com/`** | **280** | In-room user interface: room info stands, user badges display, volume controls, room settings dialogs, and floor plan editor assets. |
| **`habbo-avatar-render-lib/`** | **131** | Avatar animation engine: skeletal geometry, action definitions (walk, sit, wave, carry), figure part offsets, and rendering masks. |
| **`habbo-catalog-com/`** | **193** | In-game Shop / Catalog: page layout templates, category tab icons, promotion badges, and credit/ducket store graphics. |
| **`habbo-games-com/`** | **156** | Mini-games subsystem: SnowStorm (SnowWar) sprites, arena graphics, scores, timers, and lobby interfaces. |
| **`habbo-inventory-com/`** | **196** | User inventory: furni item trays, badge showcase, trading window components, and pet inventory views. |
| **`habbo-localization-com/`** | **14** | Complete localization text strings for all Habbo hotels (`it`, `en`, `es`, `de`, `fr`, `pt`, `fi`, `nl`, `tr`, `no`, `se`, `dk`). |
| **`habbo-air/`** | **65** | Top-level client branding: TrueType fonts (`Volter`, `Ubuntu`), official client logos, login screen splash backgrounds, country flags, and `figuredata_new.xml`. |
| **`habbo-user-defined-room-events-com/`** | **65** | WIRED programming system: triggers, effects, conditions, and variable selection dialogs. |
| **`habbo-navigator-com/`** | **97** | Room navigator: hotel directory, popular rooms tabs, search filters, and tag clouds. |
| **`habbo-toolbar-com/`** | **54** | Bottom navigation bar icons (Me menu, Shop, Rooms, Inventory, Friends). |
| **`habbo-loader-ui/`** | **54** | Preloader interface: progress bars, loading spinners, and connection status dialogs. |
| **`habbo-help-com/`** | **46** | User moderation & Help center: Call for Help (CFH) wizard, safety quiz, and reporting dialogs. |
| **`habbo-notifications-com/`** | **42** | Toast notifications, achievement popups, and reward banners. |
| **`habbo-friend-bar-com/`** | **117** | Desktop friend stream bar: avatar head portraits, online status icons, and stream notifications. |
| **`habbo-quest-engine-com/`** | **36** | Quest system: seasonal quests, reward trackers, and challenge dialogues. |
| **`habbo-groups-com/`** | **26** | Group badges, guild info badges, and room ownership displays. |
| **`habbo-moderation-com/`** | **14** | Moderator tool suite (ModTool): ticket management and ban controls. |
| **`habbo-messenger-com/`** | **16** | Instant messaging console: chat histories, search, and group chat. |
| **`habbo-friend-list-com/`** | **38** | Classic console friend list interface. |
| **`habbo-avatar-editor-com/`** | **7** | Wardrobe / Avatar editor UI layouts and palette pickers. |
| **`habbo-configuration-com/`** | **3** | Core client XML parameters and protocol configuration maps. |
| **`habbo-communication-demo-com/`** | **3** | Handshake test interfaces and socket test layouts. |
| **`habbo-new-navigator/`** | **4** | Modern card-based room explorer layouts. |
| **`habbo-room-object-visualization-lib/`** | **130** | Visualization definitions and shaders for furniture and room avatars. |

---

### Local Assets & Overlays (`extracted_assets/local_include/`)

- **`Dance1.hab` to `Dance4.hab`**: Club Habbo dance animation routines (The Roll, Duck Funk, Pogo Mogo, The Habbo Hop).
- **`TileCursor.hab`**: Isometric tile grid selector and cursor state animations.
- **`SelectionArrow.hab`**: Floating selection indicator pointing to selected furni or players.
- **`PlaceHolderFurniture.hab`**: Fallback sprite displayed when a furniture model is downloading.
- **`PlaceHolderPet.hab` / `PlaceHolderWallItem.hab`**: Fallback sprites for loading pets and wall items.
- **`HabboRoomContent.hab`**: Primary room structure and tile definitions.

---

### Original Raw Packages (`extracted_assets/raw_hab_bundles/`)

Contains all **38 original unextracted `.hab` files** preserved in their original folder hierarchy:
- `extracted_assets/raw_hab_bundles/generated/`
- `extracted_assets/raw_hab_bundles/local_include/`

---

## 🎨 Asset Types & Supported Formats

| Extension | MIME Type | Description |
| :--- | :--- | :--- |
| **`.png` / `.gif`** | `image/png`, `image/gif` | Pixel art spritesheets, UI skin slices, buttons, icons, cursors. |
| **`.xml`** | `text/xml` | Habbo UI layouts, window containers, geometry definitions, animation timelines. |
| **`.mp3`** | `sound/mp3` | High-fidelity audio sound effects and musical cues. |
| **`.ttf`** | `application/x-font-truetype` | Native Habbo pixel and modern typography (Volter Bold, Ubuntu). |
| **`.json`** | `application/json` | Metadata configurations, sprite bounding boxes, and asset aliases. |
| **`.txt`** | `text/plain` | Hotel localizations and translated string dictionaries. |
| **`.bin`** | `application/octet-stream` | Binary payloads and bytecode packages. |

---

## ⚙️ How Extraction Works

All packages were extracted using the included Node.js script:
📄 `extracted_assets/extract_all.js` (run with `node extracted_assets/extract_all.js`)

The extractor performs the following pipeline:
1. Validates the 4-byte signature `HAB\0`.
2. Reads the index size parameters and decompresses the JSON index using **zlib DEFLATE**.
3. Exports `_manifest_index.json` containing complete bundle metadata.
4. Reads each slice from the data payload, inflates compressed entries, resolves normalized file extensions according to MIME types and entry tags, and writes the individual files to disk.
5. Preserves a clean copy of the original `.hab` container in each corresponding directory.
