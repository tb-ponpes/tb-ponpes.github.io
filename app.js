// ============ CONFIG ============
// GANTI dengan URL Web App dari Google Apps Script (lihat README)
const CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/REPLACE/exec",
  sheetName: "Sheet1",
  columns: [
    "PELANGGAN",
    "TANGGAL PESAN",
    "NAMA BARANG",
    "QTY",
    "SATUAN",
    "STATUS KIRIM",
    "TANGGAL KIRIM",
    "KETERANGAN"
  ]
};

const DISPLAY = {
  "PELANGGAN": "Pemesan",
  "TANGGAL PESAN": "Tanggal Pemesan",
  "NAMA BARANG": "Nama Barang",
  "QTY": "Qty",
  "SATUAN": "Satuan",
  "STATUS KIRIM": "Status Kirim",
  "TANGGAL KIRIM": "Tanggal Kirim",
  "KETERANGAN": "Keterangan"
};

const STATUS_MAP = { BELUM: "BELUM", SIAP: "SIAP", KIRIM: "KIRIM", SELESAI: "SELESAI" };
const STATUS_COLORS = {
  BELUM: "status-BELUM",
  SIAP: "status-SIAP",
  KIRIM: "status-KIRIM",
  SELESAI: "status-SELESAI"
};

// Element refs
const form = document.getElementById("form");
const fPemesan = document.getElementById("f-pemesan");
const fTglPesan = document.getElementById("f-tgl-pesan");
const fBarang = document.getElementById("f-barang");
const fQty = document.getElementById("f-qty");
const fSatuan = document.getElementById("f-satuan");
const fStatus = document.getElementById("f-status");
const fTglKirim = document.getElementById("f-tgl-kirim");
const fKet = document.getElementById("f-ket");
const btnSimpan = document.getElementById("btn-simpan");
const btnReset = document.getElementById("btn-reset");
const formMsg = document.getElementById("form-msg");
const tableBody = document.getElementById("table-body");
const rowCount = document.getElementById("row-count");
const tableMsg = document.getElementById("table-msg");

let editingRow = null; // row number di sheet (1-based) saat edit, null = menambah

const today = new Date();
const isoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
fTglPesan.value = isoDate(today);
fTglKirim.value = isoDate(today);

