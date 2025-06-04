
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
    themeToggle: document.getElementById('theme-toggle'),
    backToTop: document.getElementById('backToTop'),
    scrollToBottom: document.getElementById('scrollToBottom'),
    loadingSpinner: document.getElementById('loadingSpinner'),
};

let quotations = [];
let currentQuotation = null;
let displayedCards = 5;
const cardsPerPage = 5;
let cachedFilteredData = null;

// Debounce utility
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

// Optimized date parsing
function parseQuotationDate(dateInput) {
    if (!dateInput) return null;

    if (typeof dateInput === 'object' && (dateInput._seconds || dateInput.seconds)) {
        const seconds = dateInput._seconds || dateInput.seconds;
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0;
        return new Date(seconds * 1000 + nanoseconds / 1000000);
    }

    if (typeof dateInput === 'string') {
        const [datePart, timePart] = dateInput.replace(/[\u202F\u00A0]/g, ' ').trim().split(' at ');
        if (!datePart || !timePart) return null;
        const [time, period] = timePart.split(' ');
        if (!time || !period) return null;
        try {
            return new Date(`${datePart} ${time} ${period}`);
        } catch {
            return null;
        }
    }

    return null;
}

function sortByDateNewestFirst(a, b) {
    const dateA = parseQuotationDate(a.quotationDate) || new Date(0);
    const dateB = parseQuotationDate(b.quotationDate) || new Date(0);
    return dateB - dateA;
}

function hasValidImage(image) {
    return typeof image === 'string' && image.trim() && image !== 'data:image/svg+xml;base64,' && !image.includes('undefined');
}

function createCard(quotation) {
    const card = document.createElement('div');
    card.className = `card ${!quotation.identification.images.length || !hasValidImage(quotation.identification.images[0]) ? 'card--no-image' : ''}`;
    card.dataset.quotationId = quotation.quotationId;

    if (quotation.identification.images.length > 0 && hasValidImage(quotation.identification.images[0])) {
        const img = document.createElement('img');
        img.className = 'card-img';
        img.loading = 'lazy';
        img.src = quotation.identification.images[0];
        img.alt = quotation.identification.category;
        img.onerror = () => img.classList.add('hidden');
        card.appendChild(img);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-x';
    closeBtn.innerHTML = 'X';
    closeBtn.setAttribute('aria-label', 'Delete quotation');

    const closeContainer = document.createElement('div');
    closeContainer.className = 'card-close-container';
    closeContainer.appendChild(closeBtn);
    card.appendChild(closeContainer);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.innerHTML = `
        <h3 class="card-title">${quotation.identification.category}</h3>
        <p class="card-text"><strong>SKU:</strong> ${quotation.identification.idSku}</p>
        <p class="card-text card-date"><strong>Date:</strong> ${formatDate(quotation.quotationDate)}</p>
        <button class="download-btn"><i class="fas fa-download"></i> Download Excel</button>
    `;
    card.appendChild(cardBody);

    return { card, closeBtn };
}

function exportToExcel(quotation) {
    elements.loadingSpinner.style.display = 'flex';
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(btn => btn.disabled = true);

    setTimeout(() => {
        try {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
                'Quotation ID': quotation.quotationId,
                'SKU ID': quotation.identification.idSku,
                Category: quotation.identification.category,
                'Quotation Date': formatDate(quotation.quotationDate)
            }]), 'Identification');

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                (quotation.metalItems?.length > 0 ? quotation.metalItems : []).map(item => ({
                    Purity: item.purity || 'N/A',
                    Grams: item.grams || '0',
                    'Rate/Gram': `₹${item.ratePerGram || '0'}`,
                    'Total Metal': `₹${item.totalMetal || '0'}`,
                    'Making Charges': `₹${item.makingCharges || '0'}`
                }))
            ), 'Metal Items');

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                (quotation.diamondItems?.length > 0 ? quotation.diamondItems : []).length > 0
                    ? quotation.diamondItems.map(item => ({
                        Shape: item.shape || 'N/A',
                        "Selected MM": item.mm || item.displayMM || 'N/A',
                        'Entered MM': item.userMM || 'N/A',
                        Pieces: item.pcs || '0',
                        'Weight/Piece': `${item.weightPerPiece || '0'}ct`,
                        'Total Weight': `${item.totalWeightCt || '0'}ct`,
                        'Price/Ct': `₹${item.pricePerCt || '0'}`,
                        Total: `₹${item.total || '0'}`
                    }))
                    : [{ Message: 'No diamond items' }]
            ), 'Diamond Items');

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                (quotation.summary?.metalSummary?.length > 0 ? quotation.summary.metalSummary : []).map(item => ({
                    Description: item.purity || 'N/A',
                    'Metal Amount': `₹${item.totalMetal || '0'}`,
                    'Making Charges': `₹${item.makingCharges || '0'}`,
                    'Diamond Amount': `₹${item.totalDiamondAmount || '0'}`,
                    Total: `₹${item.total || '0'}`
                }))
            ), 'Summary');

            XLSX.writeFile(wb, `Quotation_${quotation.quotationId}.xlsx`);
            showToast('Excel file downloaded successfully');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            showToast('Failed to download Excel file. Please try again.');
        } finally {
            elements.loadingSpinner.style.display = 'none';
            downloadButtons.forEach(btn => btn.disabled = false);
        }
    }, 100);
}

