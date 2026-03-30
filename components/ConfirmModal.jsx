"use client";

export default function ConfirmModal({ text, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-[20px] w-[420px] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-3xl flex items-center justify-center mx-auto mb-4">
          !
        </div>

        <h2 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">
          Are you sure?
        </h2>

        <p className="text-slate-600 dark:text-slate-300 mb-6">{text}</p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
