// Global variables
let billData = [];
const MONTH_HEADERS = ['၁-လပိုင်း', '၂-လပိုင်း', '၃-လပိုင်း', '၄-လပိုင်း', '၅-လပိုင်း', '၆-လပိုင်း', '၇-လပိုင်း', '၈-လပိုင်း', '၉-လပိုင်း', '၁၀-လပိုင်း', '၁၁-လပိုင်း', '၁၂-လပိုင်း'];
const DISPLAY_HEADERS = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'နောက်ဆုံးဘေလ်ဆောင်လ', 'ဘေလ်ပမာဏ'];

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

function getLatestMonthWithData(data) {
    for (let i = MONTH_HEADERS.length - 1; i >= 0; i--) {
        const month = MONTH_HEADERS[i];
        if (data.some(record => record[month] && record[month].trim() !== '')) {
            return month;
        }
    }
    return null;
}

function findLastPaidDetails(record) {
    for (let i = MONTH_HEADERS.length - 1; i >= 0; i--) {
        const month = MONTH_HEADERS[i];
        if (record[month] && record[month].trim() !== '') {
            return { month: month, amount: record[month] };
        }
    }
    return { month: "မတွေ့ရှိပါ", amount: "-" };
}

// --- CORE LOGIC FUNCTIONS ---

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

function sortDataByDefault(data) {
    const latestMonth = getLatestMonthWithData(data);
    if (!latestMonth) return data; // No data to sort by

    return data.sort((a, b) => {
        const amountA = parseInt(convertMyanmarToEnglishNumbers(a[latestMonth] || '0'), 10);
        const amountB = parseInt(convertMyanmarToEnglishNumbers(b[latestMonth] || '0'), 10);
        return amountB - amountA; // Sort descending
    });
}

function applyFilters() {
    const filters = {};
    DISPLAY_HEADERS.forEach((header, index) => {
        const input = document.getElementById(`filter-${index}`);
        if (input) {
            filters[header] = input.value.toLowerCase();
        }
    });

    const filteredData = billData.filter(record => {
        const lastPaid = findLastPaidDetails(record);
        const recordAmount = (parseInt(convertMyanmarToEnglishNumbers(lastPaid.amount), 10) || 0).toString();

        const recordValues = {
            'စဉ်': record['စဉ်'],
            'ကျောင်း': record['ကျောင်း'],
            'စာရင်းအမှတ်': record['စာရင်းအမှတ်'],
            'မီတာအမှတ်': record['မီတာအမှတ်'],
            'နောက်ဆုံးဘေလ်ဆောင်လ': lastPaid.month,
            'ဘေလ်ပမာဏ': recordAmount
        };

        return Object.keys(filters).every(header => {
            const filterValue = filters[header];
            const recordValue = (recordValues[header] || '').toLowerCase();
            return recordValue.includes(filterValue);
        });
    });

    renderTableBody(filteredData);
}

// --- DISPLAY & RENDERING FUNCTIONS ---

function displaySummary(data) {
    const summaryContainer = document.getElementById('summary-info');
    const latestMonth = getLatestMonthWithData(data);

    let latestMonthTotal = 0;
    if (latestMonth) {
        latestMonthTotal = data.reduce((sum, record) => {
            const englishAmount = convertMyanmarToEnglishNumbers(record[latestMonth]);
            return sum + (parseInt(englishAmount, 10) || 0);
        }, 0);
    }

    const yearTotal = data.reduce((totalSum, record) => {
        let recordTotal = 0;
        MONTH_HEADERS.forEach(month => {
            if (record[month]) {
                const englishAmount = convertMyanmarToEnglishNumbers(record[month]);
                recordTotal += (parseInt(englishAmount, 10) || 0);
            }
        });
        return totalSum + recordTotal;
    }, 0);

    const formatNumber = (num) => num.toLocaleString('en-US');
    summaryContainer.innerHTML = `
        <div class="summary-item">ယခုလ (${latestMonth || 'N/A'}) မီတာဘေလ် = <strong>${formatNumber(latestMonthTotal)} ကျပ်</strong></div>
        <div class="summary-item">ယခုနှစ် (${new Date().getFullYear()}) မီတာဘေလ် = <strong>${formatNumber(yearTotal)} ကျပ်</strong></div>
    `;
}

function renderTableBody(data) {
    const tbody = document.querySelector('#bill-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    data.forEach(record => {
        const lastPaid = findLastPaidDetails(record);
        const row = tbody.insertRow();
        const englishAmount = convertMyanmarToEnglishNumbers(lastPaid.amount);
        const formattedAmount = (parseInt(englishAmount, 10) || 0).toLocaleString('en-US');

        row.insertCell().textContent = record['စဉ်'] || '-';
        row.insertCell().textContent = record['ကျောင်း'] || '-';
        row.insertCell().textContent = record['စာရင်းအမှတ်'] || '-';
        row.insertCell().textContent = record['မီတာအမှတ်'] || '-';
        row.insertCell().textContent = lastPaid.month;
        row.insertCell().textContent = formattedAmount;
    });
}

function displayTable(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    const table = document.createElement('table');
    table.id = 'bill-table';

    // Create Table Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    DISPLAY_HEADERS.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Create Filter Row
    const filterRow = thead.insertRow();
    filterRow.className = 'filter-row';
    DISPLAY_HEADERS.forEach((header, index) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `filter-${index}`;
        input.className = 'filter-input';
        input.placeholder = `${header} ဖြင့်ရှာရန်...`;
        input.onkeyup = applyFilters; // Call filter function on key press
        td.appendChild(input);
        filterRow.appendChild(td);
    });

    // Create Table Body (initially empty, will be filled by renderTableBody)
    table.createTBody();
    resultsContainer.appendChild(table);

    // Initial render of the body
    renderTableBody(data);
}

function exportToPdf() {
    window.print();
}

// --- INITIALIZATION ---

window.onload = async () => {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        billData = sortDataByDefault(parsedData); // Sort data by default and store it
        
        displaySummary(billData);
        displayTable(billData);
        
    } catch (error) {
        console.error("CSV ဖိုင်ကို ဖတ်မရပါ:", error);
        document.getElementById('results').innerText = "ဒေတာဖိုင်ကို ဖတ်ရှုရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။";
    }
};