function renderCards(data) {
    const fragment = document.createDocumentFragment();
    elements.cardGrid.innerHTML = data.length === 0 ? '<div class="no-results-container">No quotations found 🤷‍♂️</div>' : '';

    data.forEach((quotation, index) => {
        const { card, closeBtn } = createCard(quotation);
        card.style.animationDelay = `${index * 0.1}s`;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(quotation.quotationId);
        });
        card.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exportToExcel(quotation);
        });
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-close-x, .download-btn')) {
                openModal(quotation);
            }
        });
        fragment.appendChild(card);
    });

    elements.cardGrid.appendChild(fragment);
}

function updatePaginationControls() {
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        paginationContainer.style.cssText = 'display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;';
        elements.cardGrid.insertAdjacentElement('afterend', paginationContainer);
    }

    const filteredData = filterQuotationsData();
    paginationContainer.innerHTML = '';

    if (displayedCards < filteredData.length) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'pagination-btn';
        moreBtn.textContent = 'More';
        moreBtn.addEventListener('click', () => {
            displayedCards += cardsPerPage;
            renderCards(filteredData.slice(0, displayedCards));
            updatePaginationControls();
        });
        paginationContainer.appendChild(moreBtn);
    }

    if (filteredData.length > cardsPerPage) {
        const allBtn = document.createElement('button');
        allBtn.className = 'pagination-btn';
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => {
            displayedCards = filteredData.length;
            renderCards(filteredData);
            updatePaginationControls();
        });
        paginationContainer.appendChild(allBtn);
    }
}

