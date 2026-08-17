import Layout from "../components/layout/Layout";
import TicketForm from "../components/ticket/TicketForm";

function EditTicket() {
  return (
    <Layout>

      {/* Heading */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800">
          Edit Ticket
        </h1>

        <p className="text-gray-500 mt-2">
          Update the ticket details below.
        </p>

      </div>

      <TicketForm mode="edit" />

    </Layout>
  );
}

export default EditTicket;