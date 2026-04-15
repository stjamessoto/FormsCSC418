// src/components/SignupList.jsx
import { useState, useEffect } from "react";
import { fetchSignupsByCategory } from "../api/api";
import { CATEGORIES } from "./SignupForm";

export default function SignupList({ signups, onDelete, isLoading }) {
  // Requirement #5: filter by category
  const [filterCategory, setFilterCategory] = useState("All");
  const [filtered, setFiltered] = useState(signups);
  const [filterLoading, setFilterLoading] = useState(false);

  // When filter changes, either show all local data or query the GSI endpoint
  useEffect(() => {
    if (filterCategory === "All") {
      setFiltered(signups);
      return;
    }

    // Query backend GSI endpoint (requirement #5)
    let cancelled = false;
    setFilterLoading(true);
    fetchSignupsByCategory(filterCategory)
      .then((data) => {
        if (!cancelled) setFiltered(data);
      })
      .catch(() => {
        if (!cancelled) setFiltered([]);
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterCategory, signups]);

  const displayList = filterCategory === "All" ? signups : filtered;

  return (
    <section className="signup-list-section">
      {/* Filter dropdown */}
      <div className="filter-bar">
        <label htmlFor="filter-category">Filter by Category</label>
        <select
          id="filter-category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <span className="filter-count">
          {displayList.length} {displayList.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* List */}
      {isLoading || filterLoading ? (
        <div className="list-loading">
          <span className="spinner" />
          Loading signups…
        </div>
      ) : displayList.length === 0 ? (
        <div className="list-empty">
          {filterCategory === "All"
            ? "No signups yet. Be the first!"
            : `No signups in "${filterCategory}" yet.`}
        </div>
      ) : (
        <ul className="signup-entries">
          {displayList.map((item) => (
            <li key={item.id} className="signup-entry">
              <div className="entry-info">
                <span className="entry-name">{item.name}</span>
                <span className="entry-email">{item.email}</span>
                <span className="entry-phone">{item.phone}</span>
                {item.sportsTeam && (
                  <span className="entry-email">⚽ {item.sportsTeam}</span>
                )}
                {item.favoriteSport && (
                  <span className="entry-email">🏅 {item.favoriteSport}</span>
                )}
              </div>
              <div className="entry-meta">
                <span className="entry-category">{item.category}</span>
                <span className="entry-date">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={() => onDelete(item.id)}
                aria-label={`Delete ${item.name}`}
                title="Remove signup"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}