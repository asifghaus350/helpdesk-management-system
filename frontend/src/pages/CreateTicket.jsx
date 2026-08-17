import Layout from "../components/layout/Layout";
import TicketForm from "../components/ticket/TicketForm";

function CreateTicket() {
  return (
    <Layout>

      {/* Page Heading */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800">
          Create Ticket
        </h1>

        <p className="text-gray-500 mt-2">
          Fill in the details below to create a new support ticket.
        </p>

      </div>

      <TicketForm mode="create" />

    </Layout>
  );
}

export default CreateTicket;