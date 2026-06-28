import axios from 'axios';

// Expo Go ile aynı Wi-Fi'deyken bu IP üzerinden backend'e bağlanır.
// Simulator kullanıyorsan: 'http://localhost:3000' veya 'http://10.0.2.2:3000' (Android emulator)
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.1.104:3000'; // LAN IP (güncel)


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function analyzeCase(caseId = 'case_001') {
  const { data } = await api.post('/cases/analyze', { caseId });
  return data;
}

export async function submitFeedback(payload) {
  const { data } = await api.post('/feedback/submit', payload);
  return data;
}

export async function generateLLM(forceHallucination = false) {
  const { data } = await api.post('/llm/generate', { forceHallucination });
  return data;
}

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}
