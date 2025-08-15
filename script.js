// Global variable to hold all bill data
let billData = [];
let tableHeaders = [];

// Function to parse CSV text into an array of objects
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    tableHeaders = headers; // Store headers for later use

    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
    return data;
}

// Function to find the last paid month and its amount
function findLastPaidDetails(record) {
    // Search from month 12 down to 1
    const months = ['၁၂-လပိုင်း', '၁၁-လပိုင်း', '၁၀-လပိုင်း', '၉-လပိုင်း', '၈-လပိုင်း', '၇-လပိုင်း', '၆-လပိုင်း', '၅-လပိုင်း', '၄-လပိုင်း', '၃-လပိုင်း', '၂-လပိုင်း', '၁-လပိုင်း'];
    for (const month of months) {
        // Check if the month exists as a header and has a value
        if (record[month] && record[month].trim() !== '') {
            return { month: month, amount: record[month] };
        }
    }
    return { month: "မတွေ့ရှိပါ", amount: "-" };
}

// Function to display data in a table
function displayTable(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (data.length === 0) {
        resultsContainer.innerHTML = '<p>ရှာဖွေမှုနှင့် ကိုက်ညီသော အချက်အလက် မရှိပါ။</p>';
        return;
    }

    const table = document.createElement('table');
    
    // Create Table Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const displayHeaders = ['စဉ်', 'ကျောင်း', 'စာရင်းအမှတ်', 'မီတာအမှတ်', 'နောက်ဆုံးဘေလ်ဆောင်လ', 'ဘေလ်ပမာဏ'];
    displayHeaders.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Create Table Body
    const tbody = table.createTBody();
    data.forEach(record => {
        // Skip the summary row if it exists
        if (record['စဉ်'] && record['စဉ်'].includes('စုစုပေါင်း')) return;

        const lastPaid = findLastPaidDetails(record);
        const row = tbody.insertRow();
        
        row.insertCell().textContent = record['စဉ်'] || '-';
        row.insertCell().textContent = record['ကျောင်း'] || '-';
        row.insertCell().textContent = record['စာရင်းအမှတ်'] || '-';
        row.insertCell().textContent = record['မီတာအမှတ်'] || '-';
        row.insertCell().textContent = lastPaid.month;
        row.insertCell().textContent = lastPaid.amount;
    });

    resultsContainer.appendChild(table);
}

// Main search function
function searchBill() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();

    // If search query is empty, show all data
    if (query === '') {
        displayTable(billData);
        return;
    }

    const filteredData = billData.filter(record => {
        // Check if any value in the record contains the query
        return Object.values(record).some(value => 
            value && value.toLowerCase().includes(query)
        );
    });

    displayTable(filteredData);
}

// Function to handle PDF export
function exportToPdf() {
    // This command opens the browser's print dialog
    window.print();
}

// Load data and display the full table when the page loads
window.onload = async () => {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        billData = parseCSV(csvText);
        displayTable(billData); // Display the full table initially
    } catch (error) {
        console.error("CSV ဖိုင်ကို ဖတ်မရပါ:", error);
        document.getElementById('results').innerText = "ဒေတာဖိုင်ကို ဖတ်ရှုရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။";
    }
};
