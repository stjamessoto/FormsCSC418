// src/components/SignupForm.jsx
import { useState } from "react";

export const CATEGORIES = [
  "Sports Teams",
  "Colors",
  "Pizza Toppings",
  "Video Games",
];

// Follow-up fields rendered for each category
const CATEGORY_FIELDS = {
  "Sports Teams": [
    { name: "favoriteSport", label: "Favorite Sport", placeholder: "e.g. Basketball" },
    { name: "sportsTeam", label: "Favorite Sports Team", placeholder: "e.g. Atlanta Braves" },
  ],
  "Colors": [
    { name: "favoriteColor", label: "Favorite Color", placeholder: "e.g. Blue" },
  ],
  "Pizza Toppings": [
    { name: "favoritePizzaTopping", label: "Favorite Pizza Topping", placeholder: "e.g. Pepperoni" },
  ],
  "Video Games": [
    { name: "favoriteVideoGameGenre", label: "Favorite Video Game Genre", placeholder: "e.g. RPG" },
    { name: "favoriteVideoGame", label: "Favorite Video Game", placeholder: "e.g. The Legend of Zelda" },
  ],
};

const ALL_FOLLOWUP = [
  "favoriteSport",
  "sportsTeam",
  "favoriteColor",
  "favoritePizzaTopping",
  "favoriteVideoGameGenre",
  "favoriteVideoGame",
];

const INITIAL_FIELDS = {
  name: "",
  email: "",
  phone: "",
  category: "",
  favoriteSport: "",
  sportsTeam: "",
  favoriteColor: "",
  favoritePizzaTopping: "",
  favoriteVideoGameGenre: "",
  favoriteVideoGame: "",
};

const INITIAL_ERRORS = { ...INITIAL_FIELDS };

export const SAVE_STATUS = {
  READY: "READY",
  SAVING: "SAVING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

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
      if (!value.trim()) return "This field is required";
      if (value.trim().length < 2) return "Please enter a valid answer";
      return "";
  }
}

function getRequiredKeys(category) {
  const followups = (CATEGORY_FIELDS[category] || []).map((f) => f.name);
  return ["name", "email", "phone", "category", ...followups];
}

function validate(fields) {
  return getRequiredKeys(fields.category).every(
    (key) => validateField(key, fields[key]) === ""
  );
}

export default function SignupForm({ onSubmit, saveStatus }) {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [fieldErrors, setFieldErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState({});

  const followupFields = CATEGORY_FIELDS[fields.category] || [];

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...fields, [name]: value };

    if (name === "category") {
      ALL_FOLLOWUP.forEach((f) => { updated[f] = ""; });
      setFieldErrors((prev) => {
        const next = { ...prev };
        ALL_FOLLOWUP.forEach((f) => { next[f] = ""; });
        return next;
      });
      setTouched((prev) => {
        const next = { ...prev };
        ALL_FOLLOWUP.forEach((f) => { delete next[f]; });
        return next;
      });
    }

    setFields(updated);
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
    const required = getRequiredKeys(fields.category);
    setTouched((prev) => required.reduce((acc, k) => ({ ...acc, [k]: true }), prev));
    const allErrors = { ...fieldErrors };
    required.forEach((k) => { allErrors[k] = validateField(k, fields[k]); });
    setFieldErrors(allErrors);

    if (validate(fields)) {
      const payload = { name: fields.name, email: fields.email, phone: fields.phone, category: fields.category };
      followupFields.forEach((f) => { payload[f.name] = fields[f.name]; });

      onSubmit(payload, () => {
        setFields(INITIAL_FIELDS);
        setFieldErrors(INITIAL_ERRORS);
        setTouched({});
      });
    }
  }

  const isFormValid = validate(fields);
  const isSaving = saveStatus === SAVE_STATUS.SAVING;

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      {/* NAME */}
      <div className="field-group">
        <label htmlFor="name">Full Name</label>
        <input
          id="name" name="name" type="text"
          value={fields.name} onChange={handleChange} onBlur={handleBlur}
          placeholder="Ada Lovelace"
          className={fieldErrors.name && touched.name ? "input-error" : ""}
          disabled={isSaving} autoComplete="name"
        />
        {fieldErrors.name && touched.name && (
          <span className="error-msg">{fieldErrors.name}</span>
        )}
      </div>

      {/* EMAIL */}
      <div className="field-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email" name="email" type="email"
          value={fields.email} onChange={handleChange} onBlur={handleBlur}
          placeholder="ada@example.com"
          className={fieldErrors.email && touched.email ? "input-error" : ""}
          disabled={isSaving} autoComplete="email"
        />
        {fieldErrors.email && touched.email && (
          <span className="error-msg">{fieldErrors.email}</span>
        )}
      </div>

      {/* PHONE */}
      <div className="field-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone" name="phone" type="tel"
          value={fields.phone} onChange={handleChange} onBlur={handleBlur}
          placeholder="4045550100"
          className={fieldErrors.phone && touched.phone ? "input-error" : ""}
          disabled={isSaving} autoComplete="tel"
        />
        {fieldErrors.phone && touched.phone && (
          <span className="error-msg">{fieldErrors.phone}</span>
        )}
      </div>

      {/* CATEGORY */}
      <div className="field-group">
        <label htmlFor="category">Category</label>
        <select
          id="category" name="category"
          value={fields.category} onChange={handleChange} onBlur={handleBlur}
          className={fieldErrors.category && touched.category ? "input-error" : ""}
          disabled={isSaving}
        >
          <option value="">— Select a category —</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {fieldErrors.category && touched.category && (
          <span className="error-msg">{fieldErrors.category}</span>
        )}
      </div>

      {/* DYNAMIC FOLLOW-UP FIELDS */}
      {followupFields.map((field) => (
        <div key={field.name} className="field-group">
          <label htmlFor={field.name}>{field.label}</label>
          <input
            id={field.name} name={field.name} type="text"
            value={fields[field.name]} onChange={handleChange} onBlur={handleBlur}
            placeholder={field.placeholder}
            className={fieldErrors[field.name] && touched[field.name] ? "input-error" : ""}
            disabled={isSaving}
          />
          {fieldErrors[field.name] && touched[field.name] && (
            <span className="error-msg">{fieldErrors[field.name]}</span>
          )}
        </div>
      ))}

      {/* SUBMIT */}
      <button
        type="submit"
        className={`submit-btn ${isSaving ? "saving" : ""}`}
        disabled={!isFormValid || isSaving}
        title={!isFormValid ? "Please fill in all fields correctly" : ""}
      >
        {isSaving ? (
          <><span className="spinner" aria-hidden="true" />Saving…</>
        ) : (
          "Sign Up"
        )}
      </button>

      {saveStatus === SAVE_STATUS.SUCCESS && (
        <p className="status-msg success">✓ Signed up successfully!</p>
      )}
      {saveStatus === SAVE_STATUS.ERROR && (
        <p className="status-msg error-status">✗ Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
