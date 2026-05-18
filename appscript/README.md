# Kadesh Codex Apps Script Write-Back Prototype

This folder contains an isolated Google Apps Script prototype for writing Kadesh Codex records back into Google Sheets and storing related image/map assets in Google Drive.

It is intentionally not wired into the production frontend yet. The current app can continue loading published CSV data through `js/data-loader.js` while this backend is reviewed, tested, and revised.

## Prototype goals

The prototype can:

- receive structured JSON POST requests
- validate actions, entity types, fields, required fields, and uploads
- generate sequential IDs while holding a write lock
- append new Region, Hex, POI, POI Group, NPC, Map, and DM Journal rows
- update existing rows by reference ID
- upload images/maps to configured Drive folders
- write uploaded Drive file IDs back into the live `Image` field
- return structured JSON success/error payloads

## Files

```text
appscript/
  Code.gs                       # doGet/doPost entrypoint and action dispatch
  config.gs                     # live entity schemas, sheet names, ID prefixes, property names
  ids.gs                        # sequential ID generation helpers
  sheets.gs                     # Sheet open/read/find/append/update helpers
  drive.gs                      # Drive upload helpers
  validation.gs                 # request/auth/payload validation helpers
  README.md                     # this file
  sample-requests.md            # example request bodies
  sample-responses.json         # example response shapes
  frontend-adapter-example.js   # optional example only; not imported by production app
```

## Current frontend relationship

The existing frontend data loader remains read-only and CSV-based. In `js/data-loader.js`, the app currently loads published CSV URLs for entities including `hexes`, `pois`, `npcs`, `regions`, `poiGroups`, `maps`, and `dmJournal`. The loader indexes rows by fields such as `Hex_ID`, `POI_ID`, `NPC_ID`, `Region_ID`, `POI_Group_ID`, `Map_ID`, and `Entry_ID`.

This prototype does not replace that flow. A future integration can POST writes to Apps Script, then refresh the existing CSV-driven app data after Google Sheets republishes/updates.

## Live spreadsheet for prototype testing

Use ScriptProperty `KADESH_SPREADSHEET_ID`:

```text
1vb-y-jgWLUIhDstZwObQph_lfJUkVhhEKuln4OuORvo
```

Do not hard-code that ID into `config.gs`; keeping it in ScriptProperties lets the same code point at clones or backups later.

## Deployment outline

1. Create a Google Apps Script project.
2. Add each `.gs` file from this folder into that Apps Script project.
3. In Apps Script project settings, add required ScriptProperties.
4. Deploy as a web app.
5. Choose the safest available execution/access mode for testing.
6. Test with `sample-requests.md` before connecting any production UI.

## Required ScriptProperties

| Property | Purpose |
| --- | --- |
| `KADESH_SPREADSHEET_ID` | Canonical Google Sheet ID to write into. |
| `KADESH_ALLOWED_WRITERS` | Comma-separated allowlist of writer emails. |
| `KADESH_SHARED_SECRET` | Optional fallback token for prototype requests. Avoid relying on this long-term. |
| `KADESH_FOLDER_REGION_IMAGES` | Drive folder for region image uploads. |
| `KADESH_FOLDER_POI_IMAGES` | Drive folder for POI image uploads. |
| `KADESH_FOLDER_POI_GROUP_IMAGES` | Drive folder for POI group image uploads. |
| `KADESH_FOLDER_NPC_IMAGES` | Drive folder for NPC image uploads. |
| `KADESH_FOLDER_MAP_IMAGES` | Drive folder for map image uploads. |
| `KADESH_FOLDER_MISC_UPLOADS` | Optional fallback Drive folder for miscellaneous uploads. |

The prototype fails closed when no writer authorization is configured.

## Confirmed sheet tabs and columns

The schema below is aligned to the tab/header list supplied for the live prototype database.

### Regions

Tab: `Regions`

Columns:

```text
Region_ID | Region_Name | Lore | Image
```

Create requires:

- `Region_Name`

### Hexes

Tab: `Hexes`

Columns:

```text
Hex_ID | Region_ID_Ref | Terrain | Map_XY
```

Create requires:

- `Region_ID_Ref`
- `Terrain`
- `Map_XY`

### POIs

Tab: `POIs`

Columns:

```text
POI_ID | POI_Group_ID | Name | Hex_ID_Ref | POI_Type | Notoriety Tier | Population | Lore | Image
```

Create requires:

- `Name`

### POI Groups

Tab: `POI_Groups`

Columns:

```text
POI_Group_ID | POI_Group_Name | Group_Type | Population | Lore | Image
```

Create requires:

- `POI_Group_Name`

### Maps

Tab: `Maps`

Columns:

```text
Map_ID | Owner_Type | Owner_ID_Ref | Map_Name | Map_Type | Image | Sort_Order | Lore
```

Create requires:

- `Owner_Type`
- `Owner_ID_Ref`
- `Map_Name`

### NPCs

Tab: `NPCs`

Columns:

```text
NPC_ID | Home_ID_Ref | Title | Name | Organization | Race | Occupation | Lore | Image
```

Create requires:

- `Name`

### DM Journal

Tab: `DM_Journal`

