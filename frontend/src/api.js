import axios from 'axios'
import { supabase } from './supabaseClient'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Automatically attach Supabase Auth JWT access token to every outgoing API request
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (err) {
      console.warn("Could not retrieve Supabase auth token for API request:", err)
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
