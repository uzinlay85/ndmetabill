// --- GLOBAL VARIABLES ---
let billData = [];
let isAdminLoggedIn = false;
let currentlyEditingIndex = null;
const ADMIN_PASSWORD = "Ashin@135";
const MONTH_HEADERS = ['၁-လပိုင်း', '၂-လပိုင်း', '၃-လပိုင်း', '၄-လပိုင်း', '၅-လပိုင်း', '၆-လပိုင်း', '၇-လပိုင်း', '၈-လပိုင်း', '၉-လပိုင်း', '၁၀-လပိုင်း', '၁၁-လပိုင်း', '၁၂-လပိုင်း'];
const DISPLAY_HEADERS = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'ရွေးချယ်ထားသောလ', 'ဘေလ်ပမာဏ'];

// --- DOM ELEMENTS ---
const adminLoginModal = document.getElementById('adminLoginModal');
const editDataModal = document.getElementById('editDataModal');
const mainContent = document.getElementById('mainContent');
const adminPanel = document.getElementById('adminPanel');

// --- UTILITY FUNCTIONS ---
function convertMyanmarToEnglishNumbers(myanmarNumberStr) {
    if (typeof myanmarNumberStr !== 'string') return myanmarNumberStr;
    const myanmarNumbers = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = myanmarNumberStr;
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(myanmarNumbers[i], "g"), englishNumbers[i]);
    }
    return result;
}

function convertEnglishToMyanmarNumbers(englishNumberStr) {
    if (typeof englishNumberStr !== 'string' || !englishNumberStr) return englishNumberStr;
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const myanmarNumbers = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    let result = String(englishNumberStr);
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(englishNumbers[i], "g"), myanmarNumbers[i]);
    }
    return result;
}

function formatNumber(num) {
    return (parseInt(num, 10) || 0).toLocaleString('en-US');
}

function getLatestMonthWithData(data) {
    for (let i = MONTH_HEADERS.length - 1; i >= 0; i--) {
        const month = MONTH_HEADERS[i];
        if (data.some(rec => rec[month] && String(rec[month]).trim() !== '')) return month;
    }
    return null;
}

// --- CSV FUNCTIONS ---
function parseCSV(text) {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] ? values[i].trim() : '';
        });
        return obj;
    }).filter(record => record['စဉ်'] && !record['စဉ်'].includes('စုစုပေါင်း'));
}

function generateCSV(data) {
    const allHeaders = ['စဉ်', 'အမည်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'ရည်ညွှန်း', ...MONTH_HEADERS];
    let csvContent = allHeaders.join(',') + '\n';
    data.forEach(record => {
        const row = allHeaders.map(header => record[header] || '').join(',');
        csvContent += row + '\n';
    });
    return csvContent;
}

function downloadCSV() {
    const csvContent = generateCSV(billData);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'meter_bill_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- ADMIN PANEL: NEW DATA MANAGEMENT FUNCTIONS ---
function populateRecordList() {
    const container = document.getElementById('recordListContainer');
    container.innerHTML = '';
    billData.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'record-item';
        item.innerHTML = `
            <span>${record['စဉ်']}. ${record['ကျောင်း']} (${record['စာရင်းအမှတ်']})</span>
            <button class="edit-btn" data-index="${index}">ပြင်ဆင်မည်</button>
        `;
        container.appendChild(item);
    });
    // Add event listeners to new edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const recordIndex = e.target.getAttribute('data-index');
            openEditModal(recordIndex);
        });
    });
}

function openEditModal(index) {
    currentlyEditingIndex = index;
    const record = billData[index];
    document.getElementById('editModalTitle').textContent = `${record['ကျောင်း']} - ဒေတာပြင်ဆင်ခြင်း`;
    const fieldsContainer = document.getElementById('editFieldsContainer');
    fieldsContainer.innerHTML = '';

    MONTH_HEADERS.forEach(month => {
        const value = record[month] ? convertMyanmarToEnglishNumbers(record[month]) : '';
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'edit-field-group';
        fieldGroup.innerHTML = `
            <label for="edit_${month}">${month}</label>
            <input type="text" id="edit_${month}" value="${value}" placeholder="ဘေလ်ပမာဏ" inputmode="numeric" pattern="[0-9]*">
        `;
        fieldsContainer.appendChild(fieldGroup);
    });
    editDataModal.style.display = 'block';
}

function handleEditFormSubmit(e) {
    e.preventDefault();
    if (currentlyEditingIndex === null) return;

    const record = billData[currentlyEditingIndex];
    let hasChanges = false;
    MONTH_HEADERS.forEach(month => {
        const input = document.getElementById(`edit_${month}`);
        const newValue = input.value.trim();
        const newMyanmarValue = newValue ? convertEnglishToMyanmarNumbers(newValue) : '';
        
        if ((record[month] || '') !== newMyanmarValue) {
            record[month] = newMyanmarValue;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        alert('အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
        displaySummary(billData);
        applyFiltersAndRender();
    }
    editDataModal.style.display = 'none';
    currentlyEditingIndex = null;
}


// --- ADMIN PANEL: ORIGINAL DATA ENTRY FUNCTIONS ---
function generateBillEntryForm() {
    const container = document.getElementById('billEntryContainer');
    container.innerHTML = '';
    if (billData.length === 0) return;
    
    billData.forEach((record, index) => {
        const row = document.createElement('div');
        row.className = 'bill-entry-row';
        row.innerHTML = `
            <label>${record['ကျောင်း']} (${record['စာရင်းအမှတ်']})</label>
            <input type="text" id="bill_${index}" placeholder="ဘေလ်ပမာဏ" inputmode="numeric" pattern="[0-9]*">
            <span>ကျပ်</span>
        `;
        container.appendChild(row);
    });
}

function loadCurrentMonthData() {
    const selectedMonth = document.getElementById('entryMonth').value;
    if (!selectedMonth) {
        alert('ကျေးဇူးပြု၍ လကို ရွေးချယ်ပါ။');
        return;
    }
    billData.forEach((record, index) => {
        const input = document.getElementById(`bill_${index}`);
        if (input) {
            const amount = record[selectedMonth] ? convertMyanmarToEnglishNumbers(record[selectedMonth]) : '';
            input.value = amount;
        }
    });
}

function saveBillData(e) {
    e.preventDefault();
    const selectedMonth = document.getElementById('entryMonth').value;
    if (!selectedMonth) {
        alert('ကျေးဇူးပြု၍ လကို ရွေးချယ်ပါ။');
        return;
    }
    let hasChanges = false;
    billData.forEach((record, index) => {
        const input = document.getElementById(`bill_${index}`);
        if (input && /^\d*$/.test(input.value.trim())) {
            const newValue = input.value.trim();
            const myanmarValue = newValue ? convertEnglishToMyanmarNumbers(newValue) : '';
            if ((record[selectedMonth] || '') !== myanmarValue) {
                record[selectedMonth] = myanmarValue;
                hasChanges = true;
            }
        }
    });
    if (hasChanges) {
        alert(`${selectedMonth} အတွက် ဒေတာများကို သိမ်းပြီးပါပြီ။`);
        displaySummary(billData);
        applyFiltersAndRender();
    } else {
        alert('ပြောင်းလဲမှုများ မရှိပါ။');
    }
}

// --- ADMIN LOGIN/LOGOUT & PANEL VISIBILITY ---
function showAdminPanel() {
    adminPanel.style.display = 'block';
    mainContent.style.display = 'none';
    generateBillEntryForm();
    populateRecordList();
}

function hideAdminPanel() {
    adminPanel.style.display = 'none';
    mainContent.style.display = 'block';
    isAdminLoggedIn = false;
}

function handleAdminLogin(e) {
    e.preventDefault();
    if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        adminLoginModal.style.display = 'none';
        document.getElementById('adminPassword').value = '';
        showAdminPanel();
    } else {
        alert('မှားယွင်းသော password ဖြစ်ပါသည်။');
    }
}

// --- MAIN CONTENT DISPLAY LOGIC ---
function applyFiltersAndRender() {
    const schoolFilter = document.getElementById('filter-dropdown-ကျောင်း')?.value || '';
    const monthFilter = document.getElementById('filter-dropdown-လ')?.value || 'all';
    let filteredData = schoolFilter ? billData.filter(r => r['ကျောင်း'] === schoolFilter) : [...billData];

    let tableData = filteredData.map(record => {
        let displayAmount = 0;
        let displayMonth = monthFilter;
        if (monthFilter === 'all') {
            displayMonth = 'လအားလုံး (စုစုပေါင်း)';
            displayAmount = MONTH_HEADERS.reduce((sum, month) => sum + (parseInt(convertMyanmarToEnglishNumbers(record[month] || '0'), 10) || 0), 0);
        } else {
            displayAmount = parseInt(convertMyanmarToEnglishNumbers(record[monthFilter] || '0'), 10) || 0;
        }
        return { ...record, displayMonth, displayAmount };
    });

    tableData.sort((a, b) => monthFilter !== 'all' ? b.displayAmount - a.displayAmount : parseInt(a['စဉ်']) - parseInt(b['စဉ်']));
    renderTable(tableData);
}

function displaySummary(data) {
    const summaryContainer = document.getElementById('summary-info');
    const latestMonth = getLatestMonthWithData(data);
    const latestMonthTotal = latestMonth ? data.reduce((sum, r) => sum + (parseInt(convertMyanmarToEnglishNumbers(r[latestMonth] || '0'), 10) || 0), 0) : 0;
    const yearTotal = data.reduce((total, r) => total + MONTH_HEADERS.reduce((sum, m) => sum + (parseInt(convertMyanmarToEnglishNumbers(r[m] || '0'), 10) || 0), 0), 0);
    summaryContainer.innerHTML = `
        <div class="summary-item">နောက်ဆုံးလ (${latestMonth || 'N/A'}) စုစုပေါင်း = <strong>${convertEnglishToMyanmarNumbers(formatNumber(latestMonthTotal))} ကျပ်</strong></div>
        <div class="summary-item">ယခုနှစ် စုစုပေါင်း = <strong>${convertEnglishToMyanmarNumbers(formatNumber(yearTotal))} ကျပ်</strong></div>
    `;
}

function renderTable(dataToRender) {
    const tbody = document.querySelector('#bill-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    dataToRender.forEach((record, index) => {
        const row = tbody.insertRow();
        row.insertCell().textContent = convertEnglishToMyanmarNumbers(String(index + 1));
        row.insertCell().textContent = record['ကျောင်း'] || '-';
        row.insertCell().textContent = convertEnglishToMyanmarNumbers(record['စာရင်းအမှတ်']) || '-';
        row.insertCell().textContent = convertEnglishToMyanmarNumbers(record['မီတာအမှတ်']) || '-';
        row.insertCell().textContent = record.displayMonth;
        row.insertCell().textContent = convertEnglishToMyanmarNumbers(formatNumber(record.displayAmount));
    });
}

function setupFiltersAndTable(data,
