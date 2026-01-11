import axios from 'axios';
import { API_URL } from '../constants';

const api = {
    memories: {
        save: async (data: any) => {
            const res = await axios.post(`${API_URL}/save`, data);
            return res.data;
        },
        delete: async (id: string) => {
            const res = await axios.delete(`${API_URL}/delete/${id}`);
            return res.data;
        },
        update: async (id: string, content: string) => {
            const res = await axios.put(`${API_URL}/update/${id}`, { content });
            return res.data;
        },
        reindex: async () => {
             const res = await axios.post(`${API_URL}/reindex`);
             return res.data;
        }
    },
    graph: {
        get: async () => {
            const res = await axios.get(`${API_URL}/graph`);
            return res.data;
        }
    },
    analysis: {
        analyze: async (text: string) => {
           const res = await axios.post(`${API_URL}/analyze`, { text });
           return res.data;
        },
        ask: async (query: string) => {
            const res = await axios.post(`${API_URL}/ask`, { query });
            return res.data;
        }
    },
    system: {
        getConfig: async () => {
             const res = await axios.get(`${API_URL}/config`);
             return res.data;
        },
        updateConfig: async(key: string, value: string) => {
             const res = await axios.post(`${API_URL}/config`, { [key]: value });
             return res.data;
        }
    }
};

export default api;
