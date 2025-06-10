# 🗂️ DigiDock 

A modern, responsive React application that allows users to upload documents to the **InterPlanetary File System (IPFS)** and manage them securely — using **MetaMask** for Web3 identity and authentication.

Secure Document Storage: Upload and store important personal or business documents on IPFS with tamper-proof guarantees.

Decentralized Identity Binding: Link documents directly to your MetaMask wallet, ensuring only the owner can manage their files.

Easy Access & Management: View, download, and delete uploaded files from a clean dashboard, with IPFS links for global accessibility.

## ✨ Features

- 🦊 **Connect with MetaMask** wallet
- 🚀 Upload documents directly to IPFS
- 📂 View uploaded documents with clickable IPFS links
- 🗑️ Delete documents from local state
- 🧲 Drag-and-drop support for file uploads
- 🔒 Web3-enabled, decentralized document handling
- 📱 Responsive and accessible design with Tailwind CSS
- 🔄 Loading indicators and intuitive feedback

---

## 📸 Preview

![Screenshot 1](/frontend/public/1.png)
![Screenshot 2](/frontend/public/2.png)
![Screenshot 3](/frontend/public/3.png)

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: MongoDB, Node.js, Express
- **Styling**: Tailwind CSS
- **Web3 Integration**: MetaMask (for secure login)
- **Icons**: Lucide React
- **Storage**: Pinata (for IPFS)

---

## 📦 Installation

```bash
git clone https://github.com/shivangi1612/digidock.git
cd DigiDock

cd backend
npm install
node server.js 

cd frontend
npm install
npm run dev
