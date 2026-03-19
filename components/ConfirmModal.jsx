"use client";

export default function ConfirmModal({ text, onConfirm, onCancel }) {
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={icon}>!</div>

        <h2 style={title}>Are you sure?</h2>

        <p style={desc}>{text}</p>

        <div style={actions}>
          <button onClick={onCancel} style={cancelBtn}>
            Cancel
          </button>

          <button onClick={onConfirm} style={confirmBtn}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* STYLE */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modal = {
  background: "white",
  borderRadius: 20,
  width: 420,
  padding: 30,
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
};

const icon = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "#3b82f6",
  color: "white",
  fontSize: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 15px auto",
};

const title = {
  fontSize: 24,
  marginBottom: 10,
};

const desc = {
  color: "#666",
  marginBottom: 25,
};

const actions = {
  display: "flex",
  justifyContent: "center",
  gap: 15,
};

const cancelBtn = {
  padding: "10px 22px",
  borderRadius: 12,
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
};

const confirmBtn = {
  padding: "10px 22px",
  borderRadius: 12,
  border: "none",
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
};
