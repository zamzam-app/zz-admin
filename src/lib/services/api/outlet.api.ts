import api from "./axios"; 

export const getOutlets = () => {
  return api.get("/outlet"); 
};