import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { background: #0a0a0a; overscroll-behavior: none; -webkit-font-smoothing: antialiased; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }
  ::-webkit-scrollbar { display: none; }
  select { -webkit-appearance: none; appearance: none; }
  button { -webkit-tap-highlight-color: transparent; }
  textarea { -webkit-appearance: none; }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)
