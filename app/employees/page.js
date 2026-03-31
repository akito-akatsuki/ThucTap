"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ConfirmModal";
import EmployeeAddModal from "@/components/EmployeeAddModal";

export default function Employees() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchTerm]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      await init();
      await getCurrentUser();
      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return null;
  }

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

  const addEmployee = async ({ name, email, password }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();

    if (json.error) {
      throw new Error(json.error);
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
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <div className="dashboard-card-header flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">👨‍💼</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Employee Management
                </h1>
                <p className="text-gray-500 dark:text-slate-400">
                  Manage your team members
                </p>
              </div>
            </div>
          </div>

          {/* Skeleton Table */}
          <div className="table-wrapper">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="p-4"></th>
                  <th className="p-4"></th>
                  <th className="p-4"></th>
                  <th className="p-4"></th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-gray-100"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 w-10 h-10 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="bg-gray-200 h-4 w-24 rounded"></div>
                          <div className="bg-gray-200 h-3 w-16 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="bg-gray-200 h-8 w-20 rounded-lg"></div>
                    </td>
                    <td className="p-4">
                      <div className="bg-gray-200 h-4 w-24 rounded"></div>
                    </td>
                    <td className="p-4">
                      <div className="bg-gray-200 h-4 w-20 rounded"></div>
                    </td>
                    <td className="p-4">
                      <div className="bg-gray-200 h-8 w-16 rounded-lg"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="dashboard-page flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-md">
            Admin privileges required to manage employees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page smooth-scroll-page">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-card-header flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">👨‍💼</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate">
                Employee Management
              </h1>
              <p className="text-gray-500 dark:text-slate-400 mt-1">
                {filteredUsers.length} of {users.length} employees
              </p>
            </div>
          </div>

          {/* Add Employee Button at Top Right */}
          <div className="w-full lg:w-auto flex justify-start lg:justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
            >
              <span className="text-xl">+</span>
              Add Employee
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search employees by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No employees found
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search criteria."
                : "Get started by clicking Add Employee."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isMe = u.id === currentUser?.id;
                      const roleColor =
                        u.role === "admin"
                          ? "status-ok bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                          : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";

                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-md flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                  {u.email?.charAt(0).toUpperCase()}
                                </div>
                                {isMe && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                    You
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="font-mono text-sm text-gray-900 dark:text-slate-100 truncate max-w-xs">
                            {u.email}
                          </td>

                          {/* Role Dropdown */}
                          <td>
                            <select
                              value={u.role}
                              disabled={isMe}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className={`${roleColor} form-input text-sm px-3 py-1.5 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed`}
                            >
                              <option value="admin">Admin</option>
                              <option value="staff">Staff</option>
                            </select>
                          </td>

                          <td className="text-sm text-gray-500 dark:text-slate-400">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>

                          {/* Only Delete */}
                          <td>
                            <button
                              className="btn-danger text-sm px-3 py-1.5 !shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isMe}
                              onClick={() => {
                                setSelectedUserId(u.id);
                                setConfirmOpen(true);
                              }}
                              title={
                                isMe ? "Cannot delete yourself" : "Delete user"
                              }
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
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredUsers.map((u) => {
                const isMe = u.id === currentUser?.id;
                const roleColor =
                  u.role === "admin"
                    ? "status-ok bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";

                return (
                  <div key={u.id} className="product-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg uppercase shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex-shrink-0">
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-lg text-gray-900 truncate pr-4">
                            {u.email}
                          </div>
                          {isMe && (
                            <div className="text-red-500 font-medium text-sm mt-1">
                              (You)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <button
                          className="btn-danger text-sm !shadow-sm opacity-75 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isMe}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setConfirmOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-slate-400 uppercase text-xs font-medium tracking-wide mb-1">
                          Role
                        </div>
                        <select
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className={`${roleColor} form-input text-sm w-full pr-8 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-slate-400 uppercase text-xs font-medium tracking-wide mb-1">
                          Email
                        </div>
                        <div className="font-mono break-all text-gray-900 dark:text-slate-100">
                          {u.email}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-slate-400 uppercase text-xs font-medium tracking-wide mb-1">
                          Joined
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {confirmOpen && (
          <ConfirmModal
            text="This user will be permanently deleted and cannot be recovered."
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
        {showAddModal && (
          <EmployeeAddModal
            onClose={() => setShowAddModal(false)}
            onSubmit={addEmployee}
          />
        )}
      </div>
    </div>
  );
}
