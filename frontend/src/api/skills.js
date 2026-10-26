import { http } from './client.js';

// Autocomplete: [{ id, nome }]. Use os ids no currículo e nas vagas internas.
export const buscarSkills = (busca) => http.get('/skills', { busca });
