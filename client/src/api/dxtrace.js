import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function analyzeCase(caseId = 'case_001', forceHallucination = false) {
  const { data } = await api.post('/cases/analyze', { caseId, forceHallucination });
  return data;
}

export async function submitFeedback({ componentId, action, doctorId, previousContent, finalContent }) {
  const { data } = await api.post('/feedback/submit', {
    componentId,
    action,
    doctorId,
    previousContent,
    finalContent,
  });
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
