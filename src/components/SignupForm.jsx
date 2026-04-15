// src/components/SignupForm.jsx
import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  "Colors",
  "NFL Teams",
  "College Teams",
  "Pizza Toppings",
  "Video Game Genres",
];

const INITIAL_FIELDS = {
  name: "",
  email: "",
  phone: "",
  category: "",
};

const INITIAL_ERRORS = {
  name: "",
  email: "",
  phone: "",
  category: "",
};

// Save status enum (requirement #4)
export const SAVE_STATUS = {
  READY: "READY",
  SAVING: "SAVING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

// ── Field-level validators ────────────────────────────────────────────────────
function validateField(name, value) {
  switch (name) {
    case "name":
      if (!value.trim()) return "Name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (!/^\d{10}$/.test(value.replace(/\D/g, "")))
        return "10-digit phone number required";
      return "";
    case "category":
      if (!value) return "Please select a category";
      return "";
    default:
      return "";
  }
}

// ── Form-level validation (requirement #3) ────────────────────────────────────
function validate(fields) {
  return (
    Object.entries(fields).every(([key, val]) => validateField(key, val) === "") &&
    Object.values(fields).every((v) => v !== "")
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupForm({ onSubmit, saveStatus }) {
  // Requirement #1: controlled fields state object
  const [fields, setFields] = useState(INITIAL_FIELDS);

  // Requirement #2: fieldErrors state
  const [fieldErrors, setFieldErrors] = useState(INITIAL_ERRORS);

  // Track which fields have been touched (for showing errors early)
  const [touched, setTouched] = useState({});

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...fields, [name]: value };
    setFields(updated);

    // Real-time validation (requirement #2)
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Mark all touched and run full validation
    const allTouched = Object.keys(fields).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {}
    );
    setTouched(allTouched);
    const allErrors = Object.keys(fields).reduce(
      (acc, k) => ({ ...acc, [k]: validateField(k, fields[k]) }),
      {}
    );
    setFieldErrors(allErrors);

    if (validate(fields)) {
      onSubmit(fields, () => {
        setFields(INITIAL_FIELDS);
        setFieldErrors(INITIAL_ERRORS);
        setTouched({});
      });
    }
  }

  // Requirement #3: disable submit until form is valid
  const isFormValid = validate(fields);
  const isSaving = saveStatus === SAVE_STATUS.SAVING;

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      {/* NAME */}
      <div className="field-group">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={fields.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Ada Lovelace"
          className={fieldErrors.name && touched.name ? "input-error" : ""}
          disabled={isSaving}
          autoComplete="name"
        />
        {fieldErrors.name && touched.name && (
          <span className="error-msg">{fieldErrors.name}</span>
        )}
      </div>

      {/* EMAIL */}
      <div className="field-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={fields.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="ada@example.com"
          className={fieldErrors.email && touched.email ? "input-error" : ""}
          disabled={isSaving}
          autoComplete="email"
        />
        {fieldErrors.email && touched.email && (
          <span className="error-msg">{fieldErrors.email}</span>
        )}
      </div>

      {/* PHONE */}
      <div className="field-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={fields.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="4045550100"
          className={fieldErrors.phone && touched.phone ? "input-error" : ""}
          disabled={isSaving}
          autoComplete="tel"
        />
        {fieldErrors.phone && touched.phone && (
          <span className="error-msg">{fieldErrors.phone}</span>
        )}
      </div>

      {/* CATEGORY */}
      <div className="field-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={fields.category}
          onChange={handleChange}
          onBlur={handleBlur}
          className={fieldErrors.category && touched.category ? "input-error" : ""}
          disabled={isSaving}
        >
          <option value="">— Select a category —</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {fieldErrors.category && touched.category && (
          <span className="error-msg">{fieldErrors.category}</span>
        )}
      </div>

      {/* SUBMIT — disabled until valid (requirement #3) */}
      <button
        type="submit"
        className={`submit-btn ${isSaving ? "saving" : ""}`}
        disabled={!isFormValid || isSaving}
        title={!isFormValid ? "Please fill in all fields correctly" : ""}
      >
        {isSaving ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Sign Up"
        )}
      </button>

      {/* Save status feedback (requirement #4) */}
      {saveStatus === SAVE_STATUS.SUCCESS && (
        <p className="status-msg success">✓ Signed up successfully!</p>
      )}
      {saveStatus === SAVE_STATUS.ERROR && (
        <p className="status-msg error-status">✗ Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
