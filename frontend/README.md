# CRACLE Frontend

Modern React-based frontend for the Cognitive Reasoning and Adaptive Learning Engine.

## Features

- **Authentication**: Secure login and registration
- **Learning Plans**: AI-generated personalized learning paths
- **AI Mentor**: Interactive chat with AI mentor for guidance
- **Simulations**: Real-world scenario-based learning
- **Analytics**: Comprehensive monitoring dashboard

## Tech Stack

- React 18
- Vite
- TailwindCSS
- React Router
- Zustand (State Management)
- Recharts (Data Visualization)
- Axios (API Client)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable components
├── pages/            # Page components
├── store/            # State management
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## API Integration

The frontend connects to the backend API at `http://localhost:8000`. The proxy is configured in `vite.config.js`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file if you need to customize the API URL:

```
VITE_API_URL=http://localhost:8000
```
