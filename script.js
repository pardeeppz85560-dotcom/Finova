const STORAGE_KEY = "finova-demo-state-v1";

const initialState = {
  balance: 248560,
  transactions: [
    {
      id: "FN-2401", name: "Salary Deposit",
      reference: "Monthly salary", category: "Income",
      date: "2026-10-21", amount: 72000,
      type: "income", status: "Completed",
      icon: "↙", tone: "green"
    },
    {
      id: "FN-2402", name: "Amazon India",
      reference: "Online purchase", category: "Shopping",
      date: "2026-10-20", amount: 2499,
      type: "expense", status: "Completed",
      icon: "a", tone: "orange"
    },
    {
      id: "FN-2403", name: "Electricity Bill",
      reference: "Utility payment", category: "Utilities",
      date: "2026-10-19", amount: 1840,
      type: "expense", status: "Completed",
      icon: "ϟ", tone: "blue"
    },
    {
      id: "FN-2404", name: "Rahul Sharma",
      reference: "UPI transfer received", category: "Transfer",
      date: "2026-10-18", amount: 3500,
      type: "income", status: "Completed",
      icon: "R", tone: "purple"
    },
    {
      id: "FN-2405", name: "Cafe Coffee Day",
      reference: "Food and beverage", category: "Food",
      date: "2026-10-17", amount: 620,
      type: "expense", status: "Completed",
      icon: "☕", tone: "pink"
    },
    {
      id: "FN-2406", name: "Netflix",
      reference: "Monthly subscription", category: "Entertainment",
      date: "2026-10-16", amount: 649,
      type: "expense", status: "Completed",
      icon: "N", tone: "orange"
    },
    {
      id: "FN-2407", name: "Freelance Project",
      reference: "Client payment", category: "Income",
      date: "2026-10-14", amount: 14400,
      type: "income", status: "Completed",
      icon: "↙", tone: "green"
    },
    {
      id: "FN-2408", name: "Grocery Store",
      reference: "Weekly groceries", category: "Shopping",
      date: "2026-10-12", amount: 2150,
      type: "expense", status: "Completed",
      icon: "▦", tone: "blue"
    }
  ]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let state = loadState();
let cardFrozen = false;
let cardRevealed = false;
let noticeTimer;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        Number.isFinite(parsed.balance) &&
        Array.isArray(parsed.transactions)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Unable to load saved demo data:", error);
  }

  return JSON.parse(JSON.stringify(initialState));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save demo data:", error);
    showNotice("Browser storage is unavailable. Changes may not persist.");
  }
}

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function shortMoney(amount) {
  return "₹" + new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showNotice(message) {
  const notice = $("#notice");

  notice.textContent = message;
  notice.classList.add("show");

  clearTimeout(noticeTimer);

  noticeTimer = setTimeout(() => {
    notice.classList.remove("show");
  }, 4500);
}

function getMonthlyTotals() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentTransactions = state.transactions.filter(transaction =>
    transaction.date.startsWith(currentMonth)
  );

  const income = currentTransactions
    .filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const expenses = currentTransactions
    .filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return { income, expenses };
}

function renderSummary() {
  const { income, expenses } = getMonthlyTotals();

  $("#balance").textContent = money(state.balance);
  $("#income").textContent = shortMoney(income);
  $("#expenses").textContent = shortMoney(expenses);

  $("#netFlow").innerHTML =
    `${income - expenses >= 0 ? "+" : "−"}${shortMoney(
      Math.abs(income - expenses)
    )}<small>net cash flow this month</small>`;
}

