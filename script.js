// Global variable to hold all bill data
let billData = [];
const MONTH_HEADERS = ['၁-လပိုင်း', '၂-လပိုင်း', '၃-လပိုင်း', '၄-လပိုင်း', '၅-လပိုင်း', '၆-လပိုင်း', '၇-လပိုင်း', '၈-လပိုင်း', '၉-လပိုင်း', '၁၀-လပိုင်း', '၁၁-လပိုင်း', '၁၂-လပိုင်း'];

// Function to parse CSV text into an array of objects
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
    return data.filter(record => record['စဉ်'] && !record['စဉ်'].includes('စုစုပေါင်း')); // Filter out the total row
}

// Function to find the last paid month and its amount
function findLastPaidDetails(record) {
    for (let i = MONTH_HEADERS.length - 1; i >= 0; i--) {
        const month = MONTH_HEADERS[i];
        if (record[month] && record[month].trim() !== '') {
            return { month: month, amount: record[month] };
        }
    }
    return { month: "မတွေ့ရှိပါ", amount: "-" };
}

// Function to calculate and display summary information
function displaySummary(data) {
    const summaryContainer = document.getElementById('summary-info');
    
    // 1. Find the latest month with any data
    let latestMonth = '';
    for (let i = MONTH_HEADERS.length - 1; i >= 0; i--) {
        const month = MONTH_HEADERS[i];
        if (data.some(record => record[month] && record[month].trim() !== '')) {
            latestMonth = month;
            break;
        }
    }

    // 2. Calculate total for the latest month
    let latestMonthTotal = 0;
    if (latestMonth) {
        latestMonthTotal = data.reduce((sum, record) => {
            const amount = parseInt(record[latestMonth], 10) || 0;
            return sum + amount;
        }, 0);
    }

    // 3. Calculate total for the year from the 'စုပေါင်း' column
    const yearTotal = data.reduce((sum, record) => {
        const amount = parseInt(record['စုပေါင်း'], 10) || 0;
        return sum + amount;
    }, 0);

    // Format numbers with commas
    const formatNumber = (num) => num.toLocaleString('en-US');

    // 4. Display the summary
    summaryContainer.innerHTML = `
        <div class="summary-item">
            ယခုလ (${latestMonth || 'N/A'}) မီတာဘေလ် = <strong>${formatNumber(latestMonthTotal)} ကျပ်</strong>
        </div>
        <div class="summary-item">
            ယခုနှစ် (${new Date().getFullYear()}) မီတာဘေလ် = <strong>${formatNumber(yearTotal)} ကျပ်</strong>
        </div>
    `;
}

// Function to display data in a table
function displayTable(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; 

    if (data.length === 0) {
        resultsContainer.innerHTML = '<p>ရှာဖွေမှုနှင့် ကိုက်ညီသော အချက်အလက် မရှိပါ။</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const displayHeaders = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'နောက်ဆုံးဘေလ်ဆောင်လ', 'ဘေလ်ပမာဏ'];
    displayHeaders.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    data.forEach(record => {
        const lastPaid = findLastPaidDetails(record);
        const row = tbody.insertRow();
        
        row.insertCell().textContent = record['စဉ်'] || '-';
        row.insertCell().textContent = record['ကျောင်း'] || '-';
        row.insertCell().textContent = record['စာရင်းအမှတ်'] || '-';
        row.insertCell().textContent = record['မီတာအမှတ်'] || '-';
        row.insertCell().textContent = lastPaid.month;
        row.insertCell().textContent = (parseInt(lastPaid.amount, 10) || 0).toLocaleString('en-US');
    });

    resultsContainer.appendChild(table);
}

// Main search function
function searchBill() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filteredData = query === '' ? billData : billData.filter(record => {
        return Object.values(record).some(value => 
            value && value.toLowerCase().includes(query)
        );
    });
    displayTable(filteredData);
}

function exportToPdf() {
    window.print();
}

// Load data and initialize the page
window.onload = async () => {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        billData = parseCSV(csvText);
        
        displaySummary(billData); // Display the summary first
        displayTable(billData);   // Then display the full table
        
    } catch (error) {
        console.error("CSV ဖိုင်ကို ဖတ်မရပါ:", error);
        document.getElementById('results').innerText = "ဒေတာဖိုင်ကို ဖတ်ရှုရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။";
    }
};