function openModal(quotation) {
    currentQuotation = quotation;
    elements.detailModal.style.display = 'none';

    elements.modalImg.className = quotation.identification.images.length > 0 && hasValidImage(quotation.identification.images[0]) ? 'modal-img' : 'modal-img hidden';
    if (quotation.identification.images.length > 0 && hasValidImage(quotation.identification.images[0])) {
        elements.modalImg.src = quotation.identification.images[0];
        elements.modalImg.loading = 'lazy';
        elements.modalImg.onerror = () => elements.modalImg.classList.add('hidden');
        elements.modalImg.onclick = () => openFullScreenImage(quotation.identification.images[0]);
    } else {
        elements.modalImg.onclick = null;
    }

    const modalBody = document.querySelector('.modal-body');
    let imageGallery = modalBody.querySelector('.image-gallery');
    if (!imageGallery) {
        imageGallery = document.createElement('div');
        imageGallery.className = 'image-gallery';
        modalBody.prepend(imageGallery);
    }
    imageGallery.innerHTML = quotation.identification.images.length > 0
        ? quotation.identification.images.map((img, index) => 
            `<img src="${img}" alt="Product Image ${index + 1}" class="gallery-img ${index === 0 ? 'active' : ''}" loading="lazy">`
        ).join('')
        : '<p>No images available</p>';

    elements.modalTitle.textContent = quotation.identification.category;
    elements.modalSku.textContent = quotation.identification.idSku;
    elements.modalCategory.textContent = quotation.identification.category;
    elements.modalDate.textContent = formatDate(quotation.quotationDate);

    elements.metalTableBody.innerHTML = quotation.metalItems?.length > 0
        ? quotation.metalItems.map(item => `
            <tr>
                <td>${item.purity || 'N/A'}</td>
                <td>${item.grams || '0'}g</td>
                <td>₹${item.ratePerGram || '0'}</td>
                <td>₹${item.totalMetal || '0'}</td>
                <td>₹${item.makingCharges || '0'}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="5" style="text-align: center;">No metal items</td></tr>';

    elements.diamondTableBody.innerHTML = quotation.diamondItems?.length > 0
        ? quotation.diamondItems.map(item => `
            <tr>
                <td>${item.shape || 'N/A'}</td>
                <td>${item.mm || 'N/A'}</td>
                <td>${item.userMM || item.mm || 'N/A'}</td>
                <td>${item.pcs || '0'}</td>
                <td>${item.weightPerPiece || '0'}ct</td>
                <td>${item.totalWeightCt || '0'}ct</td>
                <td>₹${item.pricePerCt || '0'}</td>
                <td>₹${item.total || '0'}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="8" style="text-align: center;">No diamond items</td></tr>';

    const totalMetalAmount = quotation.metalItems?.length > 0
        ? quotation.metalItems.reduce((sum, item) => sum + Number(item.totalMetal || 0), 0).toFixed(2)
        : '0.00';
    const totalMakingCharges = quotation.metalItems?.length > 0
        ? quotation.metalItems.reduce((sum, item) => sum + Number(item.makingCharges || 0), 0).toFixed(2)
        : '0.00';
    const metalPurities = quotation.metalItems?.length > 0
        ? quotation.metalItems.map(item => item.purity || 'N/A').join(', ')
        : 'N/A';

    elements.modalMetalAmount.textContent = `₹${totalMetalAmount}`;
    elements.modalMakingCharges.textContent = `₹${totalMakingCharges}`;
    elements.modalPurities.textContent = metalPurities;
    elements.modalDiamondAmount.textContent = `₹${quotation.summary?.totalDiamondAmount || '0'}`;

    elements.summaryTableBody.innerHTML = quotation.summary?.metalSummary?.length > 0
        ? quotation.summary.metalSummary.map(item => `
            <tr>
                <td>${item.purity || 'N/A'}</td>
                <td>₹${item.totalMetal || '0'}</td>
                <td>₹${item.makingCharges || '0'}</td>
                <td>₹${item.totalDiamondAmount || '0'}</td>
                <td>₹${item.total || '0'}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="5" style="text-align: center;">No summary data</td></tr>';

    const modalFooter = document.querySelector('.modal-footer');
    let downloadBtn = modalFooter.querySelector('.download-btn');
    if (!downloadBtn) {
        downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Excel';
        modalFooter.insertBefore(downloadBtn, elements.modalDeleteBtn);
    }
    downloadBtn.onclick = (e) => {
        e.stopPropagation();
        exportToExcel(quotation);
    };

    elements.detailModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    elements.detailModal.scrollTop = 0;
    elements.modalCloseBtn.focus();
}

function changeModalImage(src) {
    elements.modalImg.src = src;
    elements.modalImg.classList.remove('hidden');
    const galleryImages = document.querySelectorAll('.image-gallery img');
    galleryImages.forEach(img => img.classList.remove('active'));
    const clickedImage = Array.from(galleryImages).find(img => img.src === src);
    if (clickedImage) clickedImage.classList.add('active');
}

function openFullScreenImage(src) {
    const fullScreenDiv = document.createElement('div');
    fullScreenDiv.className = 'fullscreen-image';
    fullScreenDiv.innerHTML = `
        <img src="${src}" alt="Full Screen Image" loading="lazy">
        <button class="fullscreen-close">X</button>
    `;
    document.body.appendChild(fullScreenDiv);
    document.body.style.overflow = 'hidden';

    const closeBtn = fullScreenDiv.querySelector('.fullscreen-close');
    closeBtn.addEventListener('click', () => fullScreenDiv.remove());
    fullScreenDiv.addEventListener('click', (e) => {
        if (e.target === fullScreenDiv) fullScreenDiv.remove();
        document.body.style.overflow = 'auto';
    });
}

function closeModal() {
    elements.detailModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentQuotation = null;
}

function showDeleteConfirmation(quotationId) {
    if (!quotationId) {
        console.error('No quotation ID provided for deletion');
        showToast('Error: No quotation ID provided');
        return;
    }
    elements.confirmationDialog.style.display = 'block';
    
    elements.confirmDelete.onclick = async () => {
        await deleteQuotation(quotationId);
        elements.confirmationDialog.style.display = 'none';
    };
    
    elements.cancelDelete.onclick = () => {
        elements.confirmationDialog.style.display = 'none';
    };
}

async function deleteQuotation(quotationId) {
    elements.loadingSpinner.style.display = 'flex';
    try {
        const response = await fetch(`/api/metadata/${quotationId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        quotations = quotations.filter(q => q.quotationId !== quotationId);
        displayedCards = Math.min(displayedCards, quotations.length);
        cachedFilteredData = null; // Invalidate cache
        renderCards(filterQuotationsData().slice(0, displayedCards));
        updatePaginationControls();
        showToast(result.message || 'Quotation deleted successfully');
        if (currentQuotation?.quotationId === quotationId) closeModal();
        populateCategoryFilter();
    } catch (error) {
        console.error('Error deleting quotation:', error);
        showToast('Failed to delete quotation. Please try again.');
    } finally {
        elements.loadingSpinner.style.display = 'none';
    }
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function populateCategoryFilter() {
    const categories = [...new Set(quotations.map(q => q.identification.category))];
    elements.categoryFilter.innerHTML = `<option value="">All Categories</option>${categories.map(category => `<option value="${category}">${category}</option>`).join('')}`;
}

function formatDate(dateInput) {
    const date = parseQuotationDate(dateInput);
    return date ? date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }) : 'Invalid Date';
}

function filterQuotationsData() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const category = elements.categoryFilter.value;
    const sku = elements.skuFilter.value;
    const fromDate = elements.dateFrom.value ? new Date(elements.dateFrom.value) : null;
    const toDate = elements.dateTo.value ? new Date(elements.dateTo.value) : null;

    const cacheKey = `${searchTerm}|${category}|${sku}|${fromDate?.toISOString()}|${toDate?.toISOString()}`;
    if (cachedFilteredData?.key === cacheKey) return cachedFilteredData.data;

    const filtered = quotations.filter(q => {
        const matchesSearch = !searchTerm || [
            q.identification.idSku,
            q.identification.category,
            q.quotationId,
            (q.metalItems?.length > 0 ? q.metalItems.map(item => item.purity).join(', ') : '')
        ].some(field => field.toLowerCase().includes(searchTerm));

        const matchesCategory = !category || q.identification.category === category;
        const matchesSku = !sku || q.identification.idSku === sku;

        const quoteDate = parseQuotationDate(q.quotationDate);
        const quoteDateOnly = quoteDate ? new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate()) : null;
        const fromDateOnly = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
        const toDateOnly = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : null;

        return matchesSearch && matchesCategory && matchesSku && 
               (!fromDateOnly || !quoteDateOnly || quoteDateOnly >= fromDateOnly) && 
               (!toDateOnly || !quoteDateOnly || quoteDateOnly <= toDateOnly);
    });

    cachedFilteredData = { key: cacheKey, data: filtered };
    return filtered;
}

