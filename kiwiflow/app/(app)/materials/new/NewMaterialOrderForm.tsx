"use client";

import { useActionState, useState } from "react";
import { createMaterialOrderAction, type FormState } from "../actions";

type Option = { id: string; name: string };
type Line = { description: string; quantity: string; unit: string; unitPrice: string };

const emptyLine = (): Line => ({ description: "", quantity: "1", unit: "", unitPrice: "" });

export function NewMaterialOrderForm({ suppliers, orchards }: { suppliers: Option[]; orchards: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createMaterialOrderAction, undefined);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const itemsJson = JSON.stringify(
    lines.map((l) => ({
      description: l.description,
      quantity: Number.parseFloat(l.quantity) || 0,
      unit: l.unit,
      unitPrice: Number.parseFloat(l.unitPrice) || 0,
    })),
  );

  const estimatedTotal = lines.reduce(
    (sum, l) => sum + (Number.parseFloat(l.quantity) || 0) * (Number.parseFloat(l.unitPrice) || 0),
    0,
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="supplierId" className="text-sm font-medium text-kf-charcoal">
            Supplier
          </label>
          <select
            id="supplierId"
            name="supplierId"
            required
            defaultValue=""
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          >
            <option value="" disabled>
              Choose a supplier
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="orchardId" className="text-sm font-medium text-kf-charcoal">
            Orchard (optional)
          </label>
          <select
            id="orchardId"
            name="orchardId"
            defaultValue=""
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          >
            <option value="">Not orchard-specific</option>
            {orchards.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="requestedDeliveryDate" className="text-sm font-medium text-kf-charcoal">
          Requested delivery date
        </label>
        <input
          id="requestedDeliveryDate"
          name="requestedDeliveryDate"
          type="date"
          className="w-48 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-kf-charcoal">Line items</p>
        <div className="overflow-x-auto rounded-lg border border-kf-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-kf-border bg-kf-card text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Unit price</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const amount = (Number.parseFloat(line.quantity) || 0) * (Number.parseFloat(line.unitPrice) || 0);
                return (
                  <tr key={i} className="border-b border-kf-border last:border-0">
                    <td className="px-3 py-2">
                      <input
                        value={line.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder="e.g. Foliar zinc spray"
                        className="w-full rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm outline-none focus:border-kf-green-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={line.quantity}
                        onChange={(e) => updateLine(i, { quantity: e.target.value })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-20 rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm outline-none focus:border-kf-green-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={line.unit}
                        onChange={(e) => updateLine(i, { unit: e.target.value })}
                        placeholder="bag, L, kg"
                        className="w-24 rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm outline-none focus:border-kf-green-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={line.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-24 rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm outline-none focus:border-kf-green-600"
                      />
                    </td>
                    <td className="px-3 py-2 text-kf-charcoal">${amount.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        className="btn text-xs font-medium text-kf-red hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="btn self-start rounded-md border border-kf-border px-3 py-1.5 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
        >
          + Add line
        </button>
        <p className="text-right text-sm font-semibold text-kf-charcoal">
          Estimated total: ${estimatedTotal.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-kf-charcoal">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create order"}
      </button>
    </form>
  );
}
