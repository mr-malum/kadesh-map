/**
 * Google Drive upload helpers for the Kadesh write-back prototype.
 */

function decodeBase64Blob_(file) {
  const bytes = Utilities.base64Decode(file.base64);
  return Utilities.newBlob(bytes, file.mimeType, file.name);
}

function uploadFileToDrive_(entity, file, actor) {
  const folderKey = entity.assetFolderKey || "misc";
  const folderId = getFolderId_(folderKey);
  const folder = DriveApp.getFolderById(folderId);
  const blob = decodeBase64Blob_(file);
  const uploaded = folder.createFile(blob);

  const descriptionParts = [
    "Kadesh Codex prototype upload",
    `entity=${entity.label}`,
    `actor=${actor && actor.actorEmail ? actor.actorEmail : "unknown"}`,
    file.description ? `description=${file.description}` : ""
  ].filter(Boolean);

  uploaded.setDescription(descriptionParts.join("\n"));

  return {
    fileId: uploaded.getId(),
    name: uploaded.getName(),
    mimeType: uploaded.getMimeType(),
    url: uploaded.getUrl(),
    folderKey
  };
}

function maybeAttachUploadedFile_(entity, fields, uploadResult) {
  if (!uploadResult || !entity.assetField) return fields;

  const nextFields = Object.assign({}, fields);
  nextFields[entity.assetField] = uploadResult.fileId;
  return nextFields;
}
