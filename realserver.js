const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get diamond data
app.get('/api/diamonds', (req, res) => {
  const diamondsPath = path.join(__dirname, 'data', 'diamonds.json');
  fs.readFile(diamondsPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading diamonds.json:", err);
      return res.status(500).json({ error: 'Failed to load diamond data' });
    }
    try {
      const diamonds = JSON.parse(data);
      res.json(diamonds);
    } catch (parseErr) {
      console.error("Error parsing diamonds.json:", parseErr);
      return res.status(500).json({ error: 'Failed to parse diamond data' });
    }
  });
});

// API endpoint to get metadata (quotations)
app.get('/api/metadata', (req, res) => {
  const metadataPath = path.join(__dirname, 'data', 'metadata.json');
  fs.readFile(metadataPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File does not exist, return empty array
        return res.json([]);
      }
      console.error("Error reading metadata.json:", err);
      return res.status(500).json({ error: 'Failed to load metadata' });
    }
    try {
      const metadata = JSON.parse(data);
      res.json(metadata);
    } catch (parseErr) {
      console.error("Error parsing metadata.json:", parseErr);
      return res.status(500).json({ error: 'Failed to parse metadata' });
    }
  });
});

// API endpoint to delete a quotation by id
app.delete('/api/metadata/:id', (req, res) => {
  const id = req.params.id;
  const metadataPath = path.join(__dirname, 'data', 'metadata.json');

  fs.readFile(metadataPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Metadata file not found' });
      }
      console.error("Error reading metadata.json:", err);
      return res.status(500).json({ error: 'Failed to read metadata' });
    }
    let metadata;
    try {
      metadata = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parsing metadata.json:", parseErr);
      return res.status(500).json({ error: 'Failed to parse metadata' });
    }

    const index = metadata.findIndex(item => item.quotationId === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    metadata.splice(index, 1);

    fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error("Error writing metadata.json:", writeErr);
        return res.status(500).json({ error: 'Failed to update metadata' });
      }
      res.json({ message: 'Quotation deleted successfully' });
    });
  });
});

// API endpoint to save quotation data
app.post('/api/save-quotation', (req, res) => {
    console.log('--- /api/save-quotation route hit ---'); // Diagnostic log
    const newQuotation = req.body;
    const metadataDir = path.join(__dirname, 'data');
    const metadataPath = path.join(metadataDir, 'metadata.json');

    try {
        if (!fs.existsSync(metadataDir)) {
            try {
                fs.mkdirSync(metadataDir, { recursive: true });
                console.log('Data directory created.');
            } catch (mkdirErr) {
                console.error("Error creating data directory:", mkdirErr);
                return res.status(500).json({ message: 'Failed to create data directory.', error: mkdirErr.message });
            }
        }

        fs.readFile(metadataPath, 'utf8', (err, data) => {
            let quotations = [];
            if (err && err.code !== 'ENOENT') {
                console.error("Error reading metadata.json:", err);
                return res.status(500).json({ message: 'Failed to read existing quotations.', error: err.message });
            }
            
            if (!err && data) {
                try {
                    quotations = JSON.parse(data);
                    if (!Array.isArray(quotations)) {
                        console.warn("metadata.json did not contain an array. Initializing as empty array.");
                        quotations = [];
                    }
                } catch (parseErr) {
                    console.error("Error parsing metadata.json, initializing as empty array:", parseErr);
                    quotations = []; 
                }
            }

            quotations.push(newQuotation);

            fs.writeFile(metadataPath, JSON.stringify(quotations, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error("Error writing to metadata.json:", writeErr);
                    return res.status(500).json({ message: 'Failed to save quotation.', error: writeErr.message });
                }
                console.log(`Quotation ${newQuotation.quotationId || ''} saved successfully.`);
                res.status(200).json({ message: `Quotation ${newQuotation.quotationId || ''} saved successfully.` });
            });
        });
    } catch (e) {
        console.error("Unexpected synchronous error in /api/save-quotation:", e);
        return res.status(500).json({ message: 'An unexpected error occurred while saving the quotation.', error: e.message });
    }
});

// Fallback to index.html for single-page application routing
// IMPORTANT: This should be the LAST route.
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    return;
  }
  res.status(404).json({ error: 'Resource not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Ensure this message appears after every server restart.');
});