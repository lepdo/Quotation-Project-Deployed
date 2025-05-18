const elements = {
    cardGrid: document.getElementById('card-grid'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    suggestions: document.getElementById('suggestions'),
    categoryFilter: document.getElementById('category-filter'),
    skuFilter: document.getElementById('sku-filter'),
    dateFrom: document.getElementById('date-from'),
    dateTo: document.getElementById('date-to'),
    resetFiltersBtn: document.getElementById('reset-filters'),
    detailModal: document.getElementById('detail-modal'),
    modalImg: document.getElementById('modal-img'),
    modalTitle: document.getElementById('modal-title'),
    modalSku: document.getElementById('modal-sku'),
    modalCategory: document.getElementById('modal-category'),
    modalDate: document.getElementById('modal-date'),
    metalTableBody: document.querySelector('#metal-table tbody'),
    diamondTableBody: document.querySelector('#diamond-table tbody'),
    modalMetalAmount: document.getElementById('modal-metal-amount'),
    modalMakingCharges: document.getElementById('modal-making-charges'),
    modalPurities: document.getElementById('modal-purities'),
    modalDiamondAmount: document.getElementById('modal-diamond-amount'),
    modalFinalQuotation: document.getElementById('modal-final-quotation'),
    summaryTableBody: document.querySelector('#summary-table tbody'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalDeleteBtn: document.getElementById('modal-delete-btn'),
    modalCloseX: document.getElementById('modal-close-x'),
    toast: document.getElementById('toast'),
    confirmationDialog: document.getElementById('confirmation-dialog'),
    confirmDelete: document.getElementById('confirm-delete'),
    cancelDelete: document.getElementById('cancel-delete'),
    themeToggle: document.getElementById('theme-toggle')
};

let quotations = [];
let currentQuotation = null;

async function init() {
    await fetchQuotations();
    populateCategoryFilter();
    setupEventListeners();
    loadTheme();
}

async function fetchQuotations() {
    try {
        const response = await fetch('/api/metadata');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        quotations = await response.json();
        renderCards(quotations);
    } catch (error) {
        console.error('Error fetching quotations:', error);
        showToast('Failed to load quotations. Please try again.');
        renderCards([]);
    }
}

function hasValidImage(image) {
    return typeof image === 'string' && image.trim() !== '' && image !== 'data:image/svg+xml;base64,' && !image.includes('undefined');
}

function createCard(quotation) {
    const card = document.createElement('div');
    card.className = `card ${!hasValidImage(quotation.identification.image) ? 'card--no-image' : ''}`;
    card.dataset.quotationId = quotation.quotationId;

    if (hasValidImage(quotation.identification.image)) {
        const img = document.createElement('img');
        img.className = 'card-img';
        img.src = quotation.identification.image;
        img.alt = quotation.identification.category;
        img.onerror = () => {
            img.classList.add('hidden');
            card.classList.add('card--no-image');
        };
        card.appendChild(img);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-x';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Delete quotation');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteConfirmation(quotation.quotationId);
    });
    card.appendChild(closeBtn);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = quotation.identification.category;

    const sku = document.createElement('p');
    sku.className = 'card-text';
    sku.innerHTML = `<strong>SKU:</strong> ${quotation.identification.idSku}`;

    const date = document.createElement('p');
    date.className = 'card-text';
    date.innerHTML = `<strong>Date:</strong> ${formatDate(quotation.quotationDate)}`;

    const metal = document.createElement('p');
    metal.className = 'card-text';
    metal.innerHTML = `<strong>Metal:</strong> ${quotation.summary.metalPurities}`;

    const total = document.createElement('p');
    total.className = 'card-text';
    total.innerHTML = `<strong>Total:</strong> ₹${quotation.summary.finalQuotation}`;

    cardBody.appendChild(title);
    cardBody.appendChild(sku);
    cardBody.appendChild(date);
    cardBody.appendChild(metal);
    cardBody.appendChild(total);
    card.appendChild(cardBody);

    card.addEventListener('click', (e) => {
        if (e.target !== closeBtn) openModal(quotation);
    });

    return card;
}

