const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DIAMONDS_FILE = path.join(__dirname, 'data', 'diamonds.json');
const METADATA_FILE = path.join(__dirname, 'data', 'metadata.json');

// Helper function to read data from a file
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify([], null, 2));
            return [];
        }
        throw err;
    }
}

// Helper function to write data to a file
async function writeData(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
        console.error('Error creating data directory:', err);
        throw err;
    }
}

// Routes

// Get all diamonds
app.get('/api/diamonds', async (req, res) => {
    try {
        const diamonds = await readData(DIAMONDS_FILE);
        res.json(diamonds);
    } catch (err) {
        console.error('Error reading diamonds.json:', err);
        res.status(500).json({ error: 'Failed to load diamond data' });
    }
});

// Add new diamond
app.post('/api/diamonds', async (req, res) => {
    try {
        const diamonds = await readData(DIAMONDS_FILE);
        const newDiamond = req.body;

        // Validate input
        if (!newDiamond.SHAPE || newDiamond.MM === undefined || typeof newDiamond['PRICE/CT'] !== 'number') {
            return res.status(400).json({ error: 'Invalid input: SHAPE, MM, and PRICE/CT are required, and PRICE/CT must be a number' });
        }

        if (newDiamond.SHAPE === 'ROUND' && typeof newDiamond.MM !== 'number') {
            return res.status(400).json({ error: 'MM must be a number for ROUND shape' });
        }

        // Generate ID
        newDiamond.id = diamonds.length > 0 ? Math.max(...diamonds.map(d => d.id)) + 1 : 1;

        // Generate MM & SHAPE field
        newDiamond['MM & SHAPE'] = `${newDiamond.SHAPE}-${newDiamond.MM} MM`;

        diamonds.push(newDiamond);
        await writeData(DIAMONDS_FILE, diamonds);

        res.status(201).json(newDiamond);
    } catch (err) {
        console.error('Error adding diamond:', err);
        res.status(500).json({ error: 'Failed to add diamond' });
    }
});

// Update diamond
app.put('/api/diamonds/:id', async (req, res) => {
    try {
        const diamonds = await readData(DIAMONDS_FILE);
        const id = parseInt(req.params.id);
        const updatedDiamond = req.body;

        // Validate input
        if (!updatedDiamond.SHAPE || updatedDiamond.MM === undefined || typeof updatedDiamond['PRICE/CT'] !== 'number') {
            return res.status(400).json({ error: 'Invalid input: SHAPE, MM, and PRICE/CT are required, and PRICE/CT must be a number' });
        }

        if (updatedDiamond.SHAPE === 'ROUND' && typeof updatedDiamond.MM !== 'number') {
            return res.status(400).json({ error: 'MM must be a number for ROUND shape' });
        }

        const index = diamonds.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Diamond not found' });
        }

        // Update fields
        diamonds[index] = {
            id: diamonds[index].id, // Preserve ID
            SHAPE: updatedDiamond.SHAPE,
            MM: updatedDiamond.MM,
            'PRICE/CT': updatedDiamond['PRICE/CT'],
            'MM & SHAPE': `${updatedDiamond.SHAPE}-${updatedDiamond.MM} MM`
        };

        await writeData(DIAMONDS_FILE, diamonds);
        res.json(diamonds[index]);
    } catch (err) {
        console.error('Error updating diamond:', err);
        res.status(500).json({ error: 'Failed to update diamond' });
    }
});

// Delete diamond
app.delete('/api/diamonds/:id', async (req, res) => {
    try {
        const diamonds = await readData(DIAMONDS_FILE);
        const id = parseInt(req.params.id);

        const filteredDiamonds = diamonds.filter(d => d.id !== id);
        if (filteredDiamonds.length === diamonds.length) {
            return res.status(404).json({ error: 'Diamond not found' });
        }

        await writeData(DIAMONDS_FILE, filteredDiamonds);
        res.json({ message: 'Diamond deleted successfully' });
    } catch (err) {
        console.error('Error deleting diamond:', err);
        res.status(500).json({ error: 'Failed to delete diamond' });
    }
});

// Get metadata (quotations)
app.get('/api/metadata', async (req, res) => {
    try {
        const metadata = await readData(METADATA_FILE);
        res.json(metadata);
    } catch (err) {
        console.error('Error reading metadata.json:', err);
        res.status(500).json({ error: 'Failed to load metadata' });
    }
});

// Delete a quotation by id
app.delete('/api/metadata/:id', async (req, res) => {
    try {
        const metadata = await readData(METADATA_FILE);
        const id = req.params.id;

        const index = metadata.findIndex(item => item.quotationId === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        metadata.splice(index, 1);
        await writeData(METADATA_FILE, metadata);
        res.json({ message: 'Quotation deleted successfully' });
    } catch (err) {
        console.error('Error deleting quotation:', err);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
});

// Save quotation data
app.post('/api/save-quotation', async (req, res) => {
    console.log('--- /api/save-quotation route hit ---');
    const newQuotation = req.body;

    try {
        await ensureDataDirectory();
        const quotations = await readData(METADATA_FILE);

        quotations.push(newQuotation);
        await writeData(METADATA_FILE, quotations);

        console.log(`Quotation ${newQuotation.quotationId || ''} saved successfully.`);
        res.status(200).json({ message: `Quotation ${newQuotation.quotationId || ''} saved successfully.` });
    } catch (err) {
        console.error('Error saving quotation:', err);
        res.status(500).json({ message: 'Failed to save quotation.', error: err.message });
    }
});

// Fallback to index.html for single-page application routing
app.get('*', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
        return;
    }
    res.status(404).json({ error: 'Resource not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Ensure this message appears after every server restart.');
});