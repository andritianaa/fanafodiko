import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Protection CSRF : ce header custom ne peut pas être envoyé par un formulaire HTML
    // ou un fetch cross-origin sans CORS explicite → le backend le vérifie.
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Required for the browser to send/receive HttpOnly cookies cross-origin
  withCredentials: true,
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle Network Errors
    if (!status) {
      toast.error("Erreur de connexion", {
        description: "Impossible de joindre le serveur. Vérifiez votre connexion internet.",
      });
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized globally
    if (status === 401) {
      localStorage.removeItem('auth');

      const isLoginError = data?.code === 'INVALID_CREDENTIALS' || globalThis.location.pathname === '/login';

      if (!isLoginError) {
        toast.error("Session expirée", {
          description: "Veuillez vous reconnecter.",
        });
        globalThis.location.href = '/login';
      }
    } 
    // Handle 403 Forbidden
    else if (status === 403) {
      toast.error("Accès refusé", {
        description: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
      });
    }
    // Handle 404 Not Found
    else if (status === 404) {
      toast.error("Ressource introuvable", {
        description: "La ressource demandée n'existe pas.",
      });
    }
    else if (status === 400) {
      const message = data?.message || "Données invalides";
      if (Array.isArray(data?.errors)) {
          toast.error("Erreur de validation", {
              description: data.errors[0]?.message || message
          })
      } else {
          toast.error("Erreur", { description: message });
      }
    }
    else if (status >= 500) {
      toast.error("Erreur serveur", {
        description: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
      });
    }

    return Promise.reject(error);
  }
);
