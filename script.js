// --- GLOBAL VARIABLES ---
let billData = [];
let isAdminLoggedIn = false;
const ADMIN_PASSWORD = "Ashin@135"; // Password changed as requested
const MONTH_HEADERS = ['၁-လပိုင်း', '၂-လပိုင်း', '၃-လပိုင်း', '၄-လပိုင်း', '၅-လပိုင်း', '၆-လပိုင်း', '၇-လပိုင်း', '၈-လပိုင်း', '၉-လပိုင်း', '၁၀-လပိုင်း', '၁၁-လပိုင်း', '၁၂-လပိုင်း'];
const DISPLAY_HEADERS = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'ရွေးချယ်ထားသောလ', 'ဘေလ်ပမာဏ'];

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
    if (typeof englishNumberStr !== 'string') return englishNumberStr;
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const myanmarNumbers = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    let result = englishNumberStr;
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
        if (data.some(rec => rec[month] && rec[month].trim() !== '')) return month;
    }
    return null;
}

// --- CSV FUNCTIONS ---
function parseCSV(text) {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
    return data.filter(record => record['စဉ်'] && !record['စဉ်'].includes('စုစုပေါင်း'));
}

function generateCSV(data) {
    const headers = ['စဉ်', 'အမည်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'ရည်ညွှန်း', ...MONTH_HEADERS, 'စုပေါင်း'];
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(record => {
        const row = headers.map(header => record[header] || '').join(',');
        csvContent += row + '\n';
    });
    
    return csvContent;
}

function downloadCSV(data) {
    const csvContent = generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'meter_bill_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- ADMIN FUNCTIONS ---
function showAdminModal() {
    document.getElementById('adminModal').style.display = 'block';
}

function hideAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function showAdminPanel() {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    generateBillEntryForm();
}

function hideAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    isAdminLoggedIn = false;
}

function generateBillEntryForm() {
    const container = document.getElementById('billEntryContainer');
    container.innerHTML = '';
    
    if (billData.length === 0) {
        container.innerHTML = '<p>ဒေတာများ မရှိပါ။ ကျေးဇူးပြု၍ data.csv ဖိုင်ကို စစ်ဆေးပါ။</p>';
        return;
    }
    
    billData.forEach((record, index) => {
        const row = document.createElement('div');
        row.className = 'bill-entry-row';
        // *** THIS IS THE CHANGED LINE ***
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
        if (input && record[selectedMonth]) {
            const amount = convertMyanmarToEnglishNumbers(record[selectedMonth]);
            input.value = amount || '';
        } else {
            input.value = ''; // Clear the input if no data for the month
        }
    });
}

function saveBillData() {
    const selectedMonth = document.getElementById('entryMonth').value;
    if (!selectedMonth) {
        alert('ကျေးဇူးပြု၍ လကို ရွေးချယ်ပါ။');
        return;
    }
    
    let hasChanges = false;
    billData.forEach((record, index) => {
        const input = document.getElementById(`bill_${index}`);
        if (input) {
            const newValue = input.value.trim();
            // Ensure only numbers are processed
            if (/^\d*$/.test(newValue)) {
                const myanmarValue = newValue ? convertEnglishToMyanmarNumbers(newValue) : '';
                if (record[selectedMonth] !== myanmarValue) {
                    record[selectedMonth] = myanmarValue;
                    hasChanges = true;
                }
            } else {
                alert(`"${record['ကျောင်း']}" အတွက် ထည့်သွင်းမှုသည် ဂဏန်းများသာ ဖြစ်ရပါမည်။`);
            }
        }
    });
    
    if (hasChanges) {
        alert(`${selectedMonth} အတွက် ဒေတာများကို သိမ်းပြီးပါပြီ။ CSV ဖိုင်ကို ဒေါင်းလုဒ်လုပ်ပြီး GitHub မှာ အပ်ဒိတ်လုပ်ပါ။`);
        // Refresh the main view
        displaySummary(billData);
        applyFiltersAndRender();
    } else {
        alert('ပြောင်းလဲမှုများ မရှိပါ။');
    }
}

// --- CORE LOGIC ---
function applyFiltersAndRender() {
    const schoolFilterValue = document.getElementById('filter-dropdown-ကျောင်း')?.value || '';
    const monthFilterValue = document.getElementById('filter-dropdown-လ')?.value || 'all';

    let filteredData = billData;
    if (schoolFilterValue) {
        filteredData = billData.filter(record => record['ကျောင်း'] === schoolFilterValue);
    }

    let tableData = filteredData.map(record => {
        let displayMonth = '';
        let displayAmount = 0;

        if (monthFilterValue === 'all') {
            displayMonth = 'လအားလုံး (စုစုပေါင်း)';
            displayAmount = MONTH_HEADERS.reduce((sum, month) => {
                return sum + (parseInt(convertMyanmarToEnglishNumbers(record[month] || '0'), 10) || 0);
            }, 0);
        } else {
            displayMonth = monthFilterValue;
            displayAmount = parseInt(convertMyanmarToEnglishNumbers(record[monthFilterValue] || '0'), 10) || 0;
        }

        return { ...record, displayMonth, displayAmount };
    });

    if (monthFilterValue !== 'all') {
        tableData.sort((a, b) => b.displayAmount - a.displayAmount);
    } else {
        tableData.sort((a, b) => {
            const seqA = parseInt(convertMyanmarToEnglishNumbers(a['စဉ်'] || '0'), 10);
            const seqB = parseInt(convertMyanmarToEnglishNumbers(b['စဉ်'] || '0'), 10);
            return seqA - seqB;
        });
    }

    renderTable(tableData);
}

// --- DISPLAY & RENDERING FUNCTIONS ---
function displaySummary(data) {
    const summaryContainer = document.getElementById('summary-info');
    const latestMonthWithData = getLatestMonthWithData(data);
    
    let latestMonthTotal = 0;
    if (latestMonthWithData) {
        latestMonthTotal = data.reduce((sum, record) => sum + (parseInt(convertMyanmarToEnglishNumbers(record[latestMonthWithData] || '0'), 10) || 0), 0);
    }
    
    const yearTotal = data.reduce((totalSum, record) => {
        return totalSum + MONTH_HEADERS.reduce((recordTotal, month) => recordTotal + (parseInt(convertMyanmarToEnglishNumbers(record[month] || '0'), 10) || 0), 0);
    }, 0);

    summaryContainer.innerHTML = `
        <div class="summary-item">နောက်ဆုံးလ (${latestMonthWithData || 'N/A'}) စုစုပေါင်း = <strong>${formatNumber(latestMonthTotal)} ကျပ်</strong></div>
        <div class="summary-item">ယခုနှစ် စုစုပေါင်း = <strong>${formatNumber(yearTotal)} ကျပ်</strong></div>
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
        row.insertCell().textContent = record['စာရင်းအမှတ်'] || '-';
        row.insertCell().textContent = record['မီတာအမှတ်'] || '-';
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
    if (latestMonth) {
        monthFilter.value = latestMonth;
    }
    monthFilter.onchange = applyFiltersAndRender;
    monthTd.appendChild(monthFilter);

    filterRow.insertCell();

    table.createTBody();
    resultsContainer.appendChild(table);
}

function exportToPdf() {
    window.print();
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}. 'data.csv' ဖိုင်ကို ရှာမတွေ့ပါ သို့မဟုတ် folder တစ်ခုတည်းတွင် မရှိပါ။`);
        }
        const csvText = await response.text();
        billData = parseCSV(csvText);

        if (billData.length === 0) {
            throw new Error("'data.csv' ဖိုင်ထဲတွင် အချက်အလက်မရှိပါ သို့မဟုတ် format မှားယွင်းနေပါသည်။");
        }
        
        const latestMonth = getLatestMonthWithData(billData);
        
        displaySummary(billData);
        setupFiltersAndTable(billData, latestMonth);
        applyFiltersAndRender();
        
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('results').innerHTML = `<p style="color: red; font-weight: bold;">Error: ${error.message}</p>`;
    }

    // Admin button event listener
    document.getElementById('adminBtn').addEventListener('click', showAdminModal);

    // Modal close event listeners
    document.querySelector('.close').addEventListener('click', hideAdminModal);
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('adminModal')) {
            hideAdminModal();
        }
    });

    // Admin login form
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        if (password === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            hideAdminModal();
            showAdminPanel();
        } else {
            alert('မှားယွင်းသော password ဖြစ်ပါသည်။');
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', hideAdminPanel);

    // Load data button
    document.getElementById('loadDataBtn').addEventListener('click', loadCurrentMonthData);

    // Data entry form
    document.getElementById('dataEntryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBillData();
    });

    // Download CSV button
    document.getElementById('downloadCsvBtn').addEventListener('click', () => {
        downloadCSV(billData);
    });
});
