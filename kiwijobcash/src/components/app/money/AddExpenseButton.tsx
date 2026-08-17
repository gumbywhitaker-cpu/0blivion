"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExpenseFormModal } from "@/components/app/money/ExpenseFormModal";

export function AddExpenseButton() {
  const params = useSearchParams();
  const [open, setOpen] = React.useState(params.get("new") === "expense");
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} icon={<PlusCircle className="size-4" />}>
        Add expense
      </Button>
      <ExpenseFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