const debouncedFilterQuotations = debounce(() => {
    displayedCards = cardsPerPage;
    renderCards(filterQuotationsData().slice(0, displayedCards));
    updatePaginationControls();
}, 300);

const debouncedShowSuggestions = debounce(showSuggestions, 200);

function showSuggestions() {
    const term = elements.searchInput.value.toLowerCase();
    if (term.length < 2) {
        elements.suggestions.style.display = 'none';
        return;
    }

    const matches = quotations.reduce((acc, q) => {
        if (q.identification.idSku.toLowerCase().includes(term)) acc.push(`SKU: ${q.identification.idSku}`);
        if (q.identification.category.toLowerCase().includes(term)) acc.push(`Category: ${q.identification.category}`);
        if (q.metalItems?.some(item => item.purity.toLowerCase().includes(term))) acc.push(`Metal: ${q.metalItems.map(item => item.purity).join(', ')}`);
        if (q.quotationId.toLowerCase().includes(term)) acc.push(`Quotation ID: ${q.quotationId}`);
        return acc;
    }, []);

    const uniqueMatches = [...new Set(matches)];
    elements.suggestions.innerHTML = uniqueMatches.length > 0
        ? uniqueMatches.slice(0, 5).map(match => `<div class="suggestion-item" data-value="${match.split(': ')[1]}">${match}</div>`).join('')
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
    displayedCards = cardsPerPage;
    cachedFilteredData = null;
    renderCards(quotations.slice(0, displayedCards));
    updatePaginationControls();
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

async function fetchQuotations() {
    elements.loadingSpinner.style.display = 'flex';
    try {
        const response = await fetch('/api/metadata');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        quotations = Array.isArray(data.quotations) ? data.quotations : [];
        quotations.sort(sortByDateNewestFirst);
        cachedFilteredData = null;
        renderCards(quotations.slice(0, displayedCards));
        updatePaginationControls();
    } catch (error) {
        console.error('Error fetching quotations:', error);
        showToast('Failed to load quotations. Please try again.');
        renderCards([]);
    } finally {
        elements.loadingSpinner.style.display = 'none';
    }
}

function setupEventListeners() {
    elements.cardGrid.addEventListener('click', (e) => {
        const suggestion = e.target.closest('.suggestion-item');
        if (suggestion) {
            elements.searchInput.value = suggestion.dataset.value;
            elements.suggestions.style.display = 'none';
            debouncedFilterQuotations();
        }
    });

    elements.searchInput.addEventListener('input', debouncedShowSuggestions);
    elements.searchInput.addEventListener('focus', debouncedShowSuggestions);
    document.addEventListener('click', e => {
        if (e.target !== elements.searchInput && !elements.suggestions.contains(e.target)) {
            elements.suggestions.style.display = 'none';
        }
    });

    elements.searchBtn.addEventListener('click', debouncedFilterQuotations);
    elements.categoryFilter.addEventListener('change', debouncedFilterQuotations);
    elements.skuFilter.addEventListener('input', debouncedFilterQuotations);
    elements.dateFrom.addEventListener('change', debouncedFilterQuotations);
    elements.dateTo.addEventListener('change', debouncedFilterQuotations);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modalCloseX.addEventListener('click', closeModal);
    elements.modalDeleteBtn.addEventListener('click', () => {
        if (currentQuotation) {
            showDeleteConfirmation(currentQuotation.quotationId);
        } else {
            console.error('No current quotation selected for deletion');
            showToast('Error: No quotation selected');
        }
    });
    elements.detailModal.addEventListener('click', e => {
        if (e.target === elements.detailModal) closeModal();
    });
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    elements.scrollToBottom.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    window.addEventListener('resize', debouncedFilterQuotations);
}

async function init() {
    await fetchQuotations();
    populateCategoryFilter();
    setupEventListeners();
    loadTheme();
}

document.addEventListener('DOMContentLoaded', init);
