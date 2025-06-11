import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Wallet, 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Shield, 
  LogOut,
  CheckCircle,
  Loader2,
  FolderOpen,
  Plus
} from 'lucide-react';
import './index.css'

const SERVER_URL = 'https://digidock.onrender.com';

function App() {
  const [wallet, setWallet] = useState(null);
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Connect wallet and fetch documents
  async function connectWallet() {
    if (!window.ethereum) return alert('MetaMask not installed');
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
    } catch (err) {
      alert('Failed to connect wallet');
      console.error(err);
    }
  }

  // Fetch documents from backend
  async function fetchDocs(walletAddress) {
    try {
      const res = await axios.get(`${SERVER_URL}/docs/${walletAddress}`);
      console.log('Fetched Docs:', res.data);
      setDocs(res.data.docs || []);
    } catch (err) {
      console.error('Failed to fetch docs:', err);
      setDocs([]);
    }
  }

  // Fetch docs whenever wallet changes
  useEffect(() => {
    if (wallet) {
      fetchDocs(wallet);
    }
  }, [wallet]);

  // Convert file to base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  // Upload file to server
  async function uploadDoc() {
    if (!file) return alert('Please select a file.');
    if (!wallet) return alert('Please connect your wallet.');

    setUploading(true);
    try {
      const base64Content = await toBase64(file);
      const res = await axios.post(`${SERVER_URL}/upload`, {
        walletAddress: wallet,
        name: file.name,
        fileContent: base64Content
      });
      alert(`Uploaded! IPFS Hash: ${res.data.ipfsHash}`);
      setFile(null);
      fileInputRef.current.value = '';
      fetchDocs(wallet);
    } catch (err) {
      alert('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  // Delete file
  async function deleteDoc(ipfsHash) {  
  if (!window.confirm('Are you sure you want to delete this file?')) return;
  try {
    await axios.delete(`${SERVER_URL}/docs/${wallet}/${ipfsHash}`);
    alert('File deleted');
    await fetchDocs(wallet);
  } catch (err) {
  alert('Failed to delete file');
  console.error(err);
  }
  }

  // Disconnect
  function disconnectWallet() {
  setWallet(null);
  setDocs([]);
  setFile(null);
  window.location.reload();
  }

  //Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">DigiDock</h1>
                <p className="text-slate-600 text-sm">Decentralized Document Storage</p>
              </div>
            </div>
            
            {wallet && (
              <button
                onClick={disconnectWallet}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!wallet ? (
          /* Wallet Connection */
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6">
                <Wallet className="w-12 h-12 text-blue-600 mx-auto mt-2" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Connect Your Wallet</h2>
              <p className="text-slate-600 mb-8">
                Connect your MetaMask wallet to access your secure document vault
              </p>
              <button
                onClick={connectWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect MetaMask</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Dashboard */
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-800">Wallet Connected</p>
                  <p className="text-slate-600 text-sm font-mono">{truncateAddress(wallet)}</p>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Upload Document</span>
                </h3>
              </div>
              
              <div className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-100 rounded-lg w-16 h-16 mx-auto flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{file.name}</p>
                        <p className="text-slate-600 text-sm">{formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={uploadDoc}
                          disabled={uploading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setFile(null);
                            fileInputRef.current.value = '';
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-100 rounded-lg w-16 h-16 mx-auto flex items-center justify-center">
                        <Upload className="w-8 h-8 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-800 mb-2">
                          Drop files here or click to browse
                        </p>
                        <p className="text-slate-600 text-sm">
                          Select a document to upload to IPFS
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5" />
                    <span>Your Documents</span>
                  </h3>
                  <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                    {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {docs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="p-3 bg-slate-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg font-medium mb-2">No documents yet</p>
                    <p className="text-slate-400">Upload your first document to get started</p>
                  </div>
                ) : (
                  docs.map(({ name, ipfsHash }) => (
                    <div key={ipfsHash} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{name}</p>
                            <p className="text-slate-500 text-sm font-mono">
                              {ipfsHash.slice(0, 12)}...{ipfsHash.slice(-8)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://ipfs.io/ipfs/${ipfsHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View on IPFS"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => deleteDoc(ipfsHash)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
