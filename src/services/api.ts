import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'http://192.168.100.155:8000';


export const api = axios.create({
  baseURL: BASE_URL,
});