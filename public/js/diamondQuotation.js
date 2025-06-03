document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements (cached for performance)
    const elements = {
        diamondsTableBody: document.getElementById('diamondsTableBody'),
        addDiamondBtn: document.getElementById('addDiamondBtn'),
        diamondModal: document.getElementById('diamondModal'),
        closeBtn: document.querySelector('.close-btn'),
        diamondForm: document.getElementById('diamondForm'),
        modalTitle: document.getElementById('modalTitle'),
        diamondIdInput: document.getElementById('diamondId'),
        shapeInput: document.getElementById('shape'),
        mmNumberInput: document.getElementById('mmNumber'),
        mmTextInput: document.getElementById('mmText'),
        priceInput: document.getElementById('price'),
        toast: document.getElementById('toast'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        shapeFilter: document.getElementById('shapeFilter'),
        mmFilter: document.getElementById('mmFilter'),
        resetConfirmation: document.getElementById('resetConfirmation'),
        resetFiltersBtn: document.getElementById('resetFiltersBtn'),
        deleteModal: document.getElementById('deleteModal'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
        deleteCloseBtn: document.querySelector('.delete-close-btn'),
        backToTopBtn: document.getElementById('backToTop'),
        topToBackBtn: document.getElementById('topToBack'),
        deleteDiamondId: document.getElementById('deleteDiamondId')
    };

    let diamondsData = [];
    let isEditMode = false;

    // Debounce utility
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    // Initialize the app
    const init = () => {
        fetchDiamonds();
        setupEventListeners();
        updateScrollButtonsVisibility();
    };

    const setupEventListeners = () => {
        elements.addDiamondBtn.addEventListener('click', openAddModal);
        elements.closeBtn.addEventListener('click', closeModal);
        elements.diamondForm.addEventListener('submit', handleFormSubmit);
        elements.deleteCloseBtn.addEventListener('click', closeDeleteModal);
        elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        elements.confirmDeleteBtn.addEventListener('click', handleDelete);
        elements.shapeInput.addEventListener('change', toggleMMInput);
        elements.shapeFilter.addEventListener('change', () => {
            updateMMFilter(diamondsData, elements.shapeFilter.value || null);
            debouncedFilterDiamonds();
        });
        elements.mmFilter.addEventListener('change', debouncedFilterDiamonds);
        elements.resetFiltersBtn.addEventListener('click', resetFilters);
        elements.backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        elements.topToBackBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
        window.addEventListener('click', e => {
            if (e.target === elements.diamondModal) closeModal();
            if (e.target === elements.deleteModal) closeDeleteModal();
        });
        window.addEventListener('scroll', debounce(updateScrollButtonsVisibility, 100));
    };

    const updateScrollButtonsVisibility = () => {
        const isScrolled = window.scrollY > 100;
        elements.backToTopBtn.classList.toggle('visible', isScrolled);
        elements.topToBackBtn.classList.toggle('visible', !isScrolled);
        document.body.classList.toggle('scrolled', isScrolled);
    };

    const toggleMMInput = () => {
        const isRound = elements.shapeInput.value === 'ROUND';
        elements.mmNumberInput.style.display = isRound ? 'block' : 'none';
        elements.mmTextInput.style.display = isRound ? 'none' : 'block';
        elements[isRound ? 'mmTextInput' : 'mmNumberInput'].value = '';
    };

    const resetFilters = () => {
        elements.shapeFilter.value = '';
        elements.mmFilter.value = '';
        updateMMFilter(diamondsData);
        renderDiamonds(diamondsData);
        elements.resetConfirmation.classList.add('show');
        setTimeout(() => elements.resetConfirmation.classList.remove('show'), 2000);
    };

    const fetchDiamonds = async () => {
        elements.loadingSpinner.classList.add('active');
        try {
            const response = await fetch('/api/diamonds');
            if (!response.ok) throw new Error('Failed to fetch diamonds');
            diamondsData = await response.json();
            renderDiamonds(diamondsData);
            updateFilters(diamondsData);
            updateShapeDropdown(diamondsData);
        } catch (error) {
            showToast('Error loading diamonds', 'error');
            console.error('Error:', error);
        } finally {
            elements.loadingSpinner.classList.remove('active');
        }
    };

    const updateShapeDropdown = diamonds => {
        const shapes = [...new Set(diamonds.map(d => d.SHAPE))].sort();
        elements.shapeInput.innerHTML = `<option value="">Select Shape</option>${shapes.map(shape => `<option value="${shape}">${shape}</option>`).join('')}`;
    };

    const renderDiamonds = diamonds => {
        elements.diamondsTableBody.innerHTML = diamonds.length ? 
            diamonds.map(diamond => `
                <tr>
                    <td>${diamond.id}</td>
                    <td>${diamond.SHAPE}</td>
                    <td>${diamond.MM}</td>
                    <td>${diamond['MM & SHAPE']}</td>
                    <td>Rs.${diamond['PRICE/CT'].toLocaleString()}</td>
                    <td class="action-buttons">
                        <button class="btn warning edit-btn" data-id="${diamond.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn danger delete-btn" data-id="${diamond.id}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `).join('') : 
            '<tr><td colspan="6" class="no-data">No diamonds found</td></tr>';

        elements.diamondsTableBody.querySelectorAll('.edit-btn').forEach(btn => 
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)))
        );
        elements.diamondsTableBody.querySelectorAll('.delete-btn').forEach(btn => 
            btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)))
        );
    };

    const updateFilters = diamonds => {
        const shapes = [...new Set(diamonds.map(d => d.SHAPE))].sort();
        elements.shapeFilter.innerHTML = `<option value="">All Shapes</option>${shapes.map(shape => `<option value="${shape}">${shape}</option>`).join('')}`;
        updateMMFilter(diamonds);
    };

    const updateMMFilter = (diamonds, selectedShape = null) => {
        const filtered = selectedShape ? diamonds.filter(d => d.SHAPE === selectedShape) : diamonds;
        const mms = [...new Set(filtered.map(d => d.MM))].sort();
        elements.mmFilter.innerHTML = `<option value="">All Sizes</option>${mms.map(mm => `<option value="${mm}">${mm}</option>`).join('')}`;
    };

    const filterDiamonds = () => {
        const shape = elements.shapeFilter.value;
        const mm = elements.mmFilter.value;
        const filtered = diamondsData.filter(d => 
            (!shape || d.SHAPE === shape) && (!mm || d.MM == mm)
        );
        renderDiamonds(filtered);
    };

    const debouncedFilterDiamonds = debounce(filterDiamonds, 200);

    const openAddModal = () => {
        isEditMode = false;
        elements.modalTitle.textContent = 'Add New Diamond';
        elements.diamondForm.reset();
        elements.diamondIdInput.value = '';
        toggleMMInput();
        elements.diamondModal.style.display = 'block';
    };

    const openEditModal = id => {
        isEditMode = true;
        elements.modalTitle.textContent = 'Edit Diamond';
        const diamond = diamondsData.find(d => d.id === id);
        if (!diamond) {
            showToast('Diamond not found', 'error');
            return;
        }
        elements.diamondIdInput.value = diamond.id;
        elements.shapeInput.value = diamond.SHAPE;
        toggleMMInput();
        if (diamond.SHAPE === 'ROUND') {
            elements.mmNumberInput.value = parseFloat(diamond.MM);
            elements.mmTextInput.value = '';
        } else {
            elements.mmTextInput.value = diamond.MM;
            elements.mmNumberInput.value = '';
        }
        elements.priceInput.value = parseFloat(diamond['PRICE/CT']);
        elements.diamondModal.style.display = 'block';
    };

    const openDeleteModal = id => {
        elements.deleteDiamondId.value = id;
        elements.deleteModal.style.display = 'block';
    };

    const closeModal = () => {
        elements.diamondModal.style.display = 'none';
    };

    const closeDeleteModal = () => {
        elements.deleteModal.style.display = 'none';
        elements.deleteDiamondId.value = '';
    };

    const handleFormSubmit = async e => {
        e.preventDefault();
        const shape = elements.shapeInput.value;
        const mm = shape === 'ROUND' ? parseFloat(elements.mmNumberInput.value) : elements.mmTextInput.value;
        const price = parseFloat(elements.priceInput.value);
        const diamondData = { SHAPE: shape, MM: mm, 'PRICE/CT': price };

        if (!shape || !mm || isNaN(price)) {
            showToast('Please fill all fields with valid values', 'error');
            return;
        }
        if (shape === 'ROUND' && isNaN(mm)) {
            showToast('MM must be a number for ROUND shape', 'error');
            return;
        }

        elements.loadingSpinner.classList.add('active');
        try {
            let response, updatedDiamond, successMessage;
            if (isEditMode) {
                const id = parseInt(elements.diamondIdInput.value);
                response = await fetch(`/api/diamonds/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(diamondData)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Unknown error occurred');
                }
                updatedDiamond = (await response.json()).diamond;
                diamondsData = diamondsData.map(d => d.id === updatedDiamond.id ? updatedDiamond : d);
                successMessage = 'Diamond updated successfully';
            } else {
                response = await fetch('/api/diamonds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(diamondData)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Unknown error occurred');
                }
                updatedDiamond = await response.json();
                diamondsData.push(updatedDiamond);
                successMessage = 'Diamond added successfully';
            }
            renderDiamonds(diamondsData);
            updateFilters(diamondsData);
            updateShapeDropdown(diamondsData);
            await fetchMetadata();
            closeModal();
            showToast(successMessage, 'success');
        } catch (error) {
            showToast(`Error saving diamond: ${error.message}`, 'error');
            console.error('Error:', error);
        } finally {
            elements.loadingSpinner.classList.remove('active');
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await fetch('/api/metadata');
            if (!response.ok) throw new Error('Failed to fetch metadata');
            await response.json();
        } catch (error) {
            showToast('Error loading metadata', 'error');
            console.error('Error:', error);
        }
    };

    const handleDelete = async () => {
        const id = parseInt(elements.deleteDiamondId.value);
        if (!id) return;

        elements.loadingSpinner.classList.add('active');
        try {
            const response = await fetch(`/api/diamonds/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete diamond');
            diamondsData = diamondsData.filter(d => d.id !== id);
            renderDiamonds(diamondsData);
            updateFilters(diamondsData);
            updateShapeDropdown(diamondsData);
            closeDeleteModal();
            showToast('Diamond deleted successfully', 'success');
        } catch (error) {
            showToast('Error deleting diamond', 'error');
            console.error('Error:', error);
        } finally {
            elements.loadingSpinner.classList.remove('active');
        }
    };

    const showToast = (message, type = 'success') => {
        elements.toast.textContent = message;
        elements.toast.className = `toast show ${type}`;
        elements.toast.style.backgroundColor = `var(--${type}-color)`;
        setTimeout(() => elements.toast.classList.remove('show'), 2000);
    };

    init();
});