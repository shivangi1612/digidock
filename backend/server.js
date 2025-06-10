require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50MB' }));

app.get('/', (_, res) => {
  res.send('Decentralized Identity Vault API is running');
});

// MongoDB schema for storing user documents hashes
const DocumentSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  docs: [{
    name: String,
    ipfsHash: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});
const Document = mongoose.model('documents', DocumentSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(e => console.error('MongoDB connection error:', e));

// Upload doc to IPFS via Pinata and save hash in DB
app.post('/upload', async (req, res) => {
  try {
    const { walletAddress, name, fileContent } = req.body;
    if (!walletAddress || !name || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Pinata expects the file as multipart/form-data
    // We'll send the file content as a Buffer

    // Convert base64 string to Buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Use Axios to send a POST request with multipart form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, name);

    const metadata = JSON.stringify({
      name: name,
      keyvalues: {
        walletAddress: walletAddress
      }
    });
    formData.append('pinataMetadata', metadata);

    const pinataResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET
      }
    });

    const ipfsHash = pinataResponse.data.IpfsHash;

    // Find or create user's document record
    let userDocs = await Document.findOne({ walletAddress });
    if (!userDocs) {
      userDocs = new Document({ walletAddress, docs: [] });
    }
    userDocs.docs.push({ name, ipfsHash });
    await userDocs.save();

    res.json({ ipfsHash });
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get documents by wallet address
app.get('/docs/:walletAddress', async (req, res) => {
  try {
    const userDocs = await Document.findOne({ walletAddress: req.params.walletAddress });
    if (!userDocs) return res.json({ docs: [] });  // no docs yet
    return res.json({ docs: userDocs.docs });      // ✅ send actual array
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// DELETE /docs/:wallet/:ipfsHash
app.delete('/docs/:wallet/:ipfsHash', async (req, res) => {
  const { wallet, ipfsHash } = req.params;

  try {
    // 1. Remove the file from Pinata
    const pinataRes = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_API_SECRET,
      }
    });
    console.log('Unpinned from Pinata:', pinataRes.data);

    // 2. Pull the IPFS entry from MongoDB
    const result = await Document.updateOne(
      { walletAddress: wallet },
      { $pull: { docs: { ipfsHash } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Document not found or already deleted' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to delete file:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
