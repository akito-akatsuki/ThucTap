"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Employees() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
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

    const adminEmail = session?.user?.email;

    await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, role, adminEmail }),
    });

    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this employee?")) return;

    await fetch("/api/users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

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

      <div style={card}>
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
            {users.map((u) => (
              <tr key={u.id} style={row}>
                <td style={userCell}>
                  <div style={avatar}>{u.email?.charAt(0).toUpperCase()}</div>

                  <div>
                    <div style={email}>{u.email}</div>
                  </div>
                </td>

                <td>
                  <select
                    value={u.role}
                    style={roleSelect}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </select>
                </td>

                <td style={date}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>

                <td>
                  <button style={deleteBtn} onClick={() => deleteUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const container = {
  padding: 40,
};

const title = {
  marginBottom: 20,
};

const card = {
  background: "white",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};

const table = {
  width: "100%",
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
  gap: 12,
  padding: "12px 0",
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
};

const email = {
  fontSize: 14,
  fontWeight: 500,
};

const roleSelect = {
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
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
  cursor: "pointer",
};