// ============ Helpers ============
function showFormMsg(msg, type) {
  formMsg.textContent = msg;
  formMsg.className = "form-msg show " + (type || "");
}
function setAlert(type, msg) {
  const el = document.getElementById("alert-" + type);
  if (!el) return;
  el.textContent = msg;
  el.className = "alert show " + type;
}
function clearAlert() {
  document.querySelectorAll(".alert").forEach((el) => (el.className = "alert"));
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
function isStatus(v) { return v in STATUS_COLORS; }

function statusBadge(status) {
  const s = status in STATUS_COLORS ? status.toUpperCase() : "BELUM";
  return `<span class="status-badge ${STATUS_COLORS[s] || "status-Readonly"}">${escapeHtml(s)}</span>`;
}

// ============ Form <-> Payload ============
function getPayload(isEdit) {
  const base = {
    "PELANGGAN": fPemesan.value.trim(),
    "TANGGAL PESAN": fTglPesan.value,
    "NAMA BARANG": fBarang.value.trim(),
    QTY: fQty.value.trim(),
    SATUAN: fSatuan.value.trim().toUpperCase(),
    "STATUS KIRIM": fStatus.value,
    "TANGGAL KIRIM": fTglKirim.value,
    KETERANGAN: fKet.value.trim()
  };
  if (isEdit && editingRow) base.row = editingRow;
  return base;
}

function fillFormFromItem(item) {
  fPemesan.value = item["PELANGGAN"] || "";
  fTglPesan.value = item["TANGGAL PESAN"] || "";
  fBarang.value = item["NAMA BARANG"] || "";
  fQty.value = item.QTY || "";
  fSatuan.value = (item.SATUAN || "").toUpperCase();
  fStatus.value = item["STATUS KIRIM"] || "BELUM";
  fTglKirim.value = item["TANGGAL KIRIM"] || "";
  fKet.value = item["KETERANGAN"] || "";
  editingRow = item.row || null;
}

function resetForm() {
  form.reset();
  fTglPesan.value = isoDate(today);
  fTglKirim.value = isoDate(today);
  editingRow = null;
  btnSimpan.textContent = "Simpan";
  clearAlert();
  showFormMsg("");
}

// ============ Network ============
async function api(path, method, body) {
  const res = await fetch(CONFIG.scriptUrl + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) {
    data = { success: false, error: "Response bukan JSON: " + text.slice(0, 200) };
  }
  if (!res.ok || !data.success) {
    const err = new Error(data.error || "Server error (" + res.status + ")");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ============ Render ============
function renderRow(item, index) {
  const rowNo = item.row || (index + 1);
  const status = isStatus(item["STATUS KIRIM"]) ? item["STATUS KIRIM"] : "BELUM";
  return `
    <tr data-row="${rowNo}">
      <td>${rowNo}</td>
      <td>${escapeHtml(item["PELANGGAN"] || "")}</td>
      <td>${escapeHtml(item["NAMA BARANG"] || "")}</td>
      <td>${item.QTY || ""}</td>
      <td>${escapeHtml(item.SATUAN || "")}</td>
      <td>${statusBadge(status)}</td>
      <td>${escapeHtml(item["TANGGAL KIRIM"] || "")}</td>
      <td class="desc-cell">${escapeHtml(item["KETERANGAN"] || "")}</td>
      <td class="action-btns">
        <button class="btn btn-sm btn-secondary edit-btn" data-row="${rowNo}">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn" data-row="${rowNo}">Hapus</button>
      </td>
    </tr>`;
}

function loadData() {
  clearAlert();
  api("", "GET")
    .then((data) => {
      const rows = (data.data && data.data.length) ? data.data : [];
      tableBody.innerHTML = "";
      if (rows.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="empty">Belum ada data. Isi formulir di atas untuk memulai.</td></tr>`;
        rowCount.textContent = "0 data";
        tableMsg.textContent = "";
        return;
      }
      // Urutkan sesuai urutan baris di sheet (row naik) — prediktif, tidak tergantung format tanggal
      const sorted = [...rows].sort((a, b) => (a.row || 0) - (b.row || 0));
      sorted.forEach((item, i) => tableBody.appendChild(renderRow(item, i)));
      rowCount.textContent = sorted.length + " data";
      tableMsg.textContent = "";
    })
    .catch((err) => {
      tableMsg.textContent = err.message;
      setAlert("error", "Gagal memuat data: " + err.message);
    });
}

// ============ Actions ============
function cancelEdit() {
  editingRow = null;
  resetForm();
}

function startEdit(item) {
  fillFormFromItem(item);
  btnSimpan.textContent = "Update";
  setAlert("info", "Mengedit data baris " + (item.row || ""));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();
  const payload = getPayload(editingRow !== null);
  const q = Number(payload.QTY);
  if (!payload["PELANGGAN"] || !payload["NAMA BARANG"] || !payload.QTY) {
    showFormMsg("Pemesan, Nama Barang, dan Qty wajib diisi.", "error");
    return;
  }
  if (isNaN(q) || q < 1) {
    showFormMsg("Qty harus berupa angka >= 1.", "error");
    return;
  }
  btnSimpan.disabled = true;
  btnSimpan.innerHTML = '<span class="spinner"></span><span class="btn-text">Menyimpan...</span>';
  try {
    await api("", "POST", payload);
    showFormMsg("Data berhasil disimpan.", "success");
    resetForm();
    await loadData();
  } catch (err) {
    showFormMsg("Gagal menyimpan: " + (err.message || "Unknown error"), "error");
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.innerHTML = '<span class="btn-text">Simpan</span>';
  }
});

btnReset.addEventListener("click", () => {
  if (editingRow !== null) {
    if (!confirm("Batal mengedit? Data yang diketik akan dibatalkan.")) return;
    cancelEdit();
  } else {
    resetForm();
  }
});

tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const row = parseInt(btn.dataset.row, 10);
  if (!row) return;

  if (btn.classList.contains("edit-btn")) {
    const item = tableBody.querySelector(`tr[data-row="${row}"]`);
    if (item) startEdit(item);
    return;
  }

  if (btn.classList.contains("delete-btn")) {
    if (!confirm(`Hapus data baris ${row} ini?`)) return;
    try {
      await api(`/delete?row=${row}`, "DELETE");
      showFormMsg("Data berhasil dihapus.", "success");
      await loadData();
    } catch (err) {
      showFormMsg("Gagal menghapus: " + (err.message || "Unknown error"), "error");
    }
  }
});

// ============ Init ============
loadData();
