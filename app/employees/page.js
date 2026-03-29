"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ConfirmModal";

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    init();
    getCurrentUser();
  }, []);

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const email = session.user.email;

    const res = await fetch(`/api/users?email=${email}`);
    const json = await res.json();

    setRole(json.role);
    loadUsers();
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    setUsers(json.data || []);
    setLoading(false);
  };

  const changeRole = async (id, role) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, role }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    loadUsers();
  };

  const deleteUser = async (id) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    loadUsers();
  };

  if (loading) {
    return <div style={container}>Loading...</div>;
  }

  if (role !== "admin") {
    return <div style={container}>Access denied</div>;
  }

  return (
    <div style={container}>
      <h2 style={title}>👨‍💼 Employee Management</h2>

      {/* =========================
   EMPLOYEES TABLE / CARD VIEW
========================= */}
      <div style={card}>
        <div className="hidden md:block">
          {/* Desktop Table */}
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={row}>
                    <td style={userCell}>
                      <div style={avatar}>
                        {u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div
                        style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        <div style={email}>
                          {u.email}{" "}
                          {isMe && (
                            <span style={{ color: "red", marginLeft: 6 }}>
                              (You)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        style={selectStyle}
                      >
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                      </select>
                    </td>

                    <td style={date}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <button
                        style={{
                          ...deleteBtn,
                          opacity: isMe ? 0.5 : 1,
                          cursor: isMe ? "not-allowed" : "pointer",
                        }}
                        disabled={isMe}
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setConfirmOpen(true);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {users.map((u) => {
            const isMe = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div style={avatar}>{u.email?.charAt(0).toUpperCase()}</div>
                    <div className="text-sm font-medium truncate">
                      {u.email}{" "}
                      {isMe && <span className="text-red-500 ml-1">(You)</span>}
                    </div>
                  </div>

                  <button
                    style={{
                      ...deleteBtn,
                      opacity: isMe ? 0.5 : 1,
                      cursor: isMe ? "not-allowed" : "pointer",
                    }}
                    disabled={isMe}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setConfirmOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <div>
                    Role:{" "}
                    <select
                      value={u.role}
                      disabled={isMe}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      style={selectStyle}
                    >
                      <option value="admin">Admin</option>
                      <option value="seller">Seller</option>
                    </select>
                  </div>
                  <div>
                    Created: {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {confirmOpen && (
        <ConfirmModal
          text="This user will be permanently deleted."
          onCancel={() => {
            setConfirmOpen(false);
            setSelectedUserId(null);
          }}
          onConfirm={() => {
            deleteUser(selectedUserId);
            setConfirmOpen(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}

/* STYLES */
const container = { padding: 20 };
const title = { marginBottom: 20, fontSize: 20 };
const card = {
  background: "white",
  borderRadius: 10,
  padding: 15,
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};
const tableWrapper = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};
const table = {
  width: "100%",
  minWidth: 600,
  borderCollapse: "collapse",
};
const th = {
  textAlign: "left",
  borderBottom: "1px solid #eee",
  paddingBottom: 10,
  fontSize: 14,
  color: "#666",
};
const row = {
  borderBottom: "1px solid #f3f3f3",
};
const userCell = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 0",
  minWidth: 120,
};
const avatar = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#6366f1",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  flexShrink: 0,
};
const email = {
  fontSize: 14,
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const selectStyle = {
  padding: "4px 6px",
  borderRadius: 4,
  fontSize: 14,
  minWidth: 90,
};
const date = {
  fontSize: 13,
  color: "#666",
};
const deleteBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
};
