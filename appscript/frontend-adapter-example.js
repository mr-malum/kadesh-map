/**
 * Optional frontend adapter example for the Apps Script write-back prototype.
 *
 * This file is intentionally not imported by the production app. It shows the
 * eventual integration shape without replacing the current published-CSV loader.
 */

const KADESH_WRITEBACK_ENDPOINT = "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE";

async function postKadeshWriteback(payload) {
  const response = await fetch(KADESH_WRITEBACK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error && result.error.message ? result.error.message : "Write-back request failed.");
  }
  return result;
}

async function prototypeCreatePoi(fields) {
  return postKadeshWriteback({
    action: "createRecord",
    entityType: "poi",
    fields
  });
}

async function prototypeUpdatePoi(id, fields) {
  return postKadeshWriteback({
    action: "updateRecord",
    entityType: "poi",
    id,
    fields
  });
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      resolve(value.includes(",") ? value.split(",").pop() : value);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function prototypeUploadPoiImageAndLink(poiId, file) {
  return postKadeshWriteback({
    action: "uploadAndLinkFile",
    entityType: "poi",
    file: {
      name: file.name,
      mimeType: file.type,
      base64: await fileToBase64(file)
    },
    linkTo: {
      entityType: "poi",
      id: poiId
    }
  });
}
