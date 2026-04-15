// App.jsx
import { useState, useEffect } from "react";
import SignupForm, { SAVE_STATUS } from "./components/SignupForm";
import SignupList from "./components/SignupList";
import { fetchSignups, createSignup, deleteSignup } from "./api/api";

export default function App() {
  // Requirement #4: signups list populated via useEffect on mount
  const [signups, setSignups] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  // Requirement #4: save status state machine
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.READY);

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSignups()
      .then((data) => setSignups(data))
      .catch((err) => console.error("Failed to load signups:", err))
      .finally(() => setListLoading(false));
  }, []);

  // ── Submit handler ────────────────────────────────────────────────────────
  // onSubmit receives fields + a clearForm callback from SignupForm
  async function handleSubmit(fields, clearForm) {
    setSaveStatus(SAVE_STATUS.SAVING);
    try {
      // API has 5-sec server-side delay — SAVING state shows spinner during this
      const newSignup = await createSignup(fields);
      setSaveStatus(SAVE_STATUS.SUCCESS);

      // Only clear form and update list on success (requirement #4)
      clearForm();
      setSignups((prev) => [newSignup, ...prev]);

      // Reset status after a moment so user sees the success message
      setTimeout(() => setSaveStatus(SAVE_STATUS.READY), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus(SAVE_STATUS.ERROR);
      setTimeout(() => setSaveStatus(SAVE_STATUS.READY), 4000);
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await deleteSignup(id);
      setSignups((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <p className="header-eyebrow">Community</p>
          <h1 className="header-title">Sign Up</h1>
          <p className="header-sub">
            Join the list. Pick your category. Stay in the loop.
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="layout">
          {/* Left — form */}
          <aside className="form-panel">
            <h2 className="panel-title">New Sign Up</h2>
            <SignupForm onSubmit={handleSubmit} saveStatus={saveStatus} />
          </aside>

          {/* Right — list with filter */}
          <section className="list-panel">
            <h2 className="panel-title">
              Registrations
              {!listLoading && (
                <span className="panel-count"> ({signups.length})</span>
              )}
            </h2>
            <SignupList
              signups={signups}
              onDelete={handleDelete}
              isLoading={listLoading}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
