import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Tailwind CSS를 직접 임포트하는 대신 postcss를 통해 처리되도록 함
// import 'tailwindcss/tailwind.css' 제거

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
