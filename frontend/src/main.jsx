import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
      <Analytics/>
    </MotionConfig>
  </StrictMode>,
)
