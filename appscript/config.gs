/**
 * Kadesh Codex Apps Script write-back prototype configuration.
 *
 * Keep this file explicit. The prototype should fail closed when required
 * spreadsheet IDs, folder IDs, tab names, or headers have not been confirmed.
 */

const KADESH_CONFIG = {
  apiVersion: "prototype-0.1",

  /**
   * ScriptProperties expected before deployment:
   * - KADESH_SPREADSHEET_ID: canonical Google Sheet ID to write to
   * - KADESH_ALLOWED_WRITERS: comma-separated writer emails; optional during local testing
   * - KADESH_SHARED_SECRET: optional fallback token for non-domain deployments
   * - KADESH_FOLDER_POI_IMAGES: Drive folder ID for POI images
   * - KADESH_FOLDER_NPC_IMAGES: Drive folder ID for NPC images
   * - KADESH_FOLDER_MAP_IMAGES: Drive folder ID for map images
   * - KADESH_FOLDER_MISC_UPLOADS: fallback Drive folder ID
   */
  scriptProperties: {
    spreadsheetId: "KADESH_SPREADSHEET_ID",
    allowedWriters: "KADESH_ALLOWED_WRITERS",
    sharedSecret: "KADESH_SHARED_SECRET",
    folders: {
      poiImage: "KADESH_FOLDER_POI_IMAGES",
      npcImage: "KADESH_FOLDER_NPC_IMAGES",
      mapImage: "KADESH_FOLDER_MAP_IMAGES",
      misc: "KADESH_FOLDER_MISC_UPLOADS"
    }
  },

  /**
   * These names/headers are deliberately explicit. Adjust these to the real
   * Sheet tab names and header rows before connecting the frontend.
   */
  entities: {
    poi: {
      label: "POI",
      sheetName: "POIs",
      idField: "POI_ID",
      idPrefix: "POI-",
      idPadding: 4,
      requiredCreateFields: ["Name"],
      allowedCreateFields: [
        "POI_ID", "Name", "POI_Type", "Hex_ID_Ref", "Region_ID_Ref", "POI_Group_ID",
        "Notoriety Tier", "Description", "Summary", "Image_Drive_ID", "Map_ID_Ref",
        "Faction_ID_Ref", "Tags", "Player_Visible", "DM_Notes"
      ],
      allowedUpdateFields: [
        "Name", "POI_Type", "Hex_ID_Ref", "Region_ID_Ref", "POI_Group_ID",
        "Notoriety Tier", "Description", "Summary", "Image_Drive_ID", "Map_ID_Ref",
        "Faction_ID_Ref", "Tags", "Player_Visible", "DM_Notes"
      ],
      assetField: "Image_Drive_ID",
      assetFolderKey: "poiImage"
    },

    npc: {
      label: "NPC",
      sheetName: "NPCs",
      idField: "NPC_ID",
      idPrefix: "NPC-",
      idPadding: 4,
      requiredCreateFields: ["Name"],
      allowedCreateFields: [
        "NPC_ID", "Name", "Race", "Occupation", "Faction", "Home_ID_Ref", "POI_ID_Ref",
        "POI_Group_ID_Ref", "Description", "Summary", "Image_Drive_ID", "Tags",
        "Player_Visible", "DM_Notes"
      ],
      allowedUpdateFields: [
        "Name", "Race", "Occupation", "Faction", "Home_ID_Ref", "POI_ID_Ref",
        "POI_Group_ID_Ref", "Description", "Summary", "Image_Drive_ID", "Tags",
        "Player_Visible", "DM_Notes"
      ],
      assetField: "Image_Drive_ID",
      assetFolderKey: "npcImage"
    },

    map: {
      label: "Map",
      sheetName: "Maps",
      idField: "Map_ID",
      idPrefix: "MAP-",
      idPadding: 4,
      requiredCreateFields: ["Map_Name", "Owner_Type", "Owner_ID_Ref"],
      allowedCreateFields: [
        "Map_ID", "Map_Name", "Owner_Type", "Owner_ID_Ref", "Map_Drive_ID",
        "Sort_Order", "Caption", "Player_Visible", "DM_Notes"
      ],
      allowedUpdateFields: [
        "Map_Name", "Owner_Type", "Owner_ID_Ref", "Map_Drive_ID",
        "Sort_Order", "Caption", "Player_Visible", "DM_Notes"
      ],
      assetField: "Map_Drive_ID",
      assetFolderKey: "mapImage"
    },

    dmJournal: {
      label: "DM Journal",
      sheetName: "DM Journal",
      idField: "Entry_ID",
      idPrefix: "JRN-",
      idPadding: 5,
      requiredCreateFields: ["Source_Type", "Source_ID", "Entry_Body"],
      allowedCreateFields: [
        "Entry_ID", "Timestamp", "Created_By", "Session_ID", "Source_Type", "Source_ID",
        "Entry_Type", "Entry_Body", "Player_Visible"
      ],
      allowedUpdateFields: [
        "Timestamp", "Created_By", "Session_ID", "Source_Type", "Source_ID",
        "Entry_Type", "Entry_Body", "Player_Visible"
      ]
    }
  },

  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ],

  maxUploadBytes: 10 * 1024 * 1024
};

function getKadeshConfig() {
  return KADESH_CONFIG;
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function requireScriptProperty_(key, label) {
  const value = getScriptProperty_(key);
  if (!value) {
    throw new Error(`Missing required ScriptProperty ${key}${label ? ` (${label})` : ""}.`);
  }
  return value;
}

function getSpreadsheetId_() {
  return requireScriptProperty_(KADESH_CONFIG.scriptProperties.spreadsheetId, "canonical Sheet ID");
}

function getFolderId_(folderKey) {
  const propertyKey = KADESH_CONFIG.scriptProperties.folders[folderKey] || KADESH_CONFIG.scriptProperties.folders.misc;
  return requireScriptProperty_(propertyKey, `${folderKey} Drive folder`);
}

function getEntityConfig_(entityType) {
  const key = String(entityType || "").trim();
  const entity = KADESH_CONFIG.entities[key];
  if (!entity) {
    throw new Error(`Unsupported entityType: ${entityType}`);
  }
  return entity;
}
