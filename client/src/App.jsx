import { ToastProvider } from './components/Toast/ToastProvider';
import Dashboard from './pages/Dashboard';
import './styles/tokens.css';

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
