import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/app/OnboardingFlow.jsx'
// import "tailwindcss/tailwind.css" // <-- THIS LINE IS CRITICAL or not 
import "./index.css"  // <--- Change this line to import your new CSS file!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
