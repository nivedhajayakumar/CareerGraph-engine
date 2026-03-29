import axios from 'axios'

// base URL comes from .env — so you only change it in one place
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

export const checkHealth  = ()  => API.get('/health')
export const testResume   = ()  => API.get('/resume/test')

export default API