"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { parseCsv, guessColumnMapping, CUSTOMER_IMPORT_FIELDS, type CustomerImportField } from "@/lib/csv";
import { Upload, CheckCircle2 } from "lucide-react";

type Step = "upload" | "map" | "done";

export function CsvImportClient() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = React.useState<Step>("upload");
  const [fileName, setFileName] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Partial<Record<CustomerImportField, number>>>({});
  const [importing, setImporting] = React.useState(false);
  const [importedCount, setImportedCount] = React.useState(0);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast.push("That file doesn't look like a CSV with a header row and data.", "error");
      return;
    }
    setFileName(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(guessColumnMapping(parsed.headers));
    setStep("map");
  }

  async function submitImport() {
    if (mapping.name === undefined) {
      toast.push("Map a column to Name before importing.", "error");
      return;
    }
    setImporting(true);
    try {
      const payload = rows.map((row) => {
        const record: Record<string, string> = {};
        for (const field of CUSTOMER_IMPORT_FIELDS) {
          const colIndex = mapping[field.key];
          record[field.key] = colIndex !== undefined ? (row[colIndex] ?? "").trim() : "";
        }
        return record;
      });

      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Import failed.", "error");
        return;
      }
      setImportedCount(data.imported);
      setStep("done");
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto size-10 text-brand" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Imported {importedCount} customer{importedCount === 1 ? "" : "s"}
        </h1>
        <p className="mt-2 text-muted">They&apos;re in your customer list now.</p>
        <Button href="/app/customers" className="mt-6">
          Go to customers
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Import customers</h1>
        <p className="mt-1 text-muted">Upload a CSV export from your spreadsheet, Xero, or old CRM.</p>
      </div>

      {step === "upload" && (
        <Card>
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-16 text-center hover:border-brand"
          >
            <Upload className="size-8 text-muted" />
            <p className="font-medium text-foreground">Click to choose a CSV file</p>
            <p className="text-sm text-muted">The first row should be column headers.</p>
          </label>
          <input id="csv-file" type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader
            title="Match your columns"
            subtitle={`${fileName} — ${rows.length} row${rows.length === 1 ? "" : "s"} found. Name is required.`}
          />
          <div className="space-y-3">
            {CUSTOMER_IMPORT_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm font-medium text-foreground">
                  {field.label}
                  {field.required && <span className="text-danger"> *</span>}
                </span>
                <Select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field.key]: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">— Don&apos;t import —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          {rows.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-muted">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className="whitespace-nowrap px-3 py-2 text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={submitImport} loading={importing}>
              Import {rows.length} customer{rows.length === 1 ? "" : "s"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