Columns:

```text
Entry_ID | Entry_Body | Entry_Type | Source_Type | Source_ID | Timestamp | Created_By | Session_ID | Visibility
```

Create requires:

- `Entry_Body`
- `Entry_Type`
- `Source_Type`
- `Source_ID`

## Endpoint behavior

### `GET`

Returns basic service information and supported actions.

### `POST`

All POST requests use JSON. Supported actions:

- `createRecord`
- `updateRecord`
- `uploadFile`
- `uploadAndLinkFile`
- `createDmJournalEntry`

Each write action is run under `LockService.getDocumentLock()` to reduce concurrent write hazards.

## Entity type keys

Canonical keys:

- `region`
- `hex`
- `poi`
- `poiGroup`
- `map`
- `npc`
- `dmJournal`

Common aliases such as `regions`, `hexes`, `pois`, `poi_groups`, `maps`, `npcs`, `dm_journal`, and `journal` are also accepted.

## Write-safety decisions in this prototype

### Authentication / authorization

The prototype supports two authorization modes:

1. `KADESH_ALLOWED_WRITERS`: checks the Apps Script session/effective email when Apps Script exposes it.
2. `KADESH_SHARED_SECRET`: a prototype fallback secret sent in the request body.

For a real public app, the shared-secret approach is not enough by itself. Anyone who can inspect frontend JavaScript can recover a frontend-shipped secret. Long-term options may include Google sign-in, a server-side proxy, or a different authenticated backend.

### ID generation

IDs are generated by scanning the target sheet for the largest numeric suffix matching the configured prefix, then appending the next number.

Current assumed formats:

- `REG-0001`
- `HEX-0001`
- `POI-0001`
- `PGRP-0001`
- `MAP-0001`
- `NPC-0001`
- `JRN-00001`

Generation and append happen while holding a document lock. This is slower than a cached counter but safer for the prototype because it respects existing live sheet data.

### Schema protection

The prototype refuses unknown fields instead of silently adding columns or writing into the wrong place. It also verifies required headers before appending or updating.

### Update semantics

Updates locate rows by entity ID and update only the fields supplied in `payload.fields`. ID fields cannot be updated.

### Audit fields

The live schema currently does not include general audit columns except `DM_Journal.Created_By` and `DM_Journal.Timestamp`. The writer still tries to add common audit fields internally, but the Sheet writer ignores optional audit fields when the matching headers do not exist.

## Drive upload behavior

Uploads accept base64-encoded image bytes and write them to configured folders. Allowed MIME types are currently:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`

Default upload limit is 10 MB.

Uploaded file IDs are written into the live `Image` column for Regions, POIs, POI Groups, NPCs, and Maps.

## Future integration with the current app

A small optional frontend adapter could eventually be added without replacing the CSV loader. The integration path should be staged:

1. Add a tiny write client that POSTs to the Apps Script URL.
2. Add dev-only UI actions for create/update/upload.
3. After a successful write, show the returned ID and ask the user to refresh or trigger the existing data reload.
4. Later, decide whether the app should poll/reload CSV data automatically after writes.
5. Only after the write model is stable, consider deeper integration into list/detail pages.

Avoid changing `js/data-loader.js` until the write backend is proven.

## Questions / decisions still open

1. Who is allowed to write?
   - Single DM only?
   - A small allowlist?
   - Any signed-in member of a Google Workspace/domain?

2. What is the auth model?
   - Apps Script session email?
   - Google Identity Services on the frontend?
   - A backend proxy?
   - Temporary shared secret only for local prototype testing?

3. Are the exact ID formats above correct?
   - If existing IDs do not use numeric suffixes, update `idPrefix` / `idPadding` in `config.gs` before writes.

4. What is the Drive folder structure?
   - Separate folders for each asset class?
   - One shared uploads folder during prototype testing?
   - Public/player-visible assets separated from DM-only assets?

5. Does DM-only content need separate protection?
   - `DM_Journal` is loaded by the current published CSV path.
   - If players can access the frontend and published CSVs, DM-only content may be visible unless separated or filtered.

6. Do edits need audit logs or version history?
   - Google Sheets version history helps, but record-level audit rows may be better.
   - Consider an `Audit_Log` tab before allowing broad edits.

7. How strict should validation become?
   - Reference checks against known `Hex_ID`, `Region_ID`, `POI_Group_ID`, etc. can be added.
   - Enum validation can be added for POI type, terrain, visibility, source type, and so on.

8. What should happen on duplicate IDs or malformed existing IDs?
   - Current behavior scans valid numeric suffixes and skips duplicates defensively.
   - Malformed IDs are ignored for next-ID calculation.

9. What frontend UX should own writes?
   - Create buttons on index pages?
   - Edit buttons on detail pages?
   - Mobile utility modal integration?
   - DM-only editor mode?

## Known limitations

- No production-grade auth yet.
- No audit log tab yet.
- No reference integrity checks yet.
- No enum validation yet.
- Frontend adapter is only an example and is not imported by production app.
- No automated tests yet.
- Base64 uploads from a browser can be memory-heavy for large files.
- Apps Script CORS and identity behavior may require deployment-specific testing.
