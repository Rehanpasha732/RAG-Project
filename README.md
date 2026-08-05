# DocXtract — Document Text Extractor

A full-stack MERN application for uploading documents and extracting text with AI-powered OCR.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** — React framework with server-side rendering
- **Tailwind CSS** — Utility-first CSS with custom 3D animations
- **react-dropzone** — Drag-and-drop file upload
- **lucide-react** — Beautiful icons
- **react-hot-toast** — Elegant notifications

### Backend
- **Express.js** — Fast, minimalist Node.js framework
- **Multer** — Multipart file upload handling
- **Mammoth** — DOCX text extraction
- **pdf-parse** — PDF text extraction
- **Tesseract.js** — OCR for image-based documents

---

## 📂 Project Structure

```
docxtract/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server entrypoint
│   │   ├── routes/
│   │   │   └── documentRoutes.js   # API routes
│   │   ├── controllers/
│   │   │   └── documentController.js # Route handlers
│   │   ├── middleware/
│   │   │   ├── upload.js           # Multer config
│   │   │   └── errorHandler.js     # Global error handler
│   │   └── utils/
│   │       └── textExtractor.js    # Text extraction engine
│   ├── uploads/                    # Uploaded files (gitignored)
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Main page with 3D upload UI
│   │   └── globals.css            # Global styles + Tailwind
│   ├── components/
│   │   ├── ParticlesBackground.tsx  # 3D particle animation
│   │   └── ExtractedTextViewer.tsx  # Extracted text display
│   ├── lib/
│   │   └── api.ts                  # API helper functions
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
├── package.json                    # Root scripts (dev, build)
└── README.md
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
git clone <repo-url>
cd docxtract
npm run install:all
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### 3. Run Development

```bash
# Run both frontend & backend concurrently
npm run dev

# Or run separately:
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:3000
```

---

## 📡 API Endpoints

### `POST /api/documents/upload`
Upload a document and extract its text.

**Request:** `multipart/form-data`
| Field    | Type | Description              |
|----------|------|--------------------------|
| document | File | Document to upload       |

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "1728000000000-123456789",
    "originalName": "report.pdf",
    "fileName": "1728000000000-123456789.pdf",
    "mimetype": "application/pdf",
    "size": 245760,
    "sizeFormatted": "240 KB",
    "uploadedAt": "2026-05-08T15:00:00.000Z"
  },
  "extracted": {
    "text": "Full extracted text content...",
    "textLength": 5000,
    "pages": 3,
    "metadata": { "title": "...", "author": "..." }
  }
}
```

### `GET /api/documents/:id`
Get document metadata by ID.

### `GET /api/health`
Health check endpoint.

---

## 🎨 Features

- **3D Particle Background** — Animated canvas with connecting particles
- **Drag & Drop Upload** — Intuitive drag-and-drop zone
- **Multi-Format Support** — PDF, DOCX, TXT, CSV, Images (OCR)
- **Real-time Extraction** — Instant text extraction with stats
- **Copy & Download** — Copy extracted text or download as .txt
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## 📄 Supported Formats

| Format | Extension | Method          |
|--------|-----------|-----------------|
| PDF    | .pdf      | pdf-parse       |
| Word   | .docx     | mammoth         |
| Text   | .txt      | Direct read     |
| CSV    | .csv      | Direct read     |
| Excel  | .xlsx     | Basic metadata  |
| Images | .png .jpg | Tesseract OCR   |

---

## 🛠️ Production Build

```bash
# Build frontend
npm run build:frontend

# Start production
npm run start:backend
npm run start:frontend
```
