import { createFileRoute } from "@tanstack/react-router";
import { DocumentsList } from "@/components/app/DocumentsList";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({
    meta: [
      { title: "Proforma Invoices — ProQuote Pro" },
      { name: "description", content: "Issue branded proforma invoices with GST and payment tracking." },
    ],
  }),
  component: () => <DocumentsList docType="proforma" />,
});
