export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://amp.startupflora.com";

export const apiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
