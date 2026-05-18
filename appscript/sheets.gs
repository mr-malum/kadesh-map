/**
 * Google Sheets helpers for the Kadesh write-back prototype.
 */

function openSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function getSheetForEntity_(entity) {
  const sheet = openSpreadsheet_().getSheetByName(entity.sheetName);
  if (!sheet) {
    throw new Error(`Sheet tab not found: ${entity.sheetName}`);
  }
  return sheet;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    throw new Error(`Sheet ${sheet.getName()} has no header row.`);
  }

  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(value => String(value || "").trim());
}

function getHeaderIndex_(headers) {
  const index = {};
  headers.forEach((header, i) => {
    if (header) index[header] = i;
  });
  return index;
}

function assertHeaders_(headers, requiredHeaders, contextLabel) {
  const headerSet = new Set(headers);
  const missing = requiredHeaders.filter(header => !headerSet.has(header));
  if (missing.length) {
    throw new Error(`${contextLabel} is missing required header(s): ${missing.join(", ")}`);
  }
}

function isOptionalAuditField_(field) {
  return [
    "Created_At",
    "CreatedAt",
    "Created_By",
    "CreatedBy",
    "Updated_At",
    "UpdatedAt",
    "Updated_By",
    "UpdatedBy"
  ].indexOf(field) !== -1;
}

function shouldForcePlainText_(field) {
  return [
    "Region_ID",
    "Hex_ID",
    "POI_ID",
    "POI_Group_ID",
    "Map_ID",
    "NPC_ID",
    "Entry_ID",
    "Region_ID_Ref",
    "Hex_ID_Ref",
    "Home_ID_Ref",
    "Owner_ID_Ref",
    "Source_ID",
    "Map_XY",
    "Image",
    "Session_ID"
  ].indexOf(field) !== -1 || /_ID(_Ref)?$/.test(field);
}

function writeCellValue_(sheet, rowNumber, columnNumber, field, value) {
  const cell = sheet.getRange(rowNumber, columnNumber);

  if (shouldForcePlainText_(field)) {
    cell.setNumberFormat("@");
    cell.setValue(value === null || value === undefined ? "" : String(value));
    return;
  }

  cell.setValue(value);
}

function findRowById_(sheet, idField, id) {
  const headers = getHeaders_(sheet);
  assertHeaders_(headers, [idField], sheet.getName());

  const headerIndex = getHeaderIndex_(headers);
  const idColumn = headerIndex[idField] + 1;
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { rowNumber: -1, headers, headerIndex };
  }

  const range = sheet.getRange(2, idColumn, lastRow - 1, 1);
  range.setNumberFormat("@");
  const values = range.getDisplayValues();
  const needle = String(id || "").trim();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === needle) {
      return { rowNumber: i + 2, headers, headerIndex };
    }
  }

  return { rowNumber: -1, headers, headerIndex };
}

function rowObjectFromRow_(sheet, rowNumber, headers) {
  if (rowNumber < 2) return null;
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getDisplayValues()[0];
  const row = {};
  headers.forEach((header, i) => {
    if (header) row[header] = values[i];
  });
  return row;
}

function appendEntityRow_(entity, fields) {
  const sheet = getSheetForEntity_(entity);
  const headers = getHeaders_(sheet);
  const requiredHeaders = [entity.idField].concat(entity.requiredCreateFields || []);
  assertHeaders_(headers, requiredHeaders, sheet.getName());

  const now = new Date();
  const rowNumber = sheet.getLastRow() + 1;

  headers.forEach((header, index) => {
    let value = "";

    if (Object.prototype.hasOwnProperty.call(fields, header)) {
      value = fields[header];
    } else if (header === "Created_At" || header === "CreatedAt") {
      value = now;
    } else if (header === "Updated_At" || header === "UpdatedAt") {
      value = now;
    }

    writeCellValue_(sheet, rowNumber, index + 1, header, value);
  });

  return {
    rowNumber,
    row: rowObjectFromRow_(sheet, rowNumber, headers)
  };
}

function updateEntityRow_(entity, id, fields) {
  const sheet = getSheetForEntity_(entity);
  const found = findRowById_(sheet, entity.idField, id);

  if (found.rowNumber < 2) {
    throw new Error(`${entity.label} not found: ${id}`);
  }

  const requestedFields = Object.keys(fields);
  const requiredHeaders = requestedFields.filter(field => !isOptionalAuditField_(field));
  assertHeaders_(found.headers, requiredHeaders, sheet.getName());

  requestedFields.forEach(field => {
    if (found.headerIndex[field] === undefined) return;
    const column = found.headerIndex[field] + 1;
    writeCellValue_(sheet, found.rowNumber, column, field, fields[field]);
  });

  if (found.headerIndex.Updated_At !== undefined && !Object.prototype.hasOwnProperty.call(fields, "Updated_At")) {
    writeCellValue_(sheet, found.rowNumber, found.headerIndex.Updated_At + 1, "Updated_At", new Date());
  } else if (found.headerIndex.UpdatedAt !== undefined && !Object.prototype.hasOwnProperty.call(fields, "UpdatedAt")) {
    writeCellValue_(sheet, found.rowNumber, found.headerIndex.UpdatedAt + 1, "UpdatedAt", new Date());
  }

  return {
    rowNumber: found.rowNumber,
    row: rowObjectFromRow_(sheet, found.rowNumber, found.headers)
  };
}

function entityIdExists_(entity, id) {
  const sheet = getSheetForEntity_(entity);
  return findRowById_(sheet, entity.idField, id).rowNumber > 1;
}
