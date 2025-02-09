# Recoverly - Insurance Claim Assistant

A comprehensive web application designed to help individuals and families efficiently document, manage, and process insurance claims after experiencing property loss. Whether due to natural disasters, theft, accidents, or other unexpected events, this platform streamlines the overwhelming process of filing insurance claims by providing an intuitive interface for managing property inventory, documents, and collaboration with insurance adjusters.

## Overview

Recoverly serves as a digital assistant that simplifies the insurance claim process for anyone facing property loss through:

- **Smart Inventory Management**: Easily catalog and organize belongings room by room, perfect for documenting any type of loss
- **Document Organization**: Secure storage and management of important insurance-related documents, from policies to receipts
- **Collaborative Features**: Streamlined communication with insurance adjusters, restoration experts, and other stakeholders
- **Multi-language Support**: Accessibility for diverse communities with support for English, Spanish, French, German, and Hindi
- **Automated Image Processing**: AI-powered detection of items in room photos to assist with inventory creation
- **Receipt Processing**: OCR and analysis of receipts for automated item entry
- **Value Estimation**: AI-powered estimation of item values based on images and descriptions

## Technology Stack

### Frontend
- **React 18**: Modern UI development with functional components and hooks
- **TypeScript**: Type-safe development environment
- **Chakra UI**: Accessible and customizable component library
- **@dnd-kit**: Drag-and-drop functionality for intuitive inventory management
- **React Router**: Client-side routing
- **Vite**: Next-generation frontend tooling
- **React PDF**: PDF generation for inventory reports

### Backend & Infrastructure
- **Firebase**:
  - Authentication: Secure user management
  - Firestore Database: Real-time data storage
  - Cloud Storage: File and image storage
  - Cloud Functions: Serverless backend operations
  - Analytics: User behavior tracking

### Image Processing & AI
- **Flask**: Python backend server for image processing
- **Eden AI**: Object detection and OCR services
- **OpenAI/Groq**: AI-powered item analysis and price estimation
- **Computer Vision**: Object detection and image analysis

### Development Tools
- **ESLint**: Code quality and style consistency
- **TypeScript**: Static type checking
- **Vite**: Development server and build optimization
- **CORS**: Cross-origin resource sharing support

## Key Features

### Inventory Management
- Comprehensive room-by-room organization
- Intuitive drag-and-drop interface
- Smart value estimation tracking
- Flexible category classification
- Multiple photo attachments per item
- Bulk item import from room photos
- Automated receipt scanning and processing

### Document Management
- Secure cloud-based file storage
- Smart document categorization
- Easy upload/download functionality
- Claim progress tracking
- Customizable PDF report generation

### User Experience
- Clean, responsive design
- Multi-language interface for global accessibility
- Intuitive navigation for users of all tech levels
- Mobile-friendly interface for documentation on-the-go

### Security & Privacy
- Secure user authentication
- Encrypted data storage
- User-specific data isolation
- Secure environment variable configuration
- Protected API key management

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8 or higher
- Firebase account
- Eden AI API key
- OpenAI or Groq API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/recoverly.git
cd recoverly
\`\`\`

2. Install frontend dependencies:
\`\`\`bash
npm install
\`\`\`

3. Install backend dependencies:
\`\`\`bash
cd app
pip install -r requirements.txt
\`\`\`

4. Set up environment variables:
   - Create a \`.env\` file in the root directory for frontend:
   \`\`\`
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   \`\`\`
   
   - Create a \`.env\` file in the \`app\` directory for backend:
   \`\`\`
   EDEN_API=your_eden_ai_api_key
   OPENAI_API=your_openai_api_key
   GROQ_API=your_groq_api_key
   \`\`\`

5. Start the development servers:
   - Frontend:
   \`\`\`bash
   npm run dev
   \`\`\`
   - Backend:
   \`\`\`bash
   cd app
   python app.py
   \`\`\`

The application will be available at `http://localhost:5173` with the backend API running at `http://localhost:4000`.

## License

This project is licensed under the MIT License for broad use.