# Recoverly

A comprehensive web application designed to help efficiently document, manage, and process insurance claims. This platform streamlines the often overwhelming process of filing insurance claims by providing an intuitive interface for managing property inventory, documents, and collaboration with insurance adjusters.

## Overview

Users face the challenging task of documenting their losses for insurance claims. This application serves as a digital assistant that simplifies this process through:

- **Smart Inventory Management**: Easily catalog and organize belongings room by room
- **Document Organization**: Secure storage and management of important insurance-related documents
- **Collaborative Features**: Streamlined communication with insurance adjusters and other stakeholders
- **Multi-language Support**: Accessibility for diverse communities with support for English, Spanish, French, German, and Hindi
- **Automated Image Processing**: AI-powered detection of items in room photos to assist with inventory creation

## Technology Stack

### Frontend
- **React 18**: Used for UI development with functional components and hooks
- **TypeScript**: Type-safe development environment
- **Chakra UI**: Accessible and customizable component library
- **@dnd-kit**: Drag-and-drop functionality for intuitive inventory management
- **React Router**: Client-side routing
- **Vite**: Next-generation frontend tooling

### Backend & Infrastructure
- **Firebase**:
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Analytics

### Image Processing
- **Python**: Backend processing for image analysis
- **Computer Vision**: AI-powered item detection in room photos

### Development Tools
- **ESLint**: Code quality and style consistency
- **TypeScript**: Static type checking
- **Vite**: Development server and build optimization

## Key Features

### Inventory Management
- Room-by-room organization
- Drag-and-drop interface
- Estimated value tracking
- Category classification
- Photo attachments

### Document Management
- Secure file storage
- Document categorization
- Easy upload/download
- Progress tracking

### User Experience
- Responsive design
- Multi-language interface
- Intuitive navigation

### Security & Privacy
- Secure authentication
- Protected data storage
- User-specific data isolation

## Getting Started

To run this project locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration
4. Set up .env file with all necessary API Keys
5. Start the development server: `npm run dev`

## License

This project is licensed under the MIT License for broad fair use.
