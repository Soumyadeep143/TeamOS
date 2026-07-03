import { API_BASE_URL } from "@teamos/config";

export async function getWorkspace() {
  return fetch(`${API_BASE_URL}/workspace`).then((res) => res.json());
}
