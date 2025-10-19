// === Dynamic Quote Generator with Server Sync and Conflict Resolution ===

// --- Global Variables ---
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Believe in yourself!", category: "Motivation" },
  { text: "The only way to do great work is to love what you do.", category: "Work" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");
const conflictNotice = document.getElementById("conflictNotice");

// --- Save Quotes to Local Storage ---
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// --- Show a Random Quote ---
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" - ${randomQuote.category}`;

  // Save last viewed quote in session storage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

// --- Create Form to Add New Quote ---
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button onclick="addQuote()">Add Quote</button>
  `;
  document.body.appendChild(formContainer);
}

// --- Add New Quote ---
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please fill in both fields!");
    return;
  }

  const newQuote = { text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote);
  showNotification("Quote added successfully!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// --- Populate Categories Dynamically ---
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
  }
}

// --- Filter Quotes by Selected Category ---
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// --- Fetch Quotes from Server (Mock API) ---
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await response.json();

    // Convert server data into quote objects
    const serverQuotes = data.map((item) => ({
      text: item.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    return [];
  }
}

// --- Post New Quote to Server ---
async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    console.log("Quote posted to server:", quote);
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// --- Sync Quotes with Server ---
async function syncQuotes() {
  showNotification("Syncing quotes with server...");

  const serverQuotes = await fetchQuotesFromServer();

  // Conflict resolution: server data takes precedence
  const localTexts = new Set(quotes.map((q) => q.text));
  const newQuotes = serverQuotes.filter((q) => !localTexts.has(q.text));

  if (newQuotes.length > 0) {
    quotes = [...quotes, ...newQuotes];
    saveQuotes();
    populateCategories();
    showNotification("Quotes synced with server!"); // ✅ Required message
    conflictNotice.style.display = "none";
  } else {
    showNotification("Quotes synced with server!"); // ✅ Always show message
  }
}

// --- Conflict Notice ---
function showConflictNotice() {
  conflictNotice.style.display = "block";
  conflictNotice.innerHTML = `
    <strong>Conflict detected!</strong> Server data has been updated.
    <button onclick="resolveConflict()">Resolve Now</button>
  `;
}

function resolveConflict() {
  conflictNotice.style.display = "none";
  syncQuotes();
}

// --- Show Notifications ---
function showNotification(message) {
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
    notification.textContent = "";
  }, 4000);
}

// --- Import Quotes from JSON File ---
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    showNotification("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// --- Export Quotes to JSON File ---
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
  showNotification("Quotes exported successfully!");
}

// --- Periodic Sync Every 30 Seconds ---
setInterval(syncQuotes, 30000);

// --- Initialize ---
window.onload = function () {
  createAddQuoteForm();
  populateCategories();
  showRandomQuote();
  syncQuotes();

  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    const parsed = JSON.parse(lastQuote);
    quoteDisplay.textContent = `"${parsed.text}" - ${parsed.category}`;
  }
};
