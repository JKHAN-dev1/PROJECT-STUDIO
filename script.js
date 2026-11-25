const STORAGE_KEY = "studentRecordsCSD0111";
const form = document.getElementById("studentForm");
const fields = ["studentId","studentName","course","semester","section","mark1","mark2","mark3"];
const byId = id => document.getElementById(id);
let records = loadRecords();

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function gradeFor(avg) {
  if (avg >= 90) return "A+";
  if (avg >= 80) return "A";
  if (avg >= 70) return "B";
  if (avg >= 60) return "C";
  if (avg >= 50) return "D";
  return "F";
}
function getAverage(r) {
  return (Number(r.mark1) + Number(r.mark2) + Number(r.mark3)) / 3;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}
function render() {
  const query = byId("searchInput").value.trim().toLowerCase();
  const filtered = records.filter(r =>
    r.studentId.toLowerCase().includes(query) || r.studentName.toLowerCase().includes(query)
  );
  byId("recordsBody").innerHTML = filtered.map(r => {
    const avg = getAverage(r);
    return `<tr>
      <td>${escapeHTML(r.studentId)}</td><td>${escapeHTML(r.studentName)}</td>
      <td>${escapeHTML(r.course)}</td><td>${escapeHTML(r.semester)}</td>
      <td>${escapeHTML(r.section)}</td>
      <td>${r.mark1}, ${r.mark2}, ${r.mark3}</td>
      <td>${avg.toFixed(2)}%</td><td><span class="grade">${gradeFor(avg)}</span></td>
      <td><div class="action-group">
        <button class="small-btn edit-btn" data-action="edit" data-id="${escapeHTML(r.studentId)}">Edit</button>
        <button class="small-btn delete-btn" data-action="delete" data-id="${escapeHTML(r.studentId)}">Delete</button>
      </div></td></tr>`;
  }).join("");
  byId("emptyState").hidden = filtered.length > 0;
  byId("totalStudents").textContent = records.length;
  const classAvg = records.length ? records.reduce((sum,r) => sum + getAverage(r),0) / records.length : 0;
  byId("classAverage").textContent = `${classAvg.toFixed(1)}%`;
  const top = records.length ? [...records].sort((a,b) => getAverage(b)-getAverage(a))[0] : null;
  byId("topPerformer").textContent = top ? top.studentName : "—";
}
function clearForm() {
  form.reset();
  byId("editingId").value = "";
  byId("formHeading").textContent = "Add New Student";
  byId("saveBtn").textContent = "Add Student";
  byId("cancelBtn").hidden = true;
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(fields.map(id => [id, byId(id).value.trim()]));
  const marks = [data.mark1,data.mark2,data.mark3].map(Number);
  if (marks.some(mark => !Number.isFinite(mark) || mark < 0 || mark > 100)) {
    byId("formMessage").textContent = "Each subject mark must be between 0 and 100.";
    return;
  }
  const editingId = byId("editingId").value;
  const duplicate = records.some(r => r.studentId.toLowerCase() === data.studentId.toLowerCase() && r.studentId !== editingId);
  if (duplicate) {
    byId("formMessage").textContent = "That Student ID already exists. Please use a unique ID.";
    return;
  }
  if (editingId) {
    const index = records.findIndex(r => r.studentId === editingId);
    if (index !== -1) records[index] = data;
    byId("formMessage").textContent = "Student record updated.";
  } else {
    records.push(data);
    byId("formMessage").textContent = "Student record added.";
  }
  saveRecords(); clearForm(); render();
});
byId("recordsBody").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const record = records.find(r => r.studentId === button.dataset.id);
  if (!record) return;
  if (button.dataset.action === "edit") {
    fields.forEach(id => byId(id).value = record[id]);
    byId("editingId").value = record.studentId;
    byId("formHeading").textContent = "Edit Student";
    byId("saveBtn").textContent = "Save Changes";
    byId("cancelBtn").hidden = false;
    byId("formMessage").textContent = "";
    window.scrollTo({top:0,behavior:"smooth"});
  } else if (button.dataset.action === "delete" && confirm(`Delete the record for ${record.studentName}?`)) {
    records = records.filter(r => r.studentId !== record.studentId);
    saveRecords(); render();
    byId("formMessage").textContent = "Student record deleted.";
  }
});
byId("cancelBtn").addEventListener("click", clearForm);
byId("searchInput").addEventListener("input", render);
byId("exportBtn").addEventListener("click", () => {
  if (!records.length) { alert("There are no records to export yet."); return; }
  const headers = ["Student ID","Name","Course","Semester","Section","Subject 1","Subject 2","Subject 3","Average","Grade"];
  const rows = records.map(r => [r.studentId,r.studentName,r.course,r.semester,r.section,r.mark1,r.mark2,r.mark3,getAverage(r).toFixed(2),gradeFor(getAverage(r))]);
  const csv = [headers,...rows].map(row => row.map(value => `"${String(value).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "student_records.csv"; link.click();
  URL.revokeObjectURL(url);
});
render();
