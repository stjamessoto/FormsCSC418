// src/api/api.jsx
// All API calls to the backend — mirrors Hangman's api.jsx pattern

const BASE_URL = "/api/signups";

/**
 * Fetch all signups from the API
 * Used by useEffect on component mount (requirement #4)
 */
export async function fetchSignups() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch signups");
  return res.json();
}

/**
 * Fetch signups filtered by category via the GSI endpoint (requirement #5)
 * @param {string} category
 */
export async function fetchSignupsByCategory(category) {
  const res = await fetch(`${BASE_URL}/category/${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error(`Failed to fetch signups for category: ${category}`);
  return res.json();
}

/**
 * Create a new signup — POST has a 5-sec server-side delay (requirement #4)
 * @param {{ name: string, email: string, phone: string, category: string }} data
 */
export async function createSignup(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save signup");
  }
  return res.json();
}

/**
 * Delete a signup by ID
 * @param {string} id
 */
export async function deleteSignup(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete signup");
  return res.json();
}
