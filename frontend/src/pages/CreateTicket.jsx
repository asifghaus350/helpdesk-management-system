import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Layout from "../components/layout/Layout";
import TicketForm from "../components/ticket/TicketForm";

function CreateTicket() {
  return (
    <Layout>

      {/* Page Heading */}

      <div className="mb-6">

        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} />
          Back to tickets
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mt-3">
          Create Ticket
        </h1>

        <p className="text-slate-500 mt-2">
          Describe the issue and we'll route it to the right engineer.
        </p>

      </div>

      <TicketForm mode="create" />

    </Layout>
  );
}

export default CreateTicket;
