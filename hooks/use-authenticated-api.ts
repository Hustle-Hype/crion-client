import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const useAuthenticatedApi = () => {
  const router = useRouter();
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/");
      throw new Error("No access token found");
    }
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  };

  const apiCall = async (
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ) => {
    try {
      const config = {
        method,
        url: `${API_URL}${endpoint}`,
        headers: getAuthHeaders(),
        ...(data && { data }),
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API call failed: ${method} ${endpoint}`, error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        router.push("/");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again.",
        });
      }
      throw error;
    }
  };

  return {
    get: (endpoint: string) => apiCall("GET", endpoint),
    post: (endpoint: string, data?: any) => apiCall("POST", endpoint, data),
    put: (endpoint: string, data?: any) => apiCall("PUT", endpoint, data),
    delete: (endpoint: string) => apiCall("DELETE", endpoint),
  };
};