function renderTransactions() {
  const searchTerm = $("#searchInput").value.trim().toLowerCase();
  const filter = $("#filterSelect").value;

  const transactions = [...state.transactions]
    .filter(transaction => {
      const searchable = [
        transaction.id,
        transaction.name,
        transaction.reference,
        transaction.category,
        transaction.status
      ].join(" ").toLowerCase();

      const matchesSearch = searchable.includes(searchTerm);
      const matchesFilter =
        filter === "all" || transaction.type === filter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const rows = transactions.map(transaction => {
    const date = new Date(
      `${transaction.date}T12:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const amountSign =
      transaction.type === "income" ? "+" : "−";

    return `
      <tr>
        <td>
          <div class="merchant">
            <div class="merchant-icon ${escapeHTML(transaction.tone || "blue")}">
              ${escapeHTML(transaction.icon || "•")}
            </div>
            <div class="merchant-copy">
              <strong>${escapeHTML(transaction.name)}</strong>
              <small>${escapeHTML(transaction.reference || transaction.id)}</small>
            </div>
          </div>
        </td>

        <td>${date}</td>

        <td>${escapeHTML(transaction.category)}</td>

        <td>
          <span class="status-tag ${
            transaction.status === "Pending" ? "pending" : ""
          }">${escapeHTML(transaction.status)}</span>
        </td>

        <td class="amount ${
          transaction.type === "income" ? "credit" : ""
        }">${amountSign}${money(transaction.amount)}</td>
      </tr>
    `;
  }).join("");

  $("#transactionRows").innerHTML = rows ||
    `<tr><td colspan="5" class="empty-row">
      No matching transactions found.
    </td></tr>`;

  $("#resultCount").textContent =
    `Showing ${transactions.length} of ${state.transactions.length} transactions`;
}

/* Illustrative cash-flow chart */
const chartData = {
  6: [
    { month: "May", income: 55, expense: 32 },
    { month: "Jun", income: 68, expense: 42 },
    { month: "Jul", income: 58, expense: 35 },
    { month: "Aug", income: 78, expense: 49 },
    { month: "Sep", income: 66, expense: 38 },
    { month: "Oct", income: 91, expense: 48 }
  ],
  4: [
    { month: "Jul", income: 58, expense: 35 },
    { month: "Aug", income: 78, expense: 49 },
    { month: "Sep", income: 66, expense: 38 },
    { month: "Oct", income: 91, expense: 48 }
  ],
  3: [
    { month: "Aug", income: 78, expense: 49 },
    { month: "Sep", income: 66, expense: 38 },
    { month: "Oct", income: 91, expense: 48 }
  ]
};

function renderChart() {
  const selectedPeriod = $("#chartPeriod").value;
  const data = chartData[selectedPeriod] || chartData[6];

  const width = 600;
  const height = 170;
  const left = 18;
  const right = 12;
  const top = 12;
  const bottom = 27;

  const plotHeight = height - top - bottom;
  const groupWidth = (width - left - right) / data.length;
  const barWidth = Math.min(19, groupWidth * 0.24);
  const maxValue = 100;

  let grid = "";

  [0, 25, 50, 75, 100].forEach(value => {
    const y = top + plotHeight - value / maxValue * plotHeight;

    grid += `
      <line
        x1="${left}" y1="${y}"
        x2="${width - right}" y2="${y}"
        stroke="#edf0f6"
        stroke-dasharray="3 4"
      />
    `;
  });

  let bars = "";

  data.forEach((item, index) => {
    const center = left + groupWidth * index + groupWidth / 2;

    const incomeHeight = item.income / maxValue * plotHeight;
    const expenseHeight = item.expense / maxValue * plotHeight;

    bars += `
      <rect
        x="${center - barWidth - 2}"
        y="${top + plotHeight - incomeHeight}"
        width="${barWidth}"
        height="${incomeHeight}"
        rx="4"
        fill="#6177f1"
      >
        <title>${item.month} income index: ${item.income}</title>
      </rect>

      <rect
        x="${center + 2}"
        y="${top + plotHeight - expenseHeight}"
        width="${barWidth}"
        height="${expenseHeight}"
        rx="4"
        fill="#a4dfcb"
      >
        <title>${item.month} expense index: ${item.expense}</title>
      </rect>

      <text
        x="${center}"
        y="${height - 7}"
        text-anchor="middle"
        fill="#99a2b2"
        font-size="10"
      >${item.month}</text>
    `;
  });

  $("#chart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}"
      role="img" aria-label="Illustrative income and expense chart">
      ${grid}
      ${bars}
    </svg>
  `;
}

/* Modal controls */
function openModal(modalId) {
  const modal = document.getElementById(modalId);

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const firstInput = modal.querySelector("input, button, select");

  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  if (!$(".modal-backdrop.open")) {
    document.body.style.overflow = "";
  }
}

function showInfo(title, message) {
  $("#infoTitle").textContent = title;
  $("#infoText").textContent = message;

  openModal("infoModal");
}

/* Dashboard page navigation */
function setPage(page) {
  $$(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("#breadcrumb").textContent = page;

  const titles = {
    Overview: "Good afternoon, Pardeep ✦",
    Transactions: "Transactions",
    Cards: "My Cards",
    Analytics: "Analytics",
    Payments: "Payments",
    Settings: "Settings",
    Help: "Help Center"
  };

  const subtitles = {
    Overview: "Here's your financial snapshot for today.",
    Transactions: "Review and filter your account activity.",
    Cards: "Manage your virtual demo card.",
    Analytics: "Explore your illustrative cash-flow overview.",
    Payments: "Create a simulated transfer in your demo account.",
    Settings: "Manage your local demo preferences.",
    Help: "Information about this banking demonstration."
  };

  $("#pageTitle").textContent =
    titles[page] || "FINOVA Dashboard";

  $("#pageSubtitle").textContent =
    subtitles[page] || "Explore your demo account.";

  if (page === "Transactions") {
    $("#searchInput").focus({ preventScroll: true });
    $("#transactionsPanel").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } else if (page === "Cards") {
    $("#bankCard").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  } else if (page === "Analytics") {
    $("#chart").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  } else if (page === "Payments") {
    openModal("transferModal");
  } else if (page === "Settings") {
    showInfo(
      "Demo settings",
      "This project stores its demo transactions in your browser. No real bank account is connected."
    );
  } else if (page === "Help") {
    showInfo(
      "FINOVA Help Center",
      "Use Transfer Money to record a simulated debit. Search and filter transactions, manage the virtual card, and export records as CSV."
    );
  }
}

/* Simulated money transfer */
$("#transferForm").addEventListener("submit", event => {
  event.preventDefault();

  const recipient = $("#recipient").value.trim();
  const reference = $("#reference").value.trim();
  const amount = Number($("#amount").value);
  const category = $("#category").value;
  const note = $("#note").value.trim();

  if (!recipient || !reference) {
    showNotice("Please enter the recipient name and demo reference.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    showNotice("Enter a valid amount between ₹1 and ₹10,00,000.");
    return;
  }

  if (amount > state.balance) {
    showNotice("Insufficient demo balance. Try a smaller amount.");
    return;
  }

  const transaction = {
    id: "FN-" + Date.now().toString().slice(-8),
    name: recipient,
    reference: note || reference,
    category,
    date: new Date().toISOString().slice(0, 10),
    amount: Math.round(amount * 100) / 100,
    type: "expense",
    status: "Completed",
    icon: recipient.charAt(0).toUpperCase(),
    tone: "purple"
  };

  state.balance =
    Math.round((state.balance - transaction.amount) * 100) / 100;

  state.transactions.unshift(transaction);

  saveState();
  renderAll();

  closeModal($("#transferModal"));
  $("#transferForm").reset();

  showNotice(
    `Demo transfer of ${money(amount)} to ${recipient} recorded. No real money was sent.`
  );
});

/* Virtual demo card */
function updateCard() {
  $("#bankCard").classList.toggle("frozen", cardFrozen);

  $("#freezeCard").innerHTML =
    `❄ <span>${cardFrozen ? "Unfreeze card" : "Freeze card"}</span>`;

  $("#cardStatus").innerHTML = `
    <i></i>
    Card is ${cardFrozen ? "frozen" : "active"}
    <span>Demo card</span>
  `;

  $("#cardStatus").style.color =
    cardFrozen ? "#bf8750" : "#3b9a73";

  $("#cardStatus i").style.background =
    cardFrozen ? "#dca25b" : "#35b783";

  $("#cardNumber").innerHTML = cardRevealed
    ? "4532 &nbsp; 9012 &nbsp; 6784 &nbsp; 4829"
    : "•••• &nbsp; •••• &nbsp; •••• &nbsp; 4829";

  $("#revealCard").innerHTML =
    `◉ <span>${cardRevealed ? "Hide details" : "Show details"}</span>`;
}

$("#freezeCard").addEventListener("click", () => {
  cardFrozen = !cardFrozen;
  updateCard();

  showNotice(
    cardFrozen
      ? "Demo card frozen. This only changes the card preview."
      : "Demo card unfrozen."
  );
});

$("#revealCard").addEventListener("click", () => {
  cardRevealed = !cardRevealed;
  updateCard();
});

/* Export transactions to CSV */
function exportCSV() {
  const rows = [
    [
      "Transaction ID",
      "Name",
      "Reference",
      "Category",
      "Date",
      "Type",
      "Status",
      "Amount INR"
    ],
    ...state.transactions.map(transaction => [
      transaction.id,
      transaction.name,
      transaction.reference,
      transaction.category,
      transaction.date,
      transaction.type,
      transaction.status,
      transaction.amount
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "finova-demo-transactions.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showNotice("Your transaction report has been exported.");
}

/* Event listeners */
$("#openTransfer").addEventListener("click", () => {
  openModal("transferModal");
});

$("#exportBtn").addEventListener("click", exportCSV);

$("#searchInput").addEventListener("input", renderTransactions);
$("#filterSelect").addEventListener("change", renderTransactions);
$("#chartPeriod").addEventListener("change", renderChart);

$("#clearFilters").addEventListener("click", () => {
  $("#searchInput").value = "";
  $("#filterSelect").value = "all";
  renderTransactions();
});

$("#notificationBtn").addEventListener("click", () => {
  showInfo(
    "Notifications",
    "You are all caught up. This demo is not connected to any real bank notification service."
  );
});

$("#profileBtn").addEventListener("click", () => {
  showInfo(
    "Personal demo account",
    "Profile: Pardeep Kumar. This is a sample college project account, not a verified banking identity."
  );
});

$("#supportBtn").addEventListener("click", () => {
  showInfo(
    "FINOVA Support",
    "This is a front-end project demo. Use the Help Center to review the available demo features."
  );
});

$$("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    setPage(button.dataset.page);
    $("#sidebar").classList.remove("open");
  });
});

$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal-backdrop"));
  });
});

$$(".modal-backdrop").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $$(".modal-backdrop.open").forEach(closeModal);
  }
});

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.add("open");
});

$("#closeMenu").addEventListener("click", () => {
  $("#sidebar").classList.remove("open");
});

document.addEventListener("click", event => {
  if (
    window.innerWidth <= 760 &&
    $("#sidebar").classList.contains("open") &&
    !$("#sidebar").contains(event.target) &&
    !$("#menuToggle").contains(event.target)
  ) {
    $("#sidebar").classList.remove("open");
  }
});

/* Initial rendering */
function renderAll() {
  renderSummary();
  renderTransactions();
  renderChart();
  updateCard();
}

renderAll();