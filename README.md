# SHL Product Catalogue with RAG-Powered Recommendations

A comprehensive product catalogue application for SHL's assessment solutions, enhanced with AI-powered recommendations using Retrieval Augmented Generation (RAG).
Cold Start could take upto 50 seconds due to resource limitation  

## APP Link : - https://shl-product-catalogue.netlify.app/

# Architecture Diagram
![image](https://github.com/user-attachments/assets/2b63e07f-ccd8-4ebf-8080-b673a063c95a)

# SHL Product Catalogue RAG System

This project implements a Retrieval-Augmented Generation (RAG) system for SHL's product catalogue, allowing users to search and get recommendations for SHL assessment products through natural language queries.

## Overview

The SHL Product Catalogue uses a modern tech stack to provide an AI-powered search experience:

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Flask API deployed on Hugging Face
- **Database**: Supabase for storing product data and vector embeddings
- **AI Models**: 
  - all-MiniLM-L6-v2 for vector embeddings
  - Gemini for natural language processing

## Project Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │  Flask API  │    │  Supabase   │
│  Frontend   │───▶│ (Hugging   │◀───▶│  Database   │
│             │    │   Face)     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Gemini    │
                   │     LLM     │
                   │             │
                   └─────────────┘
```

## Implementation Details

### 1. Data Collection

- Web scraper collected data from SHL product pages
- Created a JSON file with 453 products
- Data includes product names, descriptions, categories, and other relevant metadata

### 2. Database Setup

- Created a Supabase instance with tables for:
  - Raw product data
  - Vector embeddings of product descriptions

### 3. Vector Embeddings

- Used the all-MiniLM-L6-v2 model to convert product descriptions into vector embeddings
- Stored these embeddings in Supabase for efficient similarity search

### 4. Backend API

- Developed a Flask API that:
  - Receives user queries
  - Converts queries to vector embeddings
  - Performs similarity search in Supabase
  - Sends relevant products and user query to Gemini LLM
  - Returns structured JSON responses
- Deployed using Docker on Hugging Face

### 5. Frontend Integration

- Built a React frontend with:
  - Search interface
  - Product listings
  - Detailed product views
  - Chat interface for natural language queries
- Connected to the Flask API endpoint for real-time recommendations

## Setup Instructions

### Prerequisites

- Node.js and npm/yarn/bun
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd RAG_front_end-main
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_API_ENDPOINT=https://ankys-shl-back.hf.space/recommend
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
# or
bun build
```

## API Documentation

The backend API accepts POST requests to the `/recommend` endpoint with a JSON body:

```json
{
  "query": "Your search query here"
}
```

And returns a JSON response in the format:

```json
{
  "status": "success",
  "message": "Found matching products",
  "recommended_assessments": [
    {
      "product_id": "p123",
      "product_name": "Product Name",
      "url": "product-url",
      "adaptive_support": "Yes/No",
      "description": "Product description",
      "duration": 30,
      "remote_support": "Yes/No",
      "test_type": ["Type1", "Type2"]
    }
  ]
}
```

## Security Notes

This project uses several API keys and secrets that should be kept confidential:

- Gemini API key (for LLM processing)
- Supabase URL and secret key (for database access)
- Hugging Face API token (for model access)

These secrets are stored securely in environment variables on the deployment platforms and should never be committed to the repository.

## Future Improvements

- Implement user authentication and personalized recommendations
- Add more filtering options for product search
- Improve vector embedding model for better semantic search
- Add analytics to track user queries and improve recommendations
- Expand the product database with more detailed information

## Contributors

- Aniket Nikam

## License

This project is proprietary and confidential. All rights reserved.

  
