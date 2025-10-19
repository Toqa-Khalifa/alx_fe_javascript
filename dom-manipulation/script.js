// === Initialize or Load Quotes from Local Storage ===
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
];

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");
const conflictNotice = document.getElementById("conflictNotice");

// === Save Quotes to Local Storage ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Display Random Quote ===
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
  sessionStorage.setItem("lastQuote", quoteDisplay.textContent);
}

// === Add New Quote ===
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category!");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  postQuoteToServer(newQuote); // post to mock API
  alert("Quote added and synced to server!");
}

// === Populate Categories ===
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  uniqueCategories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem("lastFilter");
  if (lastFilter) categoryFilter.value = lastFilter;
}

// === Filter Quotes ===
function filterQuotes() {
  localStorage.setItem("lastFilter", categoryFilter.value);
  showRandomQuote();
}

// === Export as JSON ===
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

// === Import from JSON ===
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch {
      alert("Invalid JSON file format.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// === Fetch Quotes from Server (Mock API) ===
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await response.json();

    // Convert server data to quote-like structure
    const serverQuotes = data.map(item => ({
      text: item.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    return [];
  }
}

// === Post New Quote to Server ===
async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    console.log("Quote posted to server:", quote);
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// === Sync Quotes with Server ===
async function syncQuotes() {
  showNotification("Syncing quotes with server...");

  const serverQuotes = await fetchQuotesFromServer();

  // Conflict resolution: server data takes precedence
  const localTexts = new Set(quotes.map(q => q.text));
  const newQuotes = serverQuotes.filter(q => !localTexts.has(q.text));

  if (newQuotes.length > 0) {
    quotes = [...quotes, ...newQuotes];
    saveQuotes();
    populateCategories();
    showNotification("New quotes synced from server!");
    conflictNotice.style.display = "none";
  } else {
    showNotification("No new quotes found on server.");
  }
}

// === Conflict Resolution Notification ===
function showConflictNotice() {
  conflictNotice.style.display = "block";
  conflictNotice.innerHTML = `
    <strong>Conflict detected!</strong> Some data was updated on the server.
    <button onclick="resolveConflict()">Resolve Now</button>
  `;
}

function resolveConflict() {
  conflictNotice.style.display = "none";
  syncQuotes();
}

// === Show Notifications ===
function showNotification(message) {
  notification.textContent = message;
  setTimeout(() => {
    notification.textContent = "";
  }, 3000);
}

// === Periodic Sync Every 30 Seconds ===
setInterval(syncQuotes, 30000);

// === Initialize App ===
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
document.getElementById("syncBtn").addEventListener("click", syncQuotes);

populateCategories();

const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) quoteDisplay.textContent = lastQuote;
