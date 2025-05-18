$(document).ready(function() {
    // Global variable to store fetched diamond data
    let fetchedDiamondsData = [];
    let currentImageBase64 = null;

    // --- START: Custom Popup Modal Logic ---
    const popupModal = $('#customPopupModal');
    const popupTitle = $('#customPopupTitle');
    const popupMessage = $('#customPopupMessage');
    const popupCloseBtn = $('#customPopupCloseBtn');
    const popupOkBtn = $('#customPopupOkBtn');
    const popupConfirmBtn = $('#customPopupConfirmBtn');
    const popupCancelBtn = $('#customPopupCancelBtn');
    const popupHeader = $('.popup-modal-header');

    let confirmationCallback = null;

    function showPopup(message, type = 'info', title = 'Notification') {
        console.log('showPopup called with:', { message, type, title });
        try {
            popupTitle.text(title || 'Notification');
            popupMessage.html(message || 'No message provided');
            popupHeader.removeClass('success error warning info').addClass(type);
            popupOkBtn.show();
            popupConfirmBtn.hide();
            popupCancelBtn.hide();
            popupModal.css('display', 'flex');
            console.log('Modal display:', popupModal.css('display'), 'Visible:', popupModal.is(':visible'));
        } catch (error) {
            console.error('Error in showPopup:', error);
        }
    }

    function showConfirmation(message, title = 'Confirm Action', callback) {
        console.log('showConfirmation called with:', { message, title });
        popupTitle.text(title);
        popupMessage.html(message);
        confirmationCallback = callback;
        popupHeader.removeClass('success error warning info').addClass('warning');
        popupOkBtn.hide();
        popupConfirmBtn.show();
        popupCancelBtn.show();
        popupModal.css('display', 'flex');
        console.log('showConfirmation displayed');
    }
    
    popupConfirmBtn.on('click', function() {
        console.log('Confirm button clicked');
        if (confirmationCallback) {
            popupModal.css('display', 'none'); // Explicitly hide
            console.log('Confirmation modal hidden');
            confirmationCallback(true);
        }
        resetConfirmationCallback();
    });

    function hidePopup() {
        popupModal.hide();
    }

    function resetConfirmationCallback() {
        confirmationCallback = null;
    }

    popupCloseBtn.on('click', function() {
        if (confirmationCallback) {
            confirmationCallback(false);
        }
        hidePopup();
        resetConfirmationCallback();
    });

    popupOkBtn.on('click', function() {
        hidePopup();
    });

    popupConfirmBtn.on('click', function() {
        console.log('Confirm button clicked');
        if (confirmationCallback) {
            popupModal.css('display', 'none'); // Explicitly hide
            console.log('Confirmation modal hidden');
            confirmationCallback(true);
        }
        resetConfirmationCallback();
    });

    popupCancelBtn.on('click', function() {
        if (confirmationCallback) {
            confirmationCallback(false);
        }
        hidePopup();
        resetConfirmationCallback();
    });

    popupModal.on('click', function(event) {
        if (event.target === this) {
            if (confirmationCallback) {
                confirmationCallback(false);
            }
            hidePopup();
            resetConfirmationCallback();
        }
    });
    // --- END: Custom Popup Modal Logic ---

    // Navbar toggle
    const menu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu-list');

    if (menu && navMenu) {
        menu.addEventListener('click', () => {
            menu.classList.toggle('is-active');
            navMenu.classList.toggle('active');
        });

        const navLinks = navMenu.querySelectorAll('.nav-links');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    menu.classList.remove('is-active');
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    const metalPurityOptions = [
        { value: "G10", text: "10KT Gold" }, { value: "G14", text: "14KT Gold" },
        { value: "G18", text: "18KT Gold" }, { value: "G22", text: "22KT Gold" },
        { value: "G24", text: "24KT Gold" },
        { value: "S10", text: "10KT Silver" }, { value: "S14", text: "14KT Silver" },
        { value: "S18", text: "18KT Silver" }, { value: "S22", text: "22KT Silver" },
        { value: "S24", text: "24KT Silver" },
        { value: "P10", text: "10KT Platinum" }, { value: "P14", text: "14KT Platinum" },
        { value: "P18", text: "18KT Platinum" }, { value: "P22", text: "22KT Platinum" },
        { value: "P24", text: "24KT Platinum" },
        { value: "S925", text: "925 Silver" },
        { value: "P950", text: "PT950 Platinum" }
    ];

    $('.shape-select, .shape-mm-select, .category-select').select2({ width: '100%', theme: 'default' });

    function initializeSelect2ForMetalEntry(entryElement) {
        entryElement.find('.metalPuritySelect').select2({ width: '100%', theme: 'default' });
    }

    function createMetalEntryForm(containerSelector, options) {
        const entryId = `metalEntry-${Date.now()}`;
        let optionsHtml = '<option value="">Select Metal & Purity</option>';
        options.forEach(opt => {
            optionsHtml += `<option value="${opt.value}">${opt.text}</option>`;
        });

        const entryHtml = `
            <div class="metal-entry" id="${entryId}" data-entry-type="metal">
                <div class="form-row">
                    <div class="form-group">
                        <label>Metal & Purity</label>
                        <select class="metalPuritySelect">${optionsHtml}</select>
                    </div>
                    <div class="form-group">
                        <label>Grams</label>
                        <input type="number" class="grm" placeholder="e.g., 10.5" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Rate/Gram (₹)</label>
                        <input type="number" class="rateGrm" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Total Metal Amount (₹)</label>
                        <input type="number" class="totalMetalValue" readonly>
                    </div>
                    <div class="form-group">
                        <label>Making Charges (₹)</label>
                        <input type="number" class="makingCharges" readonly>
                    </div>
                    <div class="form-group form-group-action">
                        <button class="btn btn-add add-metal-entry-to-table">Add to Quotation</button>
                    </div>
                </div>
            </div>
        `;
        const $newEntry = $(entryHtml);
        $(containerSelector).append($newEntry);
        initializeSelect2ForMetalEntry($newEntry);
    }

    createMetalEntryForm('#metalEntriesContainer', metalPurityOptions);

    function initializeDiamondSection() {
        const $diamondShapeSelect = $('#diamondShape');
        $diamondShapeSelect.empty().append('<option value="">Select Shape</option>');

        if (!fetchedDiamondsData || fetchedDiamondsData.length === 0) {
            console.warn("No diamond data fetched to populate shapes.");
            $diamondShapeSelect.append(`<option value="OTHER">OTHER</option>`);
            $diamondShapeSelect.trigger('change');
            return;
        }

        const uniqueShapesSet = new Set(
            fetchedDiamondsData.map(item => item.SHAPE ? item.SHAPE.trim() : null).filter(shape => shape)
        );

        let finalShapes = Array.from(uniqueShapesSet);
        const otherIndex = finalShapes.indexOf("OTHER");
        if (otherIndex > -1) {
            finalShapes.splice(otherIndex, 1);
        }
        finalShapes.sort();
        finalShapes.push("OTHER");

        finalShapes.forEach(shape => {
            $diamondShapeSelect.append(`<option value="${shape}">${shape}</option>`);
        });
        $diamondShapeSelect.trigger('change');
    }

    $.getJSON('/api/diamonds', function(data) {
        fetchedDiamondsData = data;
        if (Array.isArray(fetchedDiamondsData)) {
            fetchedDiamondsData = fetchedDiamondsData.map(d => ({...d, SHAPE: d.SHAPE ? d.SHAPE.trim() : ''}));
        } else {
            console.error("Fetched diamond data is not an array:", fetchedDiamondsData);
            fetchedDiamondsData = [];
        }
        initializeDiamondSection();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Failed to fetch diamond data:", textStatus, errorThrown);
        showPopup("Error: Could not load diamond data from the server. Please check console.", 'error', 'Data Load Error');
        fetchedDiamondsData = [];
        initializeDiamondSection();
    });

    $('#addMetalItemBtn').on('click', function() {
        $('#metalEntriesContainer').empty();
        createMetalEntryForm('#metalEntriesContainer', metalPurityOptions);
    });

    $(document).on('change input', '.metal-entry .metalPuritySelect, .metal-entry .grm', function() {
        const entry = $(this).closest('.metal-entry');
        const grmVal = entry.find('.grm').val();
        const grm = parseFloat(grmVal) || 0;
        const selectedPurityValue = entry.find('.metalPuritySelect').val();

        if (grm > 0 && selectedPurityValue) {
            const rates = {
                "G10": 3000, "G14": 4000, "G18": 5000, "G22": 5500, "G24": 6000,
                "S10": 50, "S14": 60, "S18": 70, "S22": 80, "S24": 90, "S925": 75,
                "P10": 2000, "P14": 2200, "P18": 2500, "P22": 2800, "P24": 3000, "P950": 2600
            };
            const rateGrm = rates[selectedPurityValue] || 0;
            entry.find('.rateGrm').val(rateGrm.toFixed(2));

            const totalMetal = grm * rateGrm;
            entry.find('.totalMetalValue').val(totalMetal.toFixed(2));

            const makingCharges = (800 * grm);
            entry.find('.makingCharges').val(makingCharges.toFixed(2));
        } else {
            entry.find('.rateGrm, .totalMetalValue, .makingCharges').val('');
        }
    });

    function getTableHeaders($table) {
        return $table.find('thead th').map((i, th) => $(th).text()).get();
    }

    $(document).on('click', '.add-metal-entry-to-table', function() {
        const entry = $(this).closest('.metal-entry');
        const purityValue = entry.find('.metalPuritySelect').val();
        const grm = entry.find('.grm').val();
        const rateGrm = entry.find('.rateGrm').val();
        const totalMetal = entry.find('.totalMetalValue').val();
        const makingCharges = entry.find('.makingCharges').val();

        if (!purityValue || !grm || !rateGrm || !totalMetal || !makingCharges) {
            showPopup('Please fill all metal fields and ensure calculations are complete.', 'warning', 'Incomplete Metal Details');
            return;
        }

        const $table = $('#metalTable');
        const headers = getTableHeaders($table);
        const values = [
            purityValue,
            parseFloat(grm).toFixed(2),
            parseFloat(rateGrm).toFixed(2),
            parseFloat(totalMetal).toFixed(2),
            parseFloat(makingCharges).toFixed(2),
            '<button class="btn btn-remove remove-metal-row">Remove</button>'
        ];

        let newRowHtml = '<tr>';
        values.forEach((val, index) => {
            newRowHtml += `<td data-label="${headers[index] || ''}">${val}</td>`;
        });
        newRowHtml += '</tr>';

        $table.find('tbody').append(newRowHtml);
        updateTotalMetalAmountsAndSummary();
        entry.remove();

        showPopup('Metal item added to the quotation successfully!', 'success', 'Metal Added');
    });

    $(document).on('click', '.remove-metal-row', function() {
        $(this).closest('tr').remove();
        updateTotalMetalAmountsAndSummary();
    });

    function updateTotalMetalAmountsAndSummary() {
        let totalMetalOverall = 0;
        let totalMakingChargesOverall = 0;
        let purityList = [];
        const tableSelector = `#metalTable tbody`;

        $(tableSelector + ' tr').each(function() {
            totalMetalOverall += parseFloat($(this).find('td:nth-child(4)').text()) || 0;
            totalMakingChargesOverall += parseFloat($(this).find('td:nth-child(5)').text()) || 0;
            purityList.push($(this).find('td:nth-child(1)').text());
        });

        $('#totalMetalAmount').val(totalMetalOverall.toFixed(2));
        $('#totalMetalMakingCharges').val(totalMakingChargesOverall.toFixed(2));

        const uniquePurities = [...new Set(purityList)];
        $('#summaryMetalPurity').text(uniquePurities.length > 0 ? uniquePurities.join(', ') : '-');
        $('#summaryMetalAmount').text(totalMetalOverall.toFixed(2));
        $('#summaryMetalMakingCharges').text(totalMakingChargesOverall.toFixed(2));

        updateDetailedSummary();
        updateFinalSummary();
    }

    $('#diamondShape').on('change', function() {
        const selectedShape = $(this).val();
        const $shapeMmDropdown = $('#shapeMmDropdown');
        $shapeMmDropdown.empty().append('<option value="">Select Shape & MM</option>');
        $('#diamondMm').val('').prop('readonly', false);
        $('#priceCt').val('');
        $('#manualPriceContainer').removeClass('visible').hide();
        $('#manualPriceCt').val('');

        if (selectedShape === 'OTHER') {
            $('#diamondMm').val('Other').prop('readonly', true);
            $shapeMmDropdown.prop('disabled', true);
            $('#manualPriceContainer').addClass('visible').show();
            $('#priceCt').val('').prop('readonly', true);
        } else if (selectedShape) {
            $shapeMmDropdown.prop('disabled', false);
            const filteredDiamonds = fetchedDiamondsData.filter(d => d.SHAPE === selectedShape);
            filteredDiamonds.forEach(diamond => {
                $shapeMmDropdown.append(`<option value="${diamond["MM & SHAPE"]}" data-mm="${diamond.MM}" data-price="${diamond["PRICE/CT"]}">${diamond["MM & SHAPE"]}</option>`);
            });
        } else {
            $shapeMmDropdown.prop('disabled', false);
        }
        $shapeMmDropdown.trigger('change');
        calculateDiamondTotal();
    });

    $('#shapeMmDropdown').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const mmValue = selectedOption.data('mm');
        const priceCt = selectedOption.data('price');

        if (mmValue !== undefined) {
            $('#diamondMm').val(mmValue);
            $('#priceCt').val(priceCt !== undefined ? parseFloat(priceCt).toFixed(2) : '');
        } else {
            if ($('#diamondShape').val() !== 'OTHER') {
                $('#diamondMm').val('');
            }
            $('#priceCt').val('');
        }
        calculateDiamondTotal();
    });

    $('#manualPriceCt').on('input', function() {
        if ($('#diamondShape').val() === 'OTHER') {
            const manualPrice = parseFloat($(this).val()) || 0;
            $('#priceCt').val(manualPrice.toFixed(2));
            calculateDiamondTotal();
        }
    });

    $('#diamondPcs, #weightPcs').on('input', function() {
        calculateTotalWeight();
        calculateDiamondTotal();
    });

    $('#diamondMm').on('input', function() {
        if ($('#diamondShape').val() === 'OTHER' || $('#shapeMmDropdown').val()) return;

        const manualMm = $(this).val();
        const selectedShape = $('#diamondShape').val();
        $('#priceCt').val('');

        if (selectedShape && manualMm) {
            const matchingDiamond = fetchedDiamondsData.find(d => d.SHAPE === selectedShape && String(d.MM).trim() === String(manualMm).trim());
            if (matchingDiamond) {
                $('#priceCt').val(parseFloat(matchingDiamond["PRICE/CT"]).toFixed(2));
                $('#shapeMmDropdown').val(matchingDiamond["MM & SHAPE"]).trigger('change.select2');
            }
        }
        calculateDiamondTotal();
    });

    function calculateTotalWeight() {
        const pcs = parseFloat($('#diamondPcs').val()) || 0;
        const weightPcs = parseFloat($('#weightPcs').val()) || 0;
        $('#totalWeight').val((pcs * weightPcs).toFixed(2));
    }

    function calculateDiamondTotal() {
        const totalWeight = parseFloat($('#totalWeight').val()) || 0;
        let priceCtVal;

        if ($('#diamondShape').val() === 'OTHER') {
            priceCtVal = parseFloat($('#manualPriceCt').val()) || 0;
            if (document.activeElement === document.getElementById('manualPriceCt')) {
                $('#priceCt').val(priceCtVal.toFixed(2));
            }
        } else {
            priceCtVal = parseFloat($('#priceCt').val()) || 0;
        }

        $('#diamondTotal').val((totalWeight * priceCtVal).toFixed(2));
    }

    $('#addDiamondBtn').on('click', function() {
        const shape = $('#diamondShape').val();
        const mm = $('#diamondMm').val();
        const pcs = $('#diamondPcs').val();
        const weightPcs = $('#weightPcs').val();
        const totalWeight = $('#totalWeight').val();
        const priceCtEntry = $('#priceCt').val();
        const diamondTotalValue = $('#diamondTotal').val();

        if (!shape || !mm || !pcs || !weightPcs || !totalWeight) {
            showPopup('Please fill all diamond fields.', 'warning', 'Incomplete Diamond Details');
            return;
        }

        if (!priceCtEntry || parseFloat(priceCtEntry) < 0) {
            showPopup('Please enter a valid Price/CT.', 'warning', 'Invalid Price');
            return;
        }

        const $table = $('#diamondTable');
        const headers = getTableHeaders($table);
        const values = [
            shape, mm, pcs, weightPcs, totalWeight,
            parseFloat(priceCtEntry).toFixed(2),
            parseFloat(diamondTotalValue).toFixed(2),
            '<button class="btn btn-remove remove-diamond">Remove</button>'
        ];

        let newRowHtml = '<tr>';
        values.forEach((val, index) => {
            newRowHtml += `<td data-label="${headers[index] || ''}">${val}</td>`;
        });
        newRowHtml += '</tr>';

        $table.find('tbody').append(newRowHtml);
        updateTotalDiamondAmount();
        resetDiamondForm();

        showPopup('Diamond added to the quotation successfully!', 'success', 'Diamond Added');
    });

    $(document).on('click', '.remove-diamond', function() {
        $(this).closest('tr').remove();
        updateTotalDiamondAmount();
    });

    function resetDiamondForm() {
        $('#diamondShape').val('').trigger('change');
        $('#diamondPcs').val('');
        $('#weightPcs').val('');
        $('#totalWeight').val('');
        $('#manualPriceCt').val('');
        $('#diamondTotal').val('');
    }

    function updateTotalDiamondAmount() {
        let total = 0;
        $('#diamondTable tbody tr').each(function() { total += parseFloat($(this).find('td:nth-child(7)').text()) || 0; });
        $('#totalDiamondAmount').val(total.toFixed(2));
        $('#summaryDiamondAmount').text(total.toFixed(2));
        updateDetailedSummary();
        updateFinalSummary();
    }

    function getMetalDataGrouped() {
        const groupedData = {};
        const tableSelector = `#metalTable tbody`;
        $(tableSelector + ' tr').each(function() {
            const purityFullText = $(this).find('td:nth-child(1)').text();
            const metalAmount = parseFloat($(this).find('td:nth-child(4)').text()) || 0;
            const makingCharges = parseFloat($(this).find('td:nth-child(5)').text()) || 0;

            if (!groupedData[purityFullText]) {
                groupedData[purityFullText] = { metalAmount: 0, makingCharges: 0 };
            }
            groupedData[purityFullText].metalAmount += metalAmount;
            groupedData[purityFullText].makingCharges += makingCharges;
        });
        return groupedData;
    }

    function updateDetailedSummary() {
        const $tableBody = $('#detailedSummaryTable tbody');
        const $table = $('#detailedSummaryTable');
        const headers = getTableHeaders($table);
        $tableBody.empty();

        let grandTotalMetal = 0;
        let grandTotalMaking = 0;
        let grandTotalDiamond = 0;

        const metalDataGrouped = getMetalDataGrouped();
        Object.keys(metalDataGrouped).sort().forEach(purityFullText => {
            if (!purityFullText || purityFullText === "Select Metal & Purity") return;
            const values = metalDataGrouped[purityFullText];
            grandTotalMetal += values.metalAmount;
            grandTotalMaking += values.makingCharges;

            let diamondAmountForMetal = 0;
            $('#diamondTable tbody tr').each(function() {
                const $row = $(this);
                const diamondTotal = parseFloat($row.find('td:nth-child(7)').text()) || 0;
                diamondAmountForMetal += diamondTotal;
            });

            grandTotalDiamond += diamondAmountForMetal;

            const totalForRow = values.metalAmount + values.makingCharges + diamondAmountForMetal;

            let rowHtml = '<tr>';
            rowHtml += `<td data-label="${headers[0]}">${purityFullText}</td>`;
            rowHtml += `<td data-label="${headers[1]}">${values.metalAmount.toFixed(2)}</td>`;
            rowHtml += `<td data-label="${headers[2]}">${values.makingCharges.toFixed(2)}</td>`;
            rowHtml += `<td data-label="${headers[3]}">${diamondAmountForMetal.toFixed(2)}</td>`;
            rowHtml += `<td data-label="${headers[4]}">${totalForRow.toFixed(2)}</td>`;
            rowHtml += '</tr>';
            $tableBody.append(rowHtml);
        });

        $('#diamondTable tbody tr').each(function() {
            const $row = $(this);
            const shape = $row.find('td:nth-child(1)').text();
            const mm = $row.find('td:nth-child(2)').text();
            const pcs = $row.find('td:nth-child(3)').text();
            const total = parseFloat($row.find('td:nth-child(7)').text()) || 0;

            grandTotalDiamond += total;

            let diamondRowHtml = '<tr>';
            diamondRowHtml += `<td data-label="${headers[0]}">${shape} (${mm}, ${pcs} PCS)</td>`;
            diamondRowHtml += `<td data-label="${headers[1]}">-</td>`;
            diamondRowHtml += `<td data-label="${headers[2]}">-</td>`;
            diamondRowHtml += `<td data-label="${headers[3]}">${total.toFixed(2)}</td>`;
            diamondRowHtml += `<td data-label="${headers[4]}">${total.toFixed(2)}</td>`;
            diamondRowHtml += '</tr>';
            $tableBody.append(diamondRowHtml);
        });

        const grandTotalQuotation = grandTotalMetal + grandTotalMaking + grandTotalDiamond;

        if (grandTotalMetal > 0 || grandTotalMaking > 0 || grandTotalDiamond > 0) {
            let totalRowHtml = '<tr class="total-row">';
            totalRowHtml += `<td data-label="">GRAND TOTAL</td>`;
            totalRowHtml += `<td data-label="${headers[1]}" class="final-amount-cell">${grandTotalMetal.toFixed(2)}</td>`;
            totalRowHtml += `<td data-label="${headers[2]}" class="final-amount-cell">${grandTotalMaking.toFixed(2)}</td>`;
            totalRowHtml += `<td data-label="${headers[3]}" class="final-amount-cell">${grandTotalDiamond.toFixed(2)}</td>`;
            totalRowHtml += `<td data-label="${headers[4]}" class="final-amount-cell">${grandTotalQuotation.toFixed(2)}</td>`;
            totalRowHtml += '</tr>';
            $tableBody.append(totalRowHtml);
        }
    }

    function updateFinalSummary() {
        const totalMetal = parseFloat($('#totalMetalAmount').val()) || 0;
        const totalMakingCharges = parseFloat($('#totalMetalMakingCharges').val()) || 0;
        const totalDiamond = parseFloat($('#totalDiamondAmount').val()) || 0;
        const finalQuotation = totalMetal + totalMakingCharges + totalDiamond;
        $('#finalQuotation').text(finalQuotation.toFixed(2));
    }

    function getNextQuotationIdForStorage() {
        let lastId = localStorage.getItem('lastQuotationId');
        lastId = lastId ? parseInt(lastId, 10) : 0;
        const nextId = lastId + 1;
        localStorage.setItem('lastQuotationId', nextId);
        return `Q-${String(nextId).padStart(5, '0')}`;
    }

    $('#itemImage').on('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentImageBase64 = e.target.result;
                $('#itemImagePreviewInput').attr('src', currentImageBase64).show();
                $('#summaryImagePreview').attr('src', currentImageBase64).show();
                $('#imageInputText').text(file.name.length > 30 ? file.name.substring(0,27) + '...' : file.name);
                $('.image-input-wrapper').addClass('has-image');
                $('#removeImageBtn').show();
                console.log('Remove button shown:', $('#removeImageBtn').is(':visible'));
            }
            reader.readAsDataURL(file);
        }
    });

    $('#removeImageBtn').on('click', function() {
        currentImageBase64 = null;
        $('#itemImage').val('');
        $('#itemImagePreviewInput').attr('src', '#').hide();
        $('#summaryImagePreview').attr('src', '#').hide();
        $('#imageInputText').text('Click to upload or drag & drop');
        $('.image-input-wrapper').removeClass('has-image');
        $(this).hide();
    });

    function getQuotationData(includeIdAndDate = true) {
        const quotationData = {
            identification: {
                idSku: $('#itemIdSku').val().trim(),
                category: $('#itemCategory').val(),
                image: currentImageBase64
            },
            metalItems: [],
            diamondItems: [],
            summary: {
                totalMetalAmount: $('#totalMetalAmount').val(),
                totalMetalMakingCharges: $('#totalMetalMakingCharges').val(),
                metalPurities: $('#summaryMetalPurity').text(),
                totalDiamondAmount: $('#totalDiamondAmount').val(),
                finalQuotation: $('#finalQuotation').text(),
            },
            detailedSummaryTable: []
        };

        if (includeIdAndDate) {
            quotationData.quotationId = getNextQuotationIdForStorage();
            quotationData.quotationDate = new Date().toISOString();
        }

        $(`#metalTable tbody tr`).each(function() {
            const $row = $(this);
            quotationData.metalItems.push({
                purity: $row.find('td:nth-child(1)').text(),
                grams: $row.find('td:nth-child(2)').text(),
                ratePerGram: $row.find('td:nth-child(3)').text(),
                totalMetal: $row.find('td:nth-child(4)').text(),
                makingCharges: $row.find('td:nth-child(5)').text(),
            });
        });

        $('#diamondTable tbody tr').each(function() {
            const $row = $(this);
            quotationData.diamondItems.push({
                shape: $row.find('td:nth-child(1)').text(),
                mm: $row.find('td:nth-child(2)').text(),
                pcs: $row.find('td:nth-child(3)').text(),
                weightPerPiece: $row.find('td:nth-child(4)').text(),
                totalWeightCt: $row.find('td:nth-child(5)').text(),
                pricePerCt: $row.find('td:nth-child(6)').text(),
                total: $row.find('td:nth-child(7)').text(),
            });
        });

        $('#detailedSummaryTable tbody tr').each(function() {
            const $row = $(this);
            quotationData.detailedSummaryTable.push({
                description: $row.find('td:nth-child(1)').text(),
                metalAmount: $row.find('td:nth-child(2)').text(),
                makingCharges: $row.find('td:nth-child(3)').text(),
                diamondAmount: $row.find('td:nth-child(4)').text(),
                total: $row.find('td:nth-child(5)').text(),
            });
        });

        return quotationData;
    }

    $('#saveQuotationJsonBtn').on('click', function() {
        const idSku = $('#itemIdSku').val().trim();
        const category = $('#itemCategory').val();

        if (!idSku) {
            showPopup("The ID/SKU field is required. Please fill it before saving the quotation.", 'warning', 'Missing ID/SKU');
            return;
        }

        if (!category) {
            showPopup("The Category field is required. Please select a category before saving the quotation.", 'warning', 'Missing Category');
            return;
        }

        const quotationData = getQuotationData(true);

        if (!quotationData.metalItems.length && !quotationData.diamondItems.length) {
            showPopup("Cannot save an empty quotation. Please add some details.", 'warning', 'Empty Quotation');
            return;
        }

        fetch('/api/save-quotation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quotationData),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const err = JSON.parse(text);
                        throw err;
                    } catch (e) {
                        throw new Error(`Server responded with status ${response.status}: ${text}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            const displayId = quotationData.identification.idSku || quotationData.quotationId;
            showPopup(data.message || `Quotation for ${displayId} saved successfully!`, 'success', 'Save Successful');
            console.log('Success:', data);
        })
        .catch((error) => {
            let errorMessage = 'Unknown error. See console for details.';
            if (error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            showPopup(`Error saving quotation: ${errorMessage}`, 'error', 'Save Error');
            console.error('Error saving quotation:', error);
        });
    });

    $('#resetQuotationBtn').on('click', function() {
        console.log('Reset button clicked');
        showConfirmation("Are you sure you want to reset all fields? This action cannot be undone.", "Confirm Reset", function(confirmed) {
            console.log('Confirmation result:', confirmed);
            if (confirmed) {
                try {
                    console.log('Starting form reset');
                    $('input[type="text"], input[type="number"]').val('');
                    $('select.category-select, select.shape-select, select.shape-mm-select').val('').trigger('change');
                    $('#removeImageBtn').click();
                    $('#metalTable tbody').empty();
                    $('#diamondTable tbody').empty();
                    $('#detailedSummaryTable tbody').empty();
                    $('#metalEntriesContainer').empty();
                    createMetalEntryForm('#metalEntriesContainer', metalPurityOptions);
                    $('#summaryMetalPurity').text('-');
                    $('#summaryMetalAmount').text('0.00');
                    $('#summaryMetalMakingCharges').text('0.00');
                    $('#summaryDiamondAmount').text('0.00');
                    $('#finalQuotation').text('0.00');
                    updateTotalMetalAmountsAndSummary();
                    updateTotalDiamondAmount();
                    console.log('Form reset complete');
                    setTimeout(() => {
                        console.log('Calling showPopup');
                        showPopup("Quotation form has been reset.", 'info', 'Form Reset');
                    }, 500); // Increased delay
                } catch (error) {
                    console.error('Error during reset:', error);
                    showPopup(`Error resetting form: ${error.message}`, 'error', 'Reset Error');
                }
            }
        });
    });

    $('#downloadExcelBtn').on('click', function() {
        const quotationData = getQuotationData(false);
        
        // Check if there's any data to export
        if (!quotationData.metalItems.length && !quotationData.diamondItems.length) {
            showPopup("No data available to export. Please add some items first.", 'warning', 'No Data');
            return;
        }
    
        try {
            const wb = XLSX.utils.book_new();
            const userSku = quotationData.identification.idSku || 'Quotation';
            const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
            const fileName = `Quotation_${userSku}_${dateStr}.xlsx`;
    
            // 1. Summary Sheet
            const idSummaryData = [
                ["Item ID/SKU", quotationData.identification.idSku || "-"],
                ["Category", quotationData.identification.category || "-"],
                ["", ""],
                ["Total Metal Amount (₹)", parseFloat(quotationData.summary.totalMetalAmount) || 0],
                ["Metal Making Charges (₹)", parseFloat(quotationData.summary.totalMetalMakingCharges) || 0],
                ["Metal Purity Details", quotationData.summary.metalPurities],
                ["Total Diamond Amount (₹)", parseFloat(quotationData.summary.totalDiamondAmount) || 0],
                ["FINAL QUOTATION (₹)", parseFloat(quotationData.summary.finalQuotation) || 0],
            ];
            const wsIdSummary = XLSX.utils.aoa_to_sheet(idSummaryData);
            XLSX.utils.book_append_sheet(wb, wsIdSummary, "Summary");
    
            // 2. Metal Details Sheet (if data exists)
            if (quotationData.metalItems.length > 0) {
                const metalHeaders = ["Metal & Purity", "Grams", "Rate/Gram (₹)", "Total Metal (₹)", "Making Charges (₹)"];
                const metalData = quotationData.metalItems.map(item => [
                    item.purity,
                    parseFloat(item.grams),
                    parseFloat(item.ratePerGram),
                    parseFloat(item.totalMetal),
                    parseFloat(item.makingCharges)
                ]);
                const wsMetal = XLSX.utils.aoa_to_sheet([metalHeaders, ...metalData]);
                XLSX.utils.book_append_sheet(wb, wsMetal, "Metal Details");
            }
    
            // 3. Diamond Details Sheet (if data exists)
            if (quotationData.diamondItems.length > 0) {
                const diamondHeaders = ["Shape", "MM", "PCS", "Weight/PCS", "Total Weight CT", "Price/CT (₹)", "Total (₹)"];
                const diamondData = quotationData.diamondItems.map(item => [
                    item.shape,
                    item.mm,
                    parseInt(item.pcs),
                    parseFloat(item.weightPerPiece),
                    parseFloat(item.totalWeightCt),
                    parseFloat(item.pricePerCt),
                    parseFloat(item.total)
                ]);
                const wsDiamond = XLSX.utils.aoa_to_sheet([diamondHeaders, ...diamondData]);
                XLSX.utils.book_append_sheet(wb, wsDiamond, "Diamond Details");
            }
    
            // 4. Generate the Excel file
            XLSX.writeFile(wb, fileName);
            showPopup(`Excel file "${fileName}" downloaded successfully!`, 'success', 'Download Complete');
        } catch (error) {
            console.error('Error generating Excel file:', error);
            showPopup(`Failed to generate Excel file: ${error.message}`, 'error', 'Export Error');
        }
    });

    // Image Modal Logic
    $('#itemImagePreviewInput, #summaryImagePreview').on('click', function() {
        if (currentImageBase64) {
            $('#modalImageContent').attr('src', currentImageBase64);
            $('#imageModal').show();
        }
    });

    $('#imageModalClose').on('click', function() {
        $('#imageModal').hide();
    });

    $('#imageModal').on('click', function(event) {
        if (event.target === this) {
            $(this).hide();
        }
    });
});