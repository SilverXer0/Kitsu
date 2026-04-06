const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}