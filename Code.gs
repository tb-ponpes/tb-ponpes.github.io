/**
 * Backend Google Apps Script (Web App) untuk:
 *   - doGet  : baca data dari Sheet -> JSON  (frontend tabel)
 *   - doPost : tambah / ubah data -> Sheet    (frontend simpan)
 *   - doDelete: hapus baris berdasarkan row  (frontend hapus)
 *
 * SETELAN:
 *   - SHEET_ID : ID spreadsheet (dari URL: .../d/{ID}/...)
 *   - DEFAULT_SHEET : nama sheet (default "Sheet1")
 *   - COLUMNS : urutan kolom sesuai header sheet
 *
 * Langkah deploy:
 *   1. Sesuaikan SHEET_ID di bawah.
 *   2. Menu Tools > Script Editor, ganti isi file ini.
 *   3. File > Save. Menu Deploy > New deployment > Type: "Web app".
 *   4. Execute as: "Me", Who has access: "Anyone".
 *   5. Salin URL web app, ganti "REPLACE" di app.js (CONFIG.scriptUrl).
 */

var SHEET_ID = "1snL-7pQ8o3XxBnRQ148XDgAx3Za4lQyv9gH-6QjogQg"; // <-- GANTI dengan ID spreadsheet kamu
var DEFAULT_SHEET = "Sheet1";

// Urutan kolom sesuai header sheet
var COLUMNS = [
  "PELANGGAN",
  "TANGGAL PESAN",
  "NAMA BARANG",
  "QTY",
  "SATUAN",
  "STATUS KIRIM",
  "TANGGAL KIRIM",
  "KETERANGAN"
];

// ---------- Helpers ----------
function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(DEFAULT_SHEET);
  if (!sheet) sheet = ss.insertSheet(DEFAULT_SHEET);
  return sheet;
}

function toTextArray(row) {
  return row.map(function (cell) { return cell == null ? "" : String(cell); });
}

function findHeaderIndex() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    var nonEmpty = 0;
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j]) nonEmpty++;
    }
    if (nonEmpty > 0) return i;
  }
  return -1;
}

function rowsToObjects(rowValues, headerIndex) {
  var header = rowValues[headerIndex] || [];
  var out = [];
  for (var i = headerIndex + 1; i < rowValues.length; i++) {
    var row = rowValues[i] || [];
    var obj = { row: i + 1 };
    header.forEach(function (h, idx) {
      obj[h] = row[idx] || "";
    });
    out.push(obj);
  }
  return out;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- API ----------
function doGet(e) {
  try {
    var sheet = getSheet();
    var values = sheet.getDataRange().getValues();
    var hi = findHeaderIndex();
    if (hi < 0) return jsonResponse({ success: true, data: [] });
    var data = rowsToObjects(values, hi);
    return jsonResponse({ success: true, data: data });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || "Unknown error" });
  }
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents || "{}");
    var sheet = getSheet();

    // Isi dari kolom yang diminta (fallback ke string kosong)
    var values = COLUMNS.map(function (c) { return params[c] || ""; });

    var hi = findHeaderIndex();
    if (hi < 0) {
      // Sheet masih kosong: tulis header + baris pertama
      sheet.appendRow(COLUMNS);
      sheet.appendRow(values);
      return jsonResponse({ success: true, message: "Data berhasil disimpan." });
    }

    sheet.appendRow(values);
    var newRow = {
      row: sheet.getLastRow(),
      PELANGGAN: params["PELANGGAN"] || "",
      "TANGGAL PESAN": params["TANGGAL PESAN"] || "",
      "NAMA BARANG": params["NAMA BARANG"] || "",
      QTY: params.QTY || "",
      SATUAN: params.SATUAN || "",
      "STATUS KIRIM": params["STATUS KIRIM"] || "",
      "TANGGAL KIRIM": params["TANGGAL KIRIM"] || "",
      KETERANGAN: params.KETERANGAN || ""
    };
    return jsonResponse({ success: true, message: "Data berhasil disimpan.", data: newRow });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || "Unknown error" });
  }
}

function doDelete(e) {
  try {
    var row = parseInt(e.parameter.row, 10);
    if (!row || row < 1) {
      return jsonResponse({ success: false, error: "row tidak valid" });
    }
    getSheet().deleteRow(row);
    return jsonResponse({ success: true, message: "Data berhasil dihapus." });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || "Unknown error" });
  }
}

// ---------- CORS preflight ----------
// fetch() dengan Content-Type: application/json memicu permintaan CORS preflight (OPTIONS) sebelum POST.
// Handler ini agar preflight lolos, lalu POST asli bisa dikirim.
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
}
