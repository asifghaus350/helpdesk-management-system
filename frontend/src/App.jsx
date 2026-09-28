import { Toaster } from "react-hot-toast";

import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <AppRoutes />

      {/* Success / error messages (toast.success, toast.error) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className:
            "!rounded-xl !text-sm !font-medium !shadow-lg !border !border-slate-200 dark:!bg-slate-800 dark:!text-slate-100 dark:!border-slate-700",
        }}
      />
    </>
  );
}

export default App;
