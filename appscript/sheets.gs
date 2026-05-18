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

function findRowById_(sheet, idField, id) {
  const headers = getHeaders_(sheet);
  assertHeaders_(headers, [idField], sheet.getName());

  const headerIndex = getHeaderIndex_(headers);
  const idColumn = headerIndex[idField] + 1;
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { rowNumber: -1, headers, headerIndex };
  }

  const values = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
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
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
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
  const row = headers.map(header => {
    if (Object.prototype.hasOwnProperty.call(fields, header)) return fields[header];
    if (header === "Created_At" || header === "CreatedAt") return now;
    if (header === "Updated_At" || header === "UpdatedAt") return now;
    return "";
  });

  sheet.appendRow(row);
  const rowNumber = sheet.getLastRow();
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
    sheet.getRange(found.rowNumber, column).setValue(fields[field]);
  });

  if (found.headerIndex.Updated_At !== undefined && !Object.prototype.hasOwnProperty.call(fields, "Updated_At")) {
    sheet.getRange(found.rowNumber, found.headerIndex.Updated_At + 1).setValue(new Date());
  } else if (found.headerIndex.UpdatedAt !== undefined && !Object.prototype.hasOwnProperty.call(fields, "UpdatedAt")) {
    sheet.getRange(found.rowNumber, found.headerIndex.UpdatedAt + 1).setValue(new Date());
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
