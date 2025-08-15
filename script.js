// ဒေတာကို CSV ဖိုင်မှ ကြိုတင် load လုပ်ထားရန်
let billData = [];

// ဝဘ်ဆိုဒ်စဖွင့်ဖွင့်ချင်း CSV ဖိုင်ကို fetch လုပ်ပါ
window.onload = async () => {
    try {
        const response = await fetch('data.csv'); // သင်၏ CSV ဖိုင်အမည်
        const csvText = await response.text();
        // CSV text ကို array of objects အဖြစ်ပြောင်းပါ
        billData = parseCSV(csvText);
    } catch (error) {
        console.error("CSV ဖိုင်ကို ဖတ်မရပါ:", error);
        document.getElementById('results').innerText = "ဒေတာဖိုင်ကို ဖတ်ရှုရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။";
    }
};

// CSV text ကို JSON array format သို့ပြောင်းလဲပေးသော function
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i] ? values[i].trim() : '';
        });
        return obj;
    });
    return data;
}

// နောက်ဆုံးဘေလ်ဆောင်ထားသောလကို ရှာပေးသော function
function findLastPaidMonth(record) {
    const months = ['၁၂-လပိုင်း', '၁၁-လပိုင်း', '၁၀-လပိုင်း', '၉-လပိုင်း', '၈-လပိုင်း', '၇-လပိုင်း', '၆-လပိုင်း', '၅-လပိုင်း', '၄-လပိုင်း', '၃-လပိုင်း', '၂-လပိုင်း', '၁-လပိုင်း'];
    for (const month of months) {
        if (record[month] && record[month].trim() !== '') {
            return month;
        }
    }
    return "မတွေ့ရှိပါ";
}

// ရှာဖွေမှုပြုလုပ်သော အဓိက function
function searchBill() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // ရလဒ်အဟောင်းများကိုရှင်း

    if (query === '') {
        resultsContainer.innerHTML = '<p>ကျေးဇူးပြု၍ ရှာဖွေလိုသောအရာကို ရိုက်ထည့်ပါ။</p>';
        return;
    }

    const filteredData = billData.filter(record => {
        return record['အမည်']?.toLowerCase().includes(query) ||
               record['ကျောင်း']?.toLowerCase().includes(query) ||
               record['စာရင်းအမှတ်']?.toLowerCase().includes(query) ||
               record['မီတာအမှတ်']?.toLowerCase().includes(query);
    });

    if (filteredData.length > 0) {
        filteredData.forEach(record => {
            const lastPaidMonth = findLastPaidMonth(record);
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <p><strong>ကျောင်းအမည်:</strong> ${record['ကျောင်း']}</p>
                <p><strong>စာရင်းအမှတ်:</strong> ${record['စာရင်းအမှတ်']}</p>
                <p><strong>မီတာအမှတ်:</strong> ${record['မီတာအမှတ်']}</p>
                <p><strong>နောက်ဆုံးဘေလ်ဆောင်လ:</strong> ${lastPaidMonth}</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    } else {
        resultsContainer.innerHTML = '<p>ရှာဖွေမှုနှင့် ကိုက်ညီသော အချက်အလက် မရှိပါ။</p>';
    }
}
