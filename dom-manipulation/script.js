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

// === Local Storage Helpers ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Show Random Quote (Based on Filter) ===
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  quoteDisplay.textContent = `"${filteredQuotes[randomIndex].text}" — ${filteredQuotes[randomIndex].category}`;
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

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
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

// === Server Sync Simulation ===
async function syncWithServer() {
  showNotification("Syncing with server...");

  try {
    // Simulate fetch from server
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
    const serverData = await response.json();

    // Convert fetched posts to quote-like objects
    const serverQuotes = serverData.map(item => ({
      text: item.title,
      category: "Server"
    }));

    // Conflict resolution: server data takes precedence
    const localTexts = new Set(quotes.map(q => q.text));
    const newServerQuotes = serverQuotes.filter(q => !localTexts.has(q.text));

    if (newServerQuotes.length > 0) {
      quotes = [...quotes, ...newServerQuotes];
      saveQuotes();
      populateCategories();
      showNotification("New quotes synced from server!");
      conflictNotice.style.display = "none";
    } else {
      showNotification("No new updates from server.");
    }
  } catch (error) {
    showNotification("Error syncing with server.");
    console.error(error);
  }
}

// === Conflict Resolution Notice ===
function showConflictNotice() {
  conflictNotice.style.display = "block";
  conflictNotice.innerHTML = `
    <strong>Conflict detected!</strong> Some data was updated on the server.
    <button onclick="resolveConflict()">Resolve Now</button>
  `;
}

function resolveConflict() {
  conflictNotice.style.display = "none";
  syncWithServer();
}

// === Notification Display ===
function showNotification(message) {
  notification.textContent = message;
  setTimeout(() => {
    notification.textContent = "";
  }, 3000);
}

// === Periodic Sync (Every 30 seconds) ===
setInterval(syncWithServer, 30000);

// === Initialize ===
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
document.getElementById("syncBtn").addEventListener("click", syncWithServer);

populateCategories();

const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) quoteDisplay.textContent = lastQuote;