function renderCards(data) {
    elements.cardGrid.innerHTML = data.length === 0 
        ? '<div class="no-results-container">No quotations found 🤷‍♂️</div>'
        : '';
    data.forEach((quotation, index) => {
        const card = createCard(quotation);
        card.style.animationDelay = `${index * 0.1}s`;
        elements.cardGrid.appendChild(card);
    });
}

function openModal(quotation) {
    currentQuotation = quotation;

    elements.modalImg.className = hasValidImage(quotation.identification.image) ? 'modal-img' : 'modal-img hidden';
    if (hasValidImage(quotation.identification.image)) {
        elements.modalImg.src = quotation.identification.image;
        elements.modalImg.onerror = () => elements.modalImg.classList.add('hidden');
    }

    elements.modalTitle.textContent = quotation.identification.category;
    elements.modalSku.textContent = quotation.identification.idSku;
    elements.modalCategory.textContent = quotation.identification.category;
    elements.modalDate.textContent = formatDate(quotation.quotationDate);

    elements.metalTableBody.innerHTML = quotation.metalItems.map(item => `
        <tr>
            <td>${item.purity}</td>
            <td>${item.grams}g</td>
            <td>₹${item.ratePerGram}</td>
            <td>₹${item.totalMetal}</td>
            <td>₹${item.makingCharges}</td>
        </tr>
    `).join('');

    elements.diamondTableBody.innerHTML = quotation.diamondItems.length > 0 
        ? quotation.diamondItems.map(item => `
            <tr>
                <td>${item.shape}</td>
                <td>${item.mm}</td>
                <td>${item.pcs}</td>
                <td>${item.weightPerPiece}ct</td>
                <td>${item.totalWeightCt}ct</td>
                <td>₹${item.pricePerCt}</td>
                <td>₹${item.total}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="7" style="text-align: center;">No diamond items</td></tr>';

    elements.modalMetalAmount.textContent = `₹${quotation.summary.totalMetalAmount}`;
    elements.modalMakingCharges.textContent = `₹${quotation.summary.totalMetalMakingCharges}`;
    elements.modalPurities.textContent = quotation.summary.metalPurities;
    elements.modalDiamondAmount.textContent = `₹${quotation.summary.totalDiamondAmount}`;
    elements.modalFinalQuotation.textContent = `₹${quotation.summary.finalQuotation}`;

    elements.summaryTableBody.innerHTML = quotation.detailedSummaryTable.map(item => `
        <tr>
            <td>${item.description}</td>
            <td>${item.metalAmount === '-' ? '-' : `₹${item.metalAmount}`}</td>
            <td>${item.makingCharges === '-' ? '-' : `₹${item.makingCharges}`}</td>
            <td>${item.diamondAmount === '-' ? '-' : `₹${item.diamondAmount}`}</td>
            <td>₹${item.total}</td>
        </tr>
    `).join('');

    elements.modalDeleteBtn.onclick = (e) => {
        e.stopPropagation();
        showDeleteConfirmation(quotation.quotationId);
    };

    elements.detailModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    elements.detailModal.scrollTop = 0;
    elements.modalCloseBtn.focus();
}

function closeModal() {
    elements.detailModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentQuotation = null;
}

function showDeleteConfirmation(quotationId) {
    elements.confirmationDialog.style.display = 'block';
    
    elements.confirmDelete.onclick = null;
    elements.cancelDelete.onclick = null;
    
    elements.confirmDelete.onclick = async () => {
        await deleteQuotation(quotationId);
        elements.confirmationDialog.style.display = 'none';
    };
    
    elements.cancelDelete.onclick = () => {
        elements.confirmationDialog.style.display = 'none';
    };
}

async function deleteQuotation(quotationId) {
    try {
        const response = await fetch(`/api/metadata/${quotationId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        quotations = quotations.filter(q => q.quotationId !== quotationId);
        renderCards(quotations);
        showToast(result.message || 'Quotation deleted successfully');
        if (currentQuotation?.quotationId === quotationId) closeModal();
        populateCategoryFilter();
    } catch (error) {
        console.error('Error deleting quotation:', error);
        showToast('Failed to delete quotation. Please try again.');
    }
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function populateCategoryFilter() {
    const categories = [...new Set(quotations.map(q => q.identification.category))];
    elements.categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(category => `<option value="${category}">${category}</option>`).join('');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function filterQuotations() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const category = elements.categoryFilter.value;
    const sku = elements.skuFilter.value;
    const fromDate = elements.dateFrom.value ? new Date(elements.dateFrom.value) : null;
    const toDate = elements.dateTo.value ? new Date(elements.dateTo.value) : null;

    const filtered = quotations.filter(q => {
        const matchesSearch = !searchTerm || [
            q.identification.idSku,
            q.identification.category,
            q.summary.metalPurities,
            q.quotationId
        ].some(field => field.toLowerCase().includes(searchTerm));

        const matchesCategory = !category || q.identification.category === category;
        const matchesSku = !sku || q.identification.idSku === sku;

        const quoteDate = new Date(q.quotationDate);
        const quoteDateOnly = new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate());
        const fromDateOnly = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
        const toDateOnly = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : null;

        const matchesDate = (!fromDateOnly || quoteDateOnly >= fromDateOnly) && 
                           (!toDateOnly || quoteDateOnly <= toDateOnly);

        return matchesSearch && matchesCategory && matchesSku && matchesDate;
    });

    renderCards(filtered);
}

function showSuggestions() {
    const term = elements.searchInput.value.toLowerCase();
    if (term.length < 2) {
        elements.suggestions.style.display = 'none';
        return;
    }

    const matches = quotations.reduce((acc, q) => {
        if (q.identification.idSku.toLowerCase().includes(term)) acc.push(`SKU: ${q.identification.idSku}`);
        if (q.identification.category.toLowerCase().includes(term)) acc.push(`Category: ${q.identification.category}`);
        if (q.summary.metalPurities.toLowerCase().includes(term)) acc.push(`Metal: ${q.summary.metalPurities}`);
        if (q.quotationId.toLowerCase().includes(term)) acc.push(`Quotation ID: ${q.quotationId}`);
        return acc;
    }, []);

    const uniqueMatches = [...new Set(matches)];
    elements.suggestions.innerHTML = uniqueMatches.length > 0 
        ? uniqueMatches.slice(0, 5).map(match => `
            <div class="suggestion-item" data-value="${match.split(': ')[1]}">${match}</div>
        `).join('')
        : '<div class="no-results">No matches found 🤷‍♂️</div>';

    elements.suggestions.style.display = 'block';
}

function resetFilters() {
    elements.searchInput.value = '';
    elements.categoryFilter.value = '';
    elements.skuFilter.value = '';
    elements.dateFrom.value = '';
    elements.dateTo.value = '';
    elements.suggestions.style.display = 'none';
    renderCards(quotations);
    showToast('Filters reset successfully!');
}

function toggleTheme() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
    elements.themeToggle.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = savedTheme;
    elements.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function setupEventListeners() {
    elements.searchInput.addEventListener('input', () => {
        showSuggestions();
        filterQuotations();
    });
    elements.searchInput.addEventListener('focus', showSuggestions);
    document.addEventListener('click', e => {
        if (e.target !== elements.searchInput && !elements.suggestions.contains(e.target)) {
            elements.suggestions.style.display = 'none';
        }
    });
    elements.suggestions.addEventListener('click', e => {
        if (e.target.classList.contains('suggestion-item')) {
            elements.searchInput.value = e.target.dataset.value;
            elements.suggestions.style.display = 'none';
            filterQuotations();
        }
    });
    elements.searchBtn.addEventListener('click', filterQuotations);
    elements.categoryFilter.addEventListener('change', filterQuotations);
    elements.skuFilter.addEventListener('input', filterQuotations);
    elements.dateFrom.addEventListener('change', filterQuotations);
    elements.dateTo.addEventListener('change', filterQuotations);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalCloseX.addEventListener('click', closeModal);
    elements.detailModal.addEventListener('click', e => {
        if (e.target === elements.detailModal) closeModal();
    });
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    window.addEventListener('resize', () => {
        elements.suggestions.style.display = 'none';
        if (elements.detailModal.style.display === 'block') {
            elements.detailModal.scrollTop = 0;
        }
        filterQuotations(); // Re-render filtered cards on resize
    });
}

document.addEventListener('DOMContentLoaded', init);