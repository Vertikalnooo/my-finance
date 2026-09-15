// ==========================================
// ЭЛЕМЕНТЫ СТРАНИЦЫ
// ==========================================

const form = document.getElementById("transactionForm");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");

const transactionsList = document.getElementById("transactionsList");

const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

const monthFilter = document.getElementById("monthFilter");

const monthIncomeElement = document.getElementById("monthIncome");
const monthExpenseElement = document.getElementById("monthExpense");
const monthBalanceElement = document.getElementById("monthBalance");

const filterButtons = document.querySelectorAll(".filter-button");

const expenseCanvas = document.getElementById("expenseChart");


// ==========================================
// ДАННЫЕ
// ==========================================

// Загружаем операции из localStorage
let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

// Текущий фильтр операций
let currentFilter = "all";

// ID операции, которую сейчас редактируем
let editingId = null;

// Объект графика
let expenseChart = null;

// Выбранный месяц
let selectedMonth = "";


// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

// Возвращает сегодняшнюю дату в формате YYYY-MM-DD
function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Возвращает текущий месяц в формате YYYY-MM
function getCurrentMonth() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}


// Форматирование суммы
function formatAmount(amount) {
    return Number(amount).toFixed(2);
}


// ==========================================
// НАЧАЛЬНЫЕ ЗНАЧЕНИЯ
// ==========================================

dateInput.value = getToday();

selectedMonth = getCurrentMonth();

monthFilter.value = selectedMonth;


// ==========================================
// СОХРАНЕНИЕ
// ==========================================

function saveTransactions() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

}


// ==========================================
// ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ
// ==========================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();
    const date = dateInput.value;


    // Проверка суммы
    if (!amount || amount <= 0) {
        alert("Введите корректную сумму.");

        amountInput.focus();

        return;
    }


    // Проверка даты
    if (!date) {
        alert("Выберите дату.");

        dateInput.focus();

        return;
    }


    // ==========================================
    // РЕДАКТИРОВАНИЕ
    // ==========================================

    if (editingId !== null) {

        const transaction = transactions.find(function(item) {

            return item.id === editingId;

        });


        if (transaction) {

            transaction.type = type;
            transaction.amount = amount;
            transaction.category = category;
            transaction.description = description;
            transaction.date = date;

        }


        editingId = null;

        submitButton.textContent = "Добавить";

        cancelButton.style.display = "none";

    }


    // ==========================================
    // НОВАЯ ОПЕРАЦИЯ
    // ==========================================

    else {

        const transaction = {

            id: Date.now(),

            type: type,

            amount: amount,

            category: category,

            description: description,

            date: date

        };


        transactions.push(transaction);

    }


    // Сохраняем
    saveTransactions();


    // Обновляем интерфейс
    renderTransactions();

    updateSummary();

    updateMonthSummary();

    updateExpenseChart();


    // Очищаем форму
    form.reset();


    // Возвращаем сегодняшнюю дату
    dateInput.value = getToday();

});


// ==========================================
// ОТОБРАЖЕНИЕ ОПЕРАЦИЙ
// ==========================================

function renderTransactions() {

    transactionsList.innerHTML = "";


    // Фильтруем операции
    const filteredTransactions =
        transactions.filter(function(transaction) {

            if (currentFilter === "all") {
                return true;
            }

            return transaction.type === currentFilter;

        });


    // Сортируем: новые сверху
    filteredTransactions.sort(function(a, b) {

        return new Date(b.date) - new Date(a.date);

    });


    // Если операций нет
    if (filteredTransactions.length === 0) {

        transactionsList.innerHTML = `
            <p class="empty">
                Операций пока нет
            </p>
        `;

        return;
    }


    // ==========================================
    // СОЗДАНИЕ ОПЕРАЦИЙ
    // ==========================================

    filteredTransactions.forEach(function(transaction) {

        const transactionElement =
            document.createElement("div");


        transactionElement.className = "transaction";


        const sign =
            transaction.type === "income"
                ? "+"
                : "-";


        transactionElement.innerHTML = `

            <div class="transaction-info">

                <span class="transaction-category">
                    ${escapeHTML(transaction.category)}
                </span>

                <span class="transaction-description">
                    ${transaction.description
                        ? escapeHTML(transaction.description)
                        : "Без описания"}
                </span>

                <span class="transaction-date">
                    ${transaction.date}
                </span>

            </div>


            <div>

                <span class="transaction-amount ${transaction.type}">
                    ${sign}${formatAmount(transaction.amount)} ₽
                </span>


                <button
                    type="button"
                    class="edit-button"
                    onclick="editTransaction(${transaction.id})"
                >
                    Изменить
                </button>


                <button
                    type="button"
                    class="delete-button"
                    onclick="deleteTransaction(${transaction.id})"
                >
                    Удалить
                </button>

            </div>

        `;


        transactionsList.appendChild(transactionElement);

    });

}


// ==========================================
// ЗАЩИТА ОТ HTML-КОДА
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// ОБЩАЯ СТАТИСТИКА
// ==========================================

function updateSummary() {

    let income = 0;

    let expense = 0;


    transactions.forEach(function(transaction) {

        const amount = Number(transaction.amount) || 0;


        if (transaction.type === "income") {

            income += amount;

        } else if (transaction.type === "expense") {

            expense += amount;

        }

    });


    const balance = income - expense;


    incomeElement.textContent =
        `${formatAmount(income)} ₽`;


    expenseElement.textContent =
        `${formatAmount(expense)} ₽`;


    balanceElement.textContent =
        `${formatAmount(balance)} ₽`;

}


// ==========================================
// СТАТИСТИКА ЗА МЕСЯЦ
// ==========================================

function updateMonthSummary() {

    let monthIncome = 0;

    let monthExpense = 0;


    // Если месяц не выбран
    if (!selectedMonth) {

        monthIncomeElement.textContent = "0.00 ₽";
        monthExpenseElement.textContent = "0.00 ₽";
        monthBalanceElement.textContent = "0.00 ₽";

        return;

    }


    // Операции выбранного месяца
    const monthTransactions =
        transactions.filter(function(transaction) {

            return transaction.date &&
                   transaction.date.startsWith(selectedMonth);

        });


    monthTransactions.forEach(function(transaction) {

        const amount = Number(transaction.amount) || 0;


        if (transaction.type === "income") {

            monthIncome += amount;

        } else if (transaction.type === "expense") {

            monthExpense += amount;

        }

    });


    const monthBalance =
        monthIncome - monthExpense;


    monthIncomeElement.textContent =
        `${formatAmount(monthIncome)} ₽`;


    monthExpenseElement.textContent =
        `${formatAmount(monthExpense)} ₽`;


    monthBalanceElement.textContent =
        `${formatAmount(monthBalance)} ₽`;

}


// ==========================================
// ГРАФИК РАСХОДОВ
// ==========================================

function updateExpenseChart() {

    // Если Chart.js или canvas отсутствует
    if (
        typeof Chart === "undefined" ||
        !expenseCanvas
    ) {
        return;
    }


    const categoryTotals = {};


    // Считаем расходы по категориям
    transactions.forEach(function(transaction) {

        if (transaction.type !== "expense") {
            return;
        }


        const category =
            transaction.category || "Другое";


        const amount =
            Number(transaction.amount) || 0;


        if (!categoryTotals[category]) {

            categoryTotals[category] = 0;

        }


        categoryTotals[category] += amount;

    });


    const labels =
        Object.keys(categoryTotals);


    const data =
        Object.values(categoryTotals);


    // Удаляем старый график
    if (expenseChart) {

        expenseChart.destroy();

        expenseChart = null;

    }


    // Если расходов нет
    if (labels.length === 0) {
        return;
    }


    // Создаём новый график
    expenseChart = new Chart(expenseCanvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [

                {

                    data: data,

                    backgroundColor: [

                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#dc2626",
                        "#9333ea",
                        "#0891b2"

                    ],

                    borderWidth: 0

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}


// ==========================================
// УДАЛЕНИЕ ОПЕРАЦИИ
// ==========================================

function deleteTransaction(id) {

    const transaction =
        transactions.find(function(item) {

            return item.id === id;

        });


    if (!transaction) {
        return;
    }


    const confirmed =
        confirm("Удалить эту операцию?");


    if (!confirmed) {
        return;
    }


    transactions =
        transactions.filter(function(item) {

            return item.id !== id;

        });


    // Если удаляемая операция была в режиме редактирования
    if (editingId === id) {

        editingId = null;

        form.reset();

        dateInput.value = getToday();

        submitButton.textContent = "Добавить";

        cancelButton.style.display = "none";

    }


    saveTransactions();

    renderTransactions();

    updateSummary();

    updateMonthSummary();

    updateExpenseChart();

}


// ==========================================
// РЕДАКТИРОВАНИЕ ОПЕРАЦИИ
// ==========================================

function editTransaction(id) {

    const transaction =
        transactions.find(function(item) {

            return item.id === id;

        });


    if (!transaction) {
        return;
    }


    editingId = id;


    typeInput.value =
        transaction.type;


    amountInput.value =
        transaction.amount;


    categoryInput.value =
        transaction.category;


    descriptionInput.value =
        transaction.description || "";


    dateInput.value =
        transaction.date;


    submitButton.textContent =
        "Сохранить изменения";


    cancelButton.style.display =
        "block";


    // Прокручиваем страницу к форме
    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    // Фокус на сумму
    amountInput.focus();

}


// ==========================================
// ОТМЕНА РЕДАКТИРОВАНИЯ
// ==========================================

cancelButton.addEventListener(
    "click",
    function() {

        editingId = null;


        form.reset();


        dateInput.value =
            getToday();


        submitButton.textContent =
            "Добавить";


        cancelButton.style.display =
            "none";

    }
);


// ==========================================
// ФИЛЬТРЫ
// ==========================================

filterButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            currentFilter =
                button.dataset.filter;


            // Убираем active со всех кнопок
            filterButtons.forEach(
                function(btn) {

                    btn.classList.remove("active");

                }
            );


            // Добавляем active выбранной
            button.classList.add("active");


            renderTransactions();

        }
    );

});


// ==========================================
// ВЫБОР МЕСЯЦА
// ==========================================

monthFilter.addEventListener(
    "change",
    function() {

        selectedMonth =
            monthFilter.value;


        updateMonthSummary();

    }
);


// ==========================================
// ЗАПУСК ПРИ ОТКРЫТИИ СТРАНИЦЫ
// ==========================================

renderTransactions();

updateSummary();

updateMonthSummary();

updateExpenseChart();

