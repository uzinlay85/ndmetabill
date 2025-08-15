// --- GLOBAL VARIABLES ---
let billData = [];
let isAdminLoggedIn = false;
let currentlyEditingIndex = null;
let hasUnsavedChanges = false; // To track if data has been modified
const ADMIN_PASSWORD = "Ashin@135";
const MONTH_HEADERS = ['၁-လပိုင်း', '၂-လပိုင်း', '၃-လပိုင်း', '၄-လပိုင်း', '၅-လပိုင်း', '၆-လပိုင်း', '၇-လပိုင်း', '၈-လပိုင်း', '၉-လပိုင်း', '၁၀-လပိုင်း', '၁၁-လပိုင်း', '၁၂-လပိုင်း'];
const DISPLAY_HEADERS = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'ရွေးချယ်ထားသောလ', 'ဘေလ်ပမာဏ'];

// --- DOM ELEMENTS ---
const adminLoginModal = document.getElementById('adminLoginModal');
const editDataModal = document.getElementById('editDataModal');
const mainContent = document.getElementById('mainContent');
const adminPanel = document.getElementById('adminPanel');

// --- UTILITY FUNCTIONS ---
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 4000); // Increased duration for important messages
}

function markAsDirty() {
    if (hasUnsavedChanges) return; // No need to run again if already dirty
    hasUnsavedChanges = true;
    const downloadBtn = document.getElementById('downloadCsvBtn');
    downloadBtn.classList.add('unsaved-changes');
    downloadBtn.textContent = 'အပြောင်းအလဲများ သိမ်းဆည်းရန် နှိပ်ပါ';
}

function markAsClean() {
    hasUnsavedChanges = false;
    const downloadBtn = document.getElementById('downloadCsvBtn');
    downloadBtn.classList.remove('unsaved-changes');
    downloadBtn.textContent = 'CSV ဖိုင်ဒေါင်းလုဒ်လုပ်မည်';
}

function convertMyanmarToEnglishNumbers(myanmarNumberStr) {
    if (typeof myanmarNumberStr !== 'string' || !myanmarNumberStr) return myanmarNumberStr;
    const myanmarNumbers = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = String(myanmarNumberStr);
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(myanmarNumbers[i], "g"), englishNumbers[i]);
    }
    return result;
}

function convertEnglishToMyanmarNumbers(englishNumberStr) {
    if ((typeof englishNumberStr !== 'string' && typeof englishNumberStr !== 'number') || !englishNumberStr) {
        return englishNumberStr;
    }
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
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim() !== '');
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
        const row = allHeaders.map(header => `"${(record[header] || '').replace(/"/g, '""')}"`).join(',');
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
    
    showNotification('CSV ကို ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ။ အပြောင်းအလဲများ कायमဖြစ်ရန် ဤဖိုင်ကို server ပေါ်တွင် အစားထိုးတင်ပေးပါ။', 'info');
    markAsClean(); // Reset the unsaved changes state after downloading
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
        // ★★★ FIXED HERE ★★★ Remove commas before displaying in input
        const numStr = record[month] || '';
        const value = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
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
        showNotification('အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။', 'success');
        markAsDirty(); // Mark that there are unsaved changes
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
        showNotification('ကျေးဇူးပြု၍ လကို ရွေးချယ်ပါ။', 'error');
        return;
    }
    billData.forEach((record, index) => {
        const input = document.getElementById(`bill_${index}`);
        if (input) {
            // ★★★ FIXED HERE ★★★ Remove commas before displaying in input
            const numStr = record[selectedMonth] || '';
            const amount = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
            input.value = amount;
        }
    });
}

function saveBillData(e) {
    e.preventDefault();
    const selectedMonth = document.getElementById('entryMonth').value;
    if (!selectedMonth) {
        showNotification('ကျေးဇူးပြု၍ လကို ရွေးချယ်ပါ။', 'error');
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
        showNotification(`${selectedMonth} အတွက် ဒေတာများကို သိမ်းပြီးပါပြီ။`, 'success');
        markAsDirty(); // Mark that there are unsaved changes
        displaySummary(billData);
        applyFiltersAndRender();
    } else {
        showNotification('ပြောင်းလဲမှုများ မရှိပါ။');
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
        showNotification('မှားယွင်းသော password ဖြစ်ပါသည်။', 'error');
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
            // ★★★ FIXED HERE ★★★ Remove commas before parsing for correct calculation
            displayAmount = MONTH_HEADERS.reduce((sum, month) => {
                const numStr = (record[month] || '0').toString();
                const cleanedStr = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
                return sum + (parseInt(cleanedStr, 10) || 0);
            }, 0);
        } else {
            // ★★★ FIXED HERE ★★★ Remove commas before parsing for correct calculation
            const numStr = (record[monthFilter] || '0').toString();
            const cleanedStr = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
            displayAmount = parseInt(cleanedStr, 10) || 0;
        }
        return { ...record, displayMonth, displayAmount };
    });
    
    tableData.sort((a, b) => {
        return b.displayAmount - a.displayAmount;
    });

    renderTable(tableData);
}

function displaySummary(data) {
    const summaryContainer = document.getElementById('summary-info');
    if (!summaryContainer) return;
    const latestMonth = getLatestMonthWithData(data);
    // ★★★ FIXED HERE ★★★ Remove commas before parsing for correct calculation
    const latestMonthTotal = latestMonth ? data.reduce((sum, r) => {
        const numStr = (r[latestMonth] || '0').toString();
        const cleanedStr = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
        return sum + (parseInt(cleanedStr, 10) || 0);
    }, 0) : 0;
    // ★★★ FIXED HERE ★★★ Remove commas before parsing for correct calculation
    const yearTotal = data.reduce((total, r) => total + MONTH_HEADERS.reduce((sum, m) => {
        const numStr = (r[m] || '0').toString();
        const cleanedStr = convertMyanmarToEnglishNumbers(numStr).replace(/,/g, '');
        return sum + (parseInt(cleanedStr, 10) || 0);
    }, 0), 0);
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
        row.insertCell().textContent = convertMyanmarToEnglishNumbers(record['စာရင်းအမှတ်']) || '-';
        row.insertCell().textContent = convertMyanmarToEnglishNumbers(record['မီတာအမှတ်']) || '-';
        row.insertCell().textContent = record.displayMonth;
        row.insertCell().textContent = convertEnglishToMyanmarNumbers(formatNumber(record.displayAmount));
    });
}

function setupFiltersAndTable(data, latestMonth) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'bill-table';
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    DISPLAY_HEADERS.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const filterRow = thead.insertRow();
    filterRow.className = 'filter-row';
    filterRow.insertCell();
    
    const schoolTd = filterRow.insertCell();
    const schoolFilter = document.createElement('select');
    schoolFilter.className = 'filter-input';
    schoolFilter.id = 'filter-dropdown-ကျောင်း';
    schoolFilter.innerHTML = `<option value="">ကျောင်းအားလုံး</option>`;
    [...new Set(data.map(r => r['ကျောင်း']))].sort().forEach(school => {
        schoolFilter.innerHTML += `<option value="${school}">${school}</option>`;
    });
    schoolFilter.onchange = applyFiltersAndRender;
    schoolTd.appendChild(schoolFilter);

    filterRow.insertCell();
    filterRow.insertCell();

    const monthTd = filterRow.insertCell();
    const monthFilter = document.createElement('select');
    monthFilter.className = 'filter-input';
    monthFilter.id = 'filter-dropdown-လ';
    monthFilter.innerHTML = `<option value="all">လအားလုံး</option>`;
    MONTH_HEADERS.forEach(month => {
        monthFilter.innerHTML += `<option value="${month}">${month}</option>`;
    });
    if (latestMonth) monthFilter.value = latestMonth;
    monthFilter.onchange = applyFiltersAndRender;
    monthTd.appendChild(monthFilter);

    filterRow.insertCell();
    table.createTBody();
    resultsContainer.appendChild(table);
}

function exportToPdf() {
    window.print();
}

// --- INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.csv');
        if (!response.ok) {
            throw new Error(`'data.csv' ဖိုင်ကို ရှာမတွေ့ပါ သို့မဟုတ် folder တစ်ခုတည်းတွင် မရှိပါ။`);
        }
        const csvText = await response.text();
        billData = parseCSV(csvText);
        if (billData.length === 0) {
            throw new Error("'data.csv' ဖိုင်ထဲတွင် အချက်အလက်မရှိပါ သို့မဟုတ် format မှားယွင်းနေပါသည်။");
        }
        
        const latestMonth = getLatestMonthWithData(billData);
        setupFiltersAndTable(billData, latestMonth);
        displaySummary(billData);
        applyFiltersAndRender();
        
    } catch (error) {
        console.error("Error loading or parsing data:", error);
        document.getElementById('results').innerHTML = `<p style="color: red; font-weight: bold;">Error: ${error.message}</p>`;
    }

    // Modal close buttons
    document.getElementById('closeLoginModal').addEventListener('click', () => adminLoginModal.style.display = 'none');
    document.getElementById('closeEditModal').addEventListener('click', () => editDataModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === adminLoginModal) adminLoginModal.style.display = 'none';
        if (event.target === editDataModal) editDataModal.style.display = 'none';
    });

    // Admin functionality
    document.getElementById('adminBtn').addEventListener('click', () => adminLoginModal.style.display = 'block');
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('logoutBtn').addEventListener('click', hideAdminPanel);
    
    // Data entry and management forms
    document.getElementById('dataEntryForm').addEventListener('submit', saveBillData);
    document.getElementById('loadDataBtn').addEventListener('click', loadCurrentMonthData);
    document.getElementById('editDataForm').addEventListener('submit', handleEditFormSubmit);
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadCSV);

    // Warn user before leaving with unsaved changes
    window.addEventListener('beforeunload', (event) => {
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = ''; // Required for most browsers
        }
    });
});
