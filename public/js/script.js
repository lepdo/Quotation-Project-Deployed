$(document).ready(function() {
    // Global variables
    let fetchedDiamondsData = [];
    let currentImageUrls = [];
    let metalPrices = {};
    let currentQuotationId = null;

    // DOM Elements (cached for performance)
    const $elements = {
        loadingSpinner: $('#loadingSpinner'),
        popupModal: $('#customPopupModal'),
        popupTitle: $('#customPopupTitle'),
        popupMessage: $('#customPopupMessage'),
        popupCloseBtn: $('#customPopupCloseBtn'),
        popupOkBtn: $('#customPopupOkBtn'),
        popupConfirmBtn: $('#customPopupConfirmBtn'),
        popupCancelBtn: $('#customPopupCancelBtn'),
        popupHeader: $('.popup-modal-header'),
        imageModal: $('#imageModal'),
        modalImageContent: $('#modalImageContent'),
        imageModalCaption: $('#imageModalCaption'),
        diamondShape: $('#diamondShape'),
        shapeMmDropdown: $('#shapeMmDropdown'),
        diamondMm: $('#diamondMm'),
        priceCt: $('#priceCt'),
        manualPriceContainer: $('#manualPriceContainer'),
        manualPriceCt: $('#manualPriceCt'),
        diamondPcs: $('#diamondPcs'),
        weightPcs: $('#weightPcs'),
        totalWeight: $('#totalWeight'),
        diamondTotal: $('#diamondTotal'),
        addDiamondBtn: $('#addDiamondBtn'),
        itemImage: $('#itemImage'),
        itemImagePreviews: $('#itemImagePreviews'),
        summaryImagePreviews: $('#summaryImagePreviews'),
        itemIdSku: $('#itemIdSku'),
        itemCategory: $('#itemCategory'),
        resetQuotationBtn: $('#resetQuotationBtn'),
        saveQuotationJsonBtn: $('#saveQuotationJsonBtn'),
        saveLoader: $('#saveLoader'),
        totalDiamondAmount: $('#totalDiamondAmount'),
        metalTable: $('#metalTable'),
        diamondTable: $('#diamondTable'),
        metalSummaryTable: $('#metalSummaryTable'),
        metalEntriesContainer: $('#metalEntriesContainer'),
        addMetalItemBtn: $('#addMetalItemBtn'),
        summaryIdSku: $('#summaryIdSku'),
        summaryCategory: $('#summaryCategory'),
        imageModalClose: $('#imageModalClose'),
        downloadExcelBtn: $('#downloadExcelBtn') // Added downloadExcelBtn
    };

    let confirmationCallback = null;

    // Check if SheetJS is loaded
    if (typeof XLSX === 'undefined') {
        console.error('SheetJS library is not loaded. Please include it.');
        showPopup('Error: Excel library (SheetJS) is not loaded. Please check your setup.', 'error', 'Library Error');
    }

    // Debounce utility
    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    // Popup Modal Logic
    function showPopup(message, type = 'info', title = 'Notification') {
        $elements.popupTitle.text(title);
        $elements.popupMessage.html(message);
        $elements.popupHeader.removeClass('success error warning info').addClass(type);
        $elements.popupOkBtn.show();
        $elements.popupConfirmBtn.hide();
        $elements.popupCancelBtn.hide();
        $elements.popupModal.css('display', 'flex');
    }

    function showConfirmation(message, title = 'Confirm Action', callback) {
        $elements.popupTitle.text(title);
        $elements.popupMessage.html(message);
        confirmationCallback = callback;
        $elements.popupHeader.removeClass('success error warning info').addClass('warning');
        $elements.popupOkBtn.hide();
        $elements.popupConfirmBtn.show();
        $elements.popupCancelBtn.show();
        $elements.popupModal.css('display', 'flex');
    }

    function hidePopup() {
        $elements.popupModal.hide();
        confirmationCallback = null;
    }

    // Toast utility
    function showToast(message, type = 'info', duration = 3000) {
        const $toast = $(`<div class="toast ${type}"><span>${message}</span><button class="toast-close">×</button></div>`);
        $('#toastContainer').append($toast);
        if (duration > 0) {
            setTimeout(() => $toast.addClass('hide').delay(300).queue(() => $toast.remove()), duration);
        }
        $toast.find('.toast-close').on('click', () => $toast.addClass('hide').delay(300).queue(() => $toast.remove()));
    }

    // Metal purity options
    const metalPurityOptions = [
        { value: "10KT", text: "10KT Gold" },
        { value: "14KT", text: "14KT Gold" },
        { value: "18KT", text: "18KT Gold" },
        { value: "22KT", text: "22KT Gold" },
        { value: "24KT", text: "24KT Gold" },
        { value: "Silver", text: "Silver" },
        { value: "Platinum", text: "Platinum" }
    ];

    // Initialize Select2
    $('.shape-select, .shape-mm-select, .category-select').select2({ width: '100%', theme: 'default' });

    function initializeSelect2ForMetalEntry($entry) {
        $entry.find('.metalPuritySelect').select2({ width: '100%', theme: 'default' });
    }

    function createMetalEntryForm() {
        const entryId = `metalEntry-${Date.now()}`;
        const optionsHtml = `<option value="">Select Metal & Purity</option>${metalPurityOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}`;
        const entryHtml = `
            <div class="metal-entry" id="${entryId}" data-entry-type="metal">
                <div class="form-row">
                    <div class="form-group">
                        <label>Metal & Purity</label>
                        <select class="metalPuritySelect" required>${optionsHtml}</select>
                    </div>
                    <div class="form-group">
                        <label>Grams</label>
                        <input type="number" class="grm" placeholder="e.g., 10.5" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Rate/Gram (₹)</label>
                        <input type="number" class="rateGrm" readonly required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Total Metal Amount (₹)</label>
                        <input type="number" class="totalMetalValue" readonly required>
                    </div>
                    <div class="form-group">
                        <label>Making Charges (₹)</label>
                        <input type="number" class="makingCharges" readonly required>
                    </div>
                    <div class="form-group form-group-action">
                        <button class="btn btn-add add-metal-entry-to-table">Add to Quotation</button>
                    </div>
                </div>
            </div>
        `;
        const $newEntry = $(entryHtml);
        $elements.metalEntriesContainer.append($newEntry);
        initializeSelect2ForMetalEntry($newEntry);
    }

    function initializeDiamondSection() {
        $elements.diamondShape.empty().append('<option value="">Select Shape</option>');
        if (!fetchedDiamondsData?.length) {
            $elements.diamondShape.append('<option value="OTHER">OTHER</option>').trigger('change');
            return;
        }

        const uniqueShapes = [...new Set(fetchedDiamondsData.map(item => item.SHAPE?.trim()).filter(Boolean))].sort();
        uniqueShapes.splice(uniqueShapes.indexOf("OTHER"), 1);
        uniqueShapes.push("OTHER");
        $elements.diamondShape.append(uniqueShapes.map(shape => `<option value="${shape}">${shape}</option>`).join('')).trigger('change');
    }

    // Fetch data
    $elements.loadingSpinner.css('display', 'flex');
    $.getJSON('/api/prices').done(data => {
        metalPrices = data;
    }).fail((jqXHR, textStatus, errorThrown) => {
        console.error('Failed to fetch metal prices:', textStatus, errorThrown);
        showPopup('Error: Could not load metal prices. Using default prices.', 'error', 'Metal Prices Load Error');
        metalPrices = {
            "10KT": 4410, "14KT": 6077, "18KT": 7448, "22KT": 9016, "24KT": 9800, "Silver": 100, "Platinum": 3200
        };
    }).always(() => {
        $.getJSON('/api/diamonds').done(data => {
            fetchedDiamondsData = Array.isArray(data) ? data.map(d => ({...d, SHAPE: d.SHAPE?.trim() || ''})) : [];
            initializeDiamondSection();
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.error("Failed to fetch diamond data:", textStatus, errorThrown);
            showPopup("Error: Could not load diamond data.", 'error', 'Data Load Error');
            fetchedDiamondsData = [];
            initializeDiamondSection();
        }).always(() => {
            setTimeout(() => {
                $elements.loadingSpinner.hide();
                createMetalEntryForm();
            }, 100);
        });
    });

    // Event Handlers
    $elements.popupCloseBtn.on('click', () => {
        if (confirmationCallback) confirmationCallback(false);
        hidePopup();
    });

    $elements.popupOkBtn.on('click', hidePopup);

    $elements.popupConfirmBtn.on('click', () => {
        if (confirmationCallback) {
            $elements.popupModal.hide();
            confirmationCallback(true);
            confirmationCallback = null;
        }
    });

    $elements.popupCancelBtn.on('click', () => {
        if (confirmationCallback) confirmationCallback(false);
        hidePopup();
    });

    $elements.popupModal.on('click', e => {
        if (e.target === $elements.popupModal[0]) {
            if (confirmationCallback) confirmationCallback(false);
            hidePopup();
        }
    });

    $elements.imageModal.hide();
    $elements.addMetalItemBtn.on('click', () => {
        $elements.loadingSpinner.css('display', 'flex');
        $elements.addMetalItemBtn.prop('disabled', true).addClass('disabled');
        setTimeout(() => {
            $elements.metalEntriesContainer.empty();
            createMetalEntryForm();
            $elements.loadingSpinner.hide();
            $elements.addMetalItemBtn.prop('disabled', false).removeClass('disabled');
        }, 100);
    });

    const debouncedUpdateMetalEntry = debounce(function($entry) {
        const grm = parseFloat($entry.find('.grm').val()) || 0;
        const purity = $entry.find('.metalPuritySelect').val();
        if (grm > 0 && purity) {
            const rateGrm = metalPrices[purity] || 0;
            $entry.find('.rateGrm').val(rateGrm.toFixed(2));
            $entry.find('.totalMetalValue').val((grm * rateGrm).toFixed(2));
            const makingChargeRate = { '10KT': 800, '14KT': 800, '18KT': 800, '22KT': 800, '24KT': 800, 'Silver': 250, 'Platinum': 1250 }[purity] || 0;
            $entry.find('.makingCharges').val((makingChargeRate * grm).toFixed(2));
        } else {
            $entry.find('.rateGrm, .totalMetalValue, .makingCharges').val('');
        }
    }, 200);

    $(document).on('change input', '.metal-entry .metalPuritySelect, .metal-entry .grm', function() {
        debouncedUpdateMetalEntry($(this).closest('.metal-entry'));
    });

    function getTableHeaders($table) {
        return $table.find('thead th').map((_, th) => $(th).text().trim()).get();
    }

    $(document).on('click', '.add-metal-entry-to-table', function() {
        const $entry = $(this).closest('.metal-entry');
        const values = {
            purity: $entry.find('.metalPuritySelect').val(),
            grm: parseFloat($entry.find('.grm').val()) || 0,
            rateGrm: parseFloat($entry.find('.rateGrm').val()) || 0,
            totalMetal: parseFloat($entry.find('.totalMetalValue').val()) || 0,
            makingCharges: parseFloat($entry.find('.makingCharges').val()) || 0
        };

        if (!values.purity || values.grm <= 0 || values.rateGrm <= 0 || values.totalMetal <= 0 || values.makingCharges <= 0) {
            showPopup('Please fill all metal fields with valid positive values.', 'warning', 'Invalid Metal Values');
            return;
        }

        const total = (values.totalMetal + values.makingCharges).toFixed(2);
        const headers = getTableHeaders($elements.metalTable);
        const rowHtml = `<tr>${[values.purity, values.grm.toFixed(2), values.rateGrm.toFixed(2), values.totalMetal.toFixed(2), values.makingCharges.toFixed(2), total, '<button class="btn btn-remove remove-metal-row">Remove</button>']
            .map((val, i) => `<td data-label="${headers[i] || ''}">${val}</td>`).join('')}</tr>`;

        $elements.metalTable.find('tbody').append(rowHtml);
        $entry.remove();
        createMetalEntryForm();
        updateMetalSummaryTable();
        updateTotalMetalAmountsAndSummary();
        showToast('Metal item added successfully!', 'success');
    });

    $(document).on('click', '.remove-metal-row', function() {
        $(this).closest('tr').remove();
        updateMetalSummaryTable();
        updateTotalMetalAmountsAndSummary();
    });

    function updateMetalSummaryTable() {
        const $tbody = $elements.metalSummaryTable.find('tbody').empty();
        const headers = getTableHeaders($elements.metalSummaryTable);
        const totalDiamondAmount = parseFloat($elements.totalDiamondAmount.val()) || 0;

        $elements.metalTable.find('tbody tr').each(function() {
            const $row = $(this);
            const totalMetal = parseFloat($row.find('td:nth-child(4)').text()) || 0;
            const makingCharges = parseFloat($row.find('td:nth-child(5)').text()) || 0;
            const total = (totalMetal + makingCharges + totalDiamondAmount).toFixed(2);
            const values = [
                $row.find('td:nth-child(1)').text(),
                $row.find('td:nth-child(2)').text(),
                $row.find('td:nth-child(3)').text(),
                totalMetal.toFixed(2),
                makingCharges.toFixed(2),
                totalDiamondAmount.toFixed(2),
                total
            ];
            $tbody.append(`<tr>${values.map((val, i) => `<td data-label="${headers[i] || ''}">${val}</td>`).join('')}</tr>`);
        });
    }

    function updateTotalMetalAmountsAndSummary() {
        $elements.summaryIdSku.text($elements.itemIdSku.val().trim() || '-');
        $elements.summaryCategory.text($elements.itemCategory.val() || '-');
        updateMetalSummaryTable();
    }

    const debouncedCalculateDiamondTotal = debounce(calculateDiamondTotal, 200);

    $elements.diamondShape.on('change', function() {
        const shape = $(this).val();
        $elements.shapeMmDropdown.empty().append('<option value="">Select Shape & MM</option>').prop('disabled', false);
        $elements.diamondMm.val('').prop('readonly', false);
        $elements.priceCt.val('');
        $elements.manualPriceContainer.removeClass('visible').hide();
        $elements.manualPriceCt.val('');

        if (shape === 'OTHER') {
            $elements.diamondMm.val('Other').prop('readonly', true);
            $elements.shapeMmDropdown.prop('disabled', true);
            $elements.manualPriceContainer.addClass('visible').show();
            $elements.priceCt.prop('readonly', true);
        } else if (shape) {
            const filteredDiamonds = fetchedDiamondsData.filter(d => d.SHAPE === shape);
            $elements.shapeMmDropdown.append(filteredDiamonds.map(d => 
                `<option value="${d["MM & SHAPE"]}" data-mm="${d.MM}" data-price="${d["PRICE/CT"]}">${d["MM & SHAPE"]}</option>`).join(''));
        }
        $elements.shapeMmDropdown.trigger('change');
        debouncedCalculateDiamondTotal();
    });

    $elements.shapeMmDropdown.on('change', function() {
        const $option = $(this).find('option:selected');
        const mm = $option.data('mm');
        const price = $option.data('price');
        if (mm !== undefined) {
            $elements.priceCt.val(price !== undefined ? parseFloat(price).toFixed(2) : '');
        } else {
            $elements.priceCt.val('');
        }
        debouncedCalculateDiamondTotal();
    });

    $elements.manualPriceCt.on('input', function() {
        if ($elements.diamondShape.val() === 'OTHER') {
            const price = parseFloat($(this).val()) || 0;
            $elements.priceCt.val(price.toFixed(2));
            debouncedCalculateDiamondTotal();
        }
    });

    $elements.diamondPcs.on('input', () => { calculateTotalWeight(); debouncedCalculateDiamondTotal(); });
    $elements.weightPcs.on('input', () => { calculateTotalWeight(); debouncedCalculateDiamondTotal(); });

    $elements.diamondMm.on('input', function() {
        if ($elements.diamondShape.val() === 'OTHER' || $elements.shapeMmDropdown.val()) return;
        const mm = $(this).val();
        const shape = $elements.diamondShape.val();
        $elements.priceCt.val('');
        if (shape && mm) {
            const diamond = fetchedDiamondsData.find(d => d.SHAPE === shape && String(d.MM).trim() === mm.trim());
            if (diamond) {
                $elements.priceCt.val(parseFloat(diamond["PRICE/CT"]).toFixed(2));
                $elements.shapeMmDropdown.val(diamond["MM & SHAPE"]).trigger('change.select2');
            }
        }
        debouncedCalculateDiamondTotal();
    });

    function calculateTotalWeight() {
        const pcs = parseFloat($elements.diamondPcs.val()) || 0;
        const weightPcs = parseFloat($elements.weightPcs.val()) || 0;
        $elements.totalWeight.val((pcs * weightPcs).toFixed(2));
    }

    function calculateDiamondTotal() {
        const totalWeight = parseFloat($elements.totalWeight.val()) || 0;
        const priceCt = parseFloat($elements.diamondShape.val() === 'OTHER' ? $elements.manualPriceCt.val() : $elements.priceCt.val()) || 0;
        $elements.diamondTotal.val((totalWeight * priceCt).toFixed(2));
    }

    $elements.addDiamondBtn.on('click', function() {
        $elements.loadingSpinner.css('display', 'flex');
        $elements.addDiamondBtn.prop('disabled', true).addClass('disabled');

        const values = {
            shape: $elements.diamondShape.val()?.trim(),
            mm: $elements.diamondMm.val()?.trim(),
            pcs: parseFloat($elements.diamondPcs.val()) || 0,
            weightPcs: parseFloat($elements.weightPcs.val()) || 0,
            totalWeight: parseFloat($elements.totalWeight.val()) || 0,
            priceCt: parseFloat($elements.priceCt.val()) || 0,
            total: parseFloat($elements.diamondTotal.val()) || 0
        };

        if (!values.shape) {
            $elements.loadingSpinner.hide();
            $elements.addDiamondBtn.prop('disabled', false).removeClass('disabled');
            showPopup('Please select a valid Shape.', 'warning', 'Invalid Shape');
            return;
        }
        if (!values.mm || values.pcs <= 0 || values.weightPcs <= 0 || values.totalWeight <= 0 || values.priceCt <= 0 || values.total <= 0) {
            $elements.loadingSpinner.hide();
            $elements.addDiamondBtn.prop('disabled', false).removeClass('disabled');
            showPopup('Please fill all diamond fields with valid positive values.', 'warning', 'Invalid Diamond Values');
            return;
        }

        setTimeout(() => {
            const headers = getTableHeaders($elements.diamondTable);
            const selectedMm = $elements.shapeMmDropdown.find('option:selected').data('mm')?.toString().trim() || values.mm;
            const rowHtml = `<tr data-selected-mm-value="${selectedMm.replace(/"/g, '&quot;')}">${[
                values.shape, values.mm, values.pcs.toFixed(0), values.weightPcs.toFixed(2), values.totalWeight.toFixed(2),
                values.priceCt.toFixed(2), values.total.toFixed(2), '<button class="btn btn-remove remove-diamond">Remove</button>'
            ].map((val, i) => `<td data-label="${headers[i] || ''}">${val}</td>`).join('')}</tr>`;

            $elements.diamondTable.find('tbody').append(rowHtml);
            updateTotalDiamondAmount();
            resetDiamondForm();
            $elements.loadingSpinner.hide();
            $elements.addDiamondBtn.prop('disabled', false).removeClass('disabled');
            showToast('Diamond item added successfully!', 'success');
        }, 100);
    });

    $(document).on('click', '.remove-diamond', function() {
        $(this).closest('tr').remove();
        updateTotalDiamondAmount();
    });

    function resetDiamondForm() {
        $elements.diamondShape.val('').trigger('change');
        $elements.diamondMm.val('');
        $elements.diamondPcs.val('');
        $elements.weightPcs.val('');
        $elements.totalWeight.val('');
        $elements.manualPriceCt.val('');
        $elements.priceCt.val('');
        $elements.diamondTotal.val('');
    }

    function updateTotalDiamondAmount() {
        let total = 0;
        $elements.diamondTable.find('tbody tr').each(function() {
            total += parseFloat($(this).find('td:nth-child(7)').text()) || 0;
        });
        $elements.totalDiamondAmount.val(total.toFixed(2));
        updateTotalMetalAmountsAndSummary();
    }

    function renderImagePreviews() {
        $elements.itemImagePreviews.empty();
        currentImageUrls = currentImageUrls.filter(url => url?.startsWith('https://raw.githubusercontent.com/'));
        currentImageUrls.forEach((url, index) => {
            if (url) {
                $elements.itemImagePreviews.append(
                    `<div class="image-preview-wrapper"><img class="image-preview-input" src="${url}" alt="Image Preview ${index + 1}" data-index="${index}" loading="lazy"><button class="btn-remove-image" data-index="${index}" aria-label="Remove image ${index + 1}">X</button></div>`
                );
            }
        });
        $('.image-input-wrapper').toggleClass('has-image', currentImageUrls.length > 0);
        $elements.itemImagePreviews.prev('.image-input-wrapper').find('#imageInputText').text(currentImageUrls.length > 0 ? `${currentImageUrls.length} image(s) uploaded` : 'Click to upload or drag & drop');
        renderSummaryImagePreviews();
    }

    function renderSummaryImagePreviews() {
        $elements.summaryImagePreviews.empty();
        currentImageUrls.forEach((url, index) => {
            if (url) {
                $elements.summaryImagePreviews.append(
                    `<div class="image-preview-wrapper"><img class="summary-image-preview" src="${url}" alt="Summary Image ${index + 1}" data-index="${index}" loading="lazy"><button class="btn-remove-image" data-index="${index}" aria-label="Remove image ${index + 1}">X</button></div>`
                );
            }
        });
    }

    $('.image-input-wrapper').on('dragover', e => {
        e.preventDefault();
        $(e.currentTarget).addClass('dragover');
    }).on('dragleave', e => {
        e.preventDefault();
        $(e.currentTarget).removeClass('dragover');
    }).on('drop', e => {
        e.preventDefault();
        $(e.currentTarget).removeClass('dragover');
        const files = e.originalEvent.dataTransfer.files;
        if (files?.length) uploadImagesToGitHub(files);
    });

    $elements.itemImage.on('change', function() {
        if (this.files?.length) {
            uploadImagesToGitHub(this.files);
            $(this).val('');
        }
    });

    function uploadImagesToGitHub(files) {
        const formData = new FormData();
        let validImages = false;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                showPopup('Please drop only image files.', 'warning', 'Invalid File Type');
                return;
            }
            formData.append('images', file);
            validImages = true;
        });

        if (!validImages) return;

        $elements.loadingSpinner.css('display', 'flex');
        const uploadTimeout = setTimeout(() => {
            $elements.loadingSpinner.hide();
            showPopup('Image upload timed out. Please try again.', 'error', 'Upload Timeout');
        }, 15000);

        fetch('/api/upload-image', { method: 'POST', body: formData })
            .then(response => {
                clearTimeout(uploadTimeout);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data.imageUrls)) {
                    currentImageUrls.push(...data.imageUrls);
                    renderImagePreviews();
                    $elements.loadingSpinner.hide();
                    showPopup('Images uploaded successfully!', 'success', 'Image Upload Successful');
                } else {
                    throw new Error('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error uploading images:', error);
                clearTimeout(uploadTimeout);
                $elements.loadingSpinner.hide();
                showPopup(`Error: Failed to upload images. ${error.message}`, 'error', 'Image Upload Failed');
            });
    }

    $(document).on('click', '.btn-remove-image', function(e) {
        e.stopPropagation();
        const index = $(this).data('index');
        const url = currentImageUrls[index];
        showConfirmation('Are you sure you want to delete this image?', 'Confirm Deletion', confirmed => {
            if (confirmed) {
                $elements.loadingSpinner.css('display', 'flex');
                fetch('/api/delete-image', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(() => {
                    currentImageUrls.splice(index, 1);
                    renderImagePreviews();
                    $elements.loadingSpinner.hide();
                    showPopup('Image deleted successfully!', 'success', 'Image Deletion Successful');
                })
                .catch(error => {
                    console.error('Error deleting image:', error);
                    $elements.loadingSpinner.hide();
                    showPopup(`Error: Failed to delete image. ${error.message}`, 'error', 'Image Deletion Failed');
                });
            }
        });
    });

    $elements.itemIdSku.on('input', updateTotalMetalAmountsAndSummary);
    $elements.itemCategory.on('change', updateTotalMetalAmountsAndSummary);

    $elements.resetQuotationBtn.on('click', () => {
        showConfirmation('Are you sure you want to reset all fields?', 'Confirm Reset', confirmed => {
            if (confirmed) {
                $elements.loadingSpinner.css('display', 'flex');
                setTimeout(() => {
                    try {
                        resetQuotationForm();
                        $elements.loadingSpinner.hide();
                        showPopup('Quotation form reset.', 'success', 'Form Reset');
                    } catch (error) {
                        console.error('Error during reset:', error);
                        $elements.loadingSpinner.hide();
                        showPopup(`Error: Failed to reset quotation. ${error.message}`, 'error', 'Reset Failed');
                    }
                }, 100);
            }
        });
    });

    function resetQuotationForm() {
        $('input[type="text"], input[type="number"]').val('');
        $('select.category-select, select.shape-select, select.shape-mm-select').val('').trigger('change');
        currentImageUrls = [];
        renderImagePreviews();
        $elements.metalTable.find('tbody').empty();
        $elements.diamondTable.find('tbody').empty();
        $elements.metalSummaryTable.find('tbody').empty();
        $elements.metalEntriesContainer.empty();
        createMetalEntryForm();
        $elements.summaryIdSku.text('-');
        $elements.summaryCategory.text('-');
        $elements.totalDiamondAmount.val('');
        $elements.imageModal.hide();
        $elements.modalImageContent.attr('src', '');
        $elements.imageModalCaption.text('');
        currentQuotationId = null;
        updateTotalMetalAmountsAndSummary();
        updateTotalDiamondAmount();
    }

    function getQuotationData(includeIdAndDate = true) {
        const quotationData = {
            identification: {
                idSku: $elements.itemIdSku.val().trim(),
                category: $elements.itemCategory.val(),
                images: currentImageUrls
            },
            metalItems: [],
            diamondItems: [],
            summary: {
                idSku: $elements.summaryIdSku.text(),
                category: $elements.summaryCategory.text(),
                totalDiamondAmount: $elements.totalDiamondAmount.val() || '0.00',
                metalSummary: []
            }
        };

        if (includeIdAndDate) {
            quotationData.quotationId = currentQuotationId;
            quotationData.quotationDate = new Date().toISOString();
        }

        $elements.metalTable.find('tbody tr').each(function() {
            const $row = $(this);
            quotationData.metalItems.push({
                purity: $row.find('td:nth-child(1)').text().trim(),
                grams: $row.find('td:nth-child(2)').text().trim(),
                ratePerGram: $row.find('td:nth-child(3)').text().trim(),
                totalMetal: $row.find('td:nth-child(4)').text().trim(),
                makingCharges: $row.find('td:nth-child(5)').text().trim(),
                total: $row.find('td:nth-child(6)').text().trim()
            });
        });

        $elements.diamondTable.find('tbody tr').each(function() {
            const $row = $(this);
            const userEnteredMm = $row.find('td:nth-child(2)').text().trim();
            const selectedMm = $row.data('selected-mm-value') !== undefined ? String($row.data('selected-mm-value')) : userEnteredMm;
            quotationData.diamondItems.push({
                shape: $row.find('td:nth-child(1)').text().trim(),
                mm: selectedMm,
                userMM: userEnteredMm,
                pcs: $row.find('td:nth-child(3)').text().trim(),
                weightPerPiece: $row.find('td:nth-child(4)').text().trim(),
                totalWeightCt: $row.find('td:nth-child(5)').text().trim(),
                pricePerCt: $row.find('td:nth-child(6)').text().trim(),
                total: $row.find('td:nth-child(7)').text().trim()
            });
        });

        $elements.metalSummaryTable.find('tbody tr').each(function() {
            const $row = $(this);
            quotationData.summary.metalSummary.push({
                purity: $row.find('td:nth-child(1)').text().trim(),
                grams: $row.find('td:nth-child(2)').text().trim(),
                ratePerGram: $row.find('td:nth-child(3)').text().trim(),
                totalMetal: $row.find('td:nth-child(4)').text().trim(),
                makingCharges: $row.find('td:nth-child(5)').text().trim(),
                totalDiamondAmount: $row.find('td:nth-child(6)').text().trim(),
                total: $row.find('td:nth-child(7)').text().trim()
            });
        });

        return quotationData;
    }

    $elements.saveQuotationJsonBtn.on('click', function() {
        const idSku = $elements.itemIdSku.val().trim();
        const category = $elements.itemCategory.val();
        const totalDiamondAmount = $elements.totalDiamondAmount.val();
        const metalRows = $elements.metalTable.find('tbody tr');
        const metalSummaryRows = $elements.metalSummaryTable.find('tbody tr');

        if (!idSku || !category || metalRows.length === 0 || metalSummaryRows.length === 0 || !totalDiamondAmount || isNaN(totalDiamondAmount) || parseFloat(totalDiamondAmount) < 0) {
            showPopup('Please complete all required fields.', 'warning', 'Validation Error');
            return;
        }

        const quotationData = getQuotationData();
        $elements.loadingSpinner.css('display', 'flex');
        $elements.saveQuotationJsonBtn.prop('disabled', true).addClass('disabled');
        $elements.saveLoader.show();

        $.ajax({
            url: '/api/save-quotation',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(quotationData)
        }).done(response => {
            currentQuotationId = response.quotationId;
            $elements.loadingSpinner.hide();
            $elements.saveLoader.hide();
            $elements.saveQuotationJsonBtn.prop('disabled', false).removeClass('disabled');
            showPopup(`Quotation ${currentQuotationId} saved successfully!`, 'success', 'Save Successful');
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.error('Failed to save quotation:', textStatus, errorThrown);
            $elements.loadingSpinner.hide();
            $elements.saveLoader.hide();
            $elements.saveQuotationJsonBtn.prop('disabled', false).removeClass('disabled');
            showPopup(`Failed to save quotation. ${jqXHR.responseJSON?.error?.message || ''}`, 'error', 'Save Failed');
        });
    });

    $elements.downloadExcelBtn.on('click', function() {
        console.log('Download Excel button clicked'); // Debug log
        if (typeof XLSX === 'undefined') {
            showPopup('Error: Excel library (SheetJS) is not loaded. Please check your setup.', 'error', 'Library Error');
            return;
        }

        const quotationData = getQuotationData(true);
        if (!quotationData.identification.idSku || !quotationData.identification.category ||
            quotationData.metalItems.length === 0 || quotationData.diamondItems.length === 0) {
            showPopup('Please complete all required fields before downloading.', 'warning', 'Incomplete Data');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
                'Quotation ID': quotationData.quotationId || 'N/A',
                'SKU ID': quotationData.identification.idSku,
                'Category': quotationData.identification.category,
                'Date': quotationData.quotationDate ? new Date(quotationData.quotationDate).toLocaleString() : 'N/A',
                'Images': quotationData.identification.images.join(', ')
            }]), 'Identification');

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                quotationData.metalItems.map((item, index) => ({
                    'S.No': index + 1, 'Metal & Purity': item.purity, 'Grams': item.grams, 'Rate/Gram (₹)': item.ratePerGram,
                    'Total Metal (₹)': item.totalMetal, 'Making Charges (₹)': item.makingCharges, 'Total (₹)': item.total
                }))
            ), 'Metal Details');

            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                quotationData.diamondItems.map((item, index) => ({
                    'S.No': index + 1, 'Shape': item.shape, 'Selected MM': item.mm, 'Entered MM': item.userMM,
                    'PCS': item.pcs, 'Weight/PCS': item.weightPerPiece, 'Total Weight/CT': item.totalWeightCt,
                    'Price/CT': item.pricePerCt, 'Total (₹)': item.total
                }))
            ), 'Diamond Details');

            const summaryData = quotationData.summary.metalSummary.map((item, index) => ({
                'S.No': index + 1,
                'Metal & Purity': item.purity,
                'Grams': item.grams,
                'Rate/Gram (₹)': item.ratePerGram,
                'Total Metal (₹)': item.totalMetal,
                'Making Charges (₹)': item.makingCharges, // Fixed the key name
                'Total Diamond Amount (₹)': item.totalDiamondAmount,
                'Total (₹)': item.total
            })).concat([
                { 'S.No': '', 'Metal & Purity': 'Quotation ID', 'Grams': quotationData.quotationId || 'N/A' },
                { 'S.No': '', 'Metal & Purity': 'SKU ID', 'Grams': quotationData.identification.idSku },
                { 'S.No': '', 'Metal & Purity': 'Category', 'Grams': quotationData.identification.category },
                { 'S.No': '', 'Metal & Purity': 'Date', 'Grams': quotationData.quotationDate ? new Date(quotationData.quotationDate).toLocaleString() : 'N/A' }
            ]);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

            const baseName = quotationData.identification.idSku || quotationData.quotationId || 'Untitled';
            XLSX.writeFile(wb, `Quotation_${baseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            showPopup('Excel file downloaded successfully!', 'success', 'Download Successful');
        } catch (error) {
            console.error('Error generating Excel file:', error);
            showPopup(`Error: Failed to generate Excel file. ${error.message}`, 'error', 'Download Failed');
        }
    });

    $(document).on('click', '.image-preview-input, .summary-image-preview', function() {
        const src = $(this).attr('src');
        const index = $(this).data('index');
        $elements.modalImageContent.attr('src', src).attr('loading', 'lazy');
        $elements.imageModalCaption.text(`Image ${index + 1}`);
        $elements.imageModal.show();
    });

    $elements.imageModalClose.on('click', () => {
        $elements.imageModal.hide();
        $elements.modalImageContent.attr('src', '');
        $elements.imageModalCaption.text('');
    });

    $elements.imageModal.on('click', e => {
        if (e.target === $elements.imageModal[0]) {
            $elements.imageModal.hide();
            $elements.modalImageContent.attr('src', '');
            $elements.imageModalCaption.text('');
        }
    });

    // Navbar toggle
    const menu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu-list');
    if (menu && navMenu) {
        menu.addEventListener('click', () => {
            menu.classList.toggle('is-active');
            navMenu.classList.toggle('active');
        });
        navMenu.querySelectorAll('.nav-links').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    menu.classList.remove('is-active');
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    updateTotalMetalAmountsAndSummary();
    updateTotalDiamondAmount();
});