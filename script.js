// --- GLOBAL VARIABLES ---
let billData = [];
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

// --- CORE LOGIC ---
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
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

function applyFiltersAndRender() {
    const schoolFilterValue = document.getElementById('filter-dropdown-ကျောင်း').value;
    const monthFilterValue = document.getElementById('filter-dropdown-လ').value;

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
    tbody.innerHTML = ''; // Clear existing rows

    dataToRender.forEach((record, index) => {
        const row = tbody.insertRow();
        
        row.insertCell().textContent = index + 1; 
        
        row.insertCell().textContent = record['ကျောင်း'] || '-';
        row.insertCell().textContent = record['စာရင်းအမှတ်'] || '-';
        row.insertCell().textContent = record['မီတာအမှတ်'] || '-';
        row.insertCell().textContent = record.displayMonth;
        row.insertCell().textContent = formatNumber(record.displayAmount);
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
    
    filterRow.insertCell(); // စဉ်
    
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

    filterRow.insertCell(); // စာရင်းအမှတ်
    filterRow.insertCell(); // မီတာအမှတ်

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

    filterRow.insertCell(); // ဘေလ်ပမာဏ

    table.createTBody();
    resultsContainer.appendChild(table);
}

function exportToPdf() {
    window.print();
}

// --- INITIALIZATION ---
window.onload = async () => {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        billData = parseCSV(csvText);
        
        const latestMonth = getLatestMonthWithData(billData);
        
        displaySummary(billData);
        setupFiltersAndTable(billData, latestMonth);
        applyFiltersAndRender();
        
    } catch (error) {
        console.error("CSV ဖိုင်ကို ဖတ်မရပါ:", error);
        document.getElementById('results').innerText = "ဒေတာဖိုင်ကို ဖတ်ရှုရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။";
    }
};
