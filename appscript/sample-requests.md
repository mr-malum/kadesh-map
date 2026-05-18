# Kadesh Codex Apps Script Prototype — Sample Requests

Replace `SCRIPT_WEB_APP_URL` with the Apps Script web app URL.

For prototype testing, include either:

- a deployed Apps Script session identity that appears in `KADESH_ALLOWED_WRITERS`, or
- a `secret` value matching `KADESH_SHARED_SECRET`.

Set `KADESH_SPREADSHEET_ID` to:

```text
1vb-y-jgWLUIhDstZwObQph_lfJUkVhhEKuln4OuORvo
```

## Create Region

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "region",
  "fields": {
    "Region_Name": "Prototype Coast",
    "Lore": "A temporary test region created by the write-back prototype."
  }
}
```

## Create Hex

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "hex",
  "fields": {
    "Region_ID_Ref": "REG-0001",
    "Terrain": "Coast",
    "Map_XY": "12,34"
  }
}
```

## Create POI

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "fields": {
    "POI_Group_ID": "PGRP-0002",
    "Name": "The Salt-Crowned Shrine",
    "Hex_ID_Ref": "HEX-0123",
    "POI_Type": "Shrine",
    "Notoriety Tier": "Local",
    "Population": "0",
    "Lore": "Ancient stones crusted with sea salt surround a cracked altar."
  }
}
```

## Create POI Group

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poiGroup",
  "fields": {
    "POI_Group_Name": "The Brineward Ruins",
    "Group_Type": "Ruins",
    "Population": "0",
    "Lore": "A loose cluster of coastal ruins used for prototype testing."
  }
}
```

## Create NPC

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "npc",
  "fields": {
    "Home_ID_Ref": "POI-0042",
    "Title": "Harbormaster",
    "Name": "Marra Vey",
    "Organization": "Misty Coast Authority",
    "Race": "Human",
    "Occupation": "Harbormaster",
    "Lore": "Marra keeps three ledgers and trusts only one of them."
  }
}
```

## Update existing POI

```json
{
  "action": "updateRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "id": "POI-0042",
  "fields": {
    "Lore": "Updated test lore from the Apps Script write-back prototype.",
    "Notoriety Tier": "Regional"
  }
}
```

## Upload image only

```json
{
  "action": "uploadFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "file": {
    "name": "salt-crowned-shrine.webp",
    "mimeType": "image/webp",
    "base64": "BASE64_IMAGE_BYTES_HERE",
    "description": "Prototype POI image upload"
  }
}
```

## Upload image and link it to an existing POI

This writes the returned Drive file ID into the POI row's `Image` column.

```json
{
  "action": "uploadAndLinkFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "file": {
    "name": "salt-crowned-shrine.webp",
    "mimeType": "image/webp",
    "base64": "BASE64_IMAGE_BYTES_HERE"
  },
  "linkTo": {
    "entityType": "poi",
    "id": "POI-0042"
  }
}
```

## Upload map image and link it to an existing map row

This writes the returned Drive file ID into the map row's `Image` column.

```json
{
  "action": "uploadAndLinkFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "map",
  "file": {
    "name": "misty-coast-local-map.png",
    "mimeType": "image/png",
    "base64": "BASE64_IMAGE_BYTES_HERE"
  },
  "linkTo": {
    "entityType": "map",
    "id": "MAP-0003"
  }
}
```

## Create map record after separate upload

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "map",
  "fields": {
    "Owner_Type": "region",
    "Owner_ID_Ref": "REG-0007",
    "Map_Name": "Misty Coast Bay Detail",
    "Map_Type": "Regional Detail",
    "Image": "DRIVE_FILE_ID_FROM_UPLOAD",
    "Sort_Order": "10",
    "Lore": "A local view of the rounded bay and narrow entrance."
  }
}
```

## Add DM Journal entry

```json
{
  "action": "createDmJournalEntry",
  "secret": "dev-secret-only-if-configured",
  "sourceType": "poi",
  "sourceId": "POI-0042",
  "entryType": "secret",
  "sessionId": "S004",
  "body": "The shrine bell rings only when something beneath the bay moves.",
  "visibility": "dm"
}
```
