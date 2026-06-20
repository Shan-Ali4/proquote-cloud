import { createFileRoute } from "@tanstack/react-router";
import { DocumentsList } from "@/components/app/DocumentsList";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — ProQuote Pro" },
      { name: "description", content: "Create, send and convert GST-ready quotations." },
    ],
  }),
  component: () => <DocumentsList docType="quotation" />,
});
