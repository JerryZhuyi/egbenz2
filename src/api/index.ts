import axios from 'axios';
const instance = axios.create({
    timeout: 10000,
  });


export const API_URLS = {
    api_files:{
        url:"/api/files",
        method:"get",
    }
}

export const request = {
    getFiles: ()=>instance({
        url: API_URLS.api_files.url,
        method: API_URLS.api_files.method,
    }),
}
