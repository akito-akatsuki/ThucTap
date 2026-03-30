"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function EmployeeAddModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      password.length < 6
    ) {
      toast.error("Please fill all fields. Password must be at least 6 chars.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ name: name.trim(), email: email.trim(), password });
      onClose();
    } catch (err) {
      toast.error("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <form style={modal} onSubmit={handleSubmit}>
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Add New Employee
        </h3>

        <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            required
          />

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            required
          />
        </div>

        <div style={actions}>
          <button type="submit" style={saveBtn} disabled={loading}>
            {loading ? "Adding..." : "Add Employee"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={cancelBtn}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  background: "white",
  padding: 30,
  borderRadius: 12,
  width: 400,
  maxWidth: "90vw",
  display: "flex",
  flexDirection: "column",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const actions = {
  display: "flex",
  gap: 12,
  marginTop: 10,
};

const saveBtn = {
  flex: 1,
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.2s",
};

const cancelBtn = {
  flex: 1,
  background: "#6b7280",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.2s",
};
