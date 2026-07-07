"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

type ProductField = "name" | "category" | "price" | "stock" | "status" | "ignore";
type RowState = "ready" | "warning" | "error";
type CsvRow = Record<string, string>;
type Organization = { id: string; name: string };
type PromotionResult = { job_id: string; promoted: number; duplicates: number; errors: number };

const requiredFields: ProductField[] = ["name", "category", "price", "stock"];
const fieldLabels: Record<ProductField, string> = {
  name: "Product name",
  category: "Category",
  price: "Price",
  stock: "Stock",
  status: "Status",
  ignore: "Don't import",
};

const sampleCsv = `product_name,product_category,unit_price,quantity,status
Golden Retriever Shampoo,Grooming,14.99,120,active
Premium Dog Kibble,Food & Treats,39.99,85,active
Paw Balm,Health & Wellness,9.99,200,active
Premium Dog Kibble,Food & Treats,39.99,85,active
Travel Bowl,Carriers & Travel,-4.50,30,active`;

function parseCsv(source: string) {
  const lines = source.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [] as string[], rows: [] as CsvRow[] };
  const split = (line: string) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.trim().replace(/^\"|\"$/g, ""));
  const headers = split(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = split(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function guessField(header: string): ProductField {
  const value = header.toLowerCase();
  if (value.includes("name")) return "name";
  if (value.includes("category")) return "category";
  if (value.includes("price")) return "price";
  if (value.includes("quantity") || value.includes("stock")) return "stock";
  if (value.includes("status")) return "status";
  return "ignore";
}

export default function ImportWorkspace({ organizations }: { organizations: Organization[] }) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("pawshop-products-july.csv");
  const [csv, setCsv] = useState(sampleCsv);
  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const [mapping, setMapping] = useState<Record<string, ProductField>>(() =>
    Object.fromEntries(parseCsv(sampleCsv).headers.map((header) => [header, guessField(header)])),
  );
  const [promoted, setPromoted] = useState(false);
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionError, setPromotionError] = useState("");
  const [promotionResult, setPromotionResult] = useState<PromotionResult | null>(null);

  const mappedValue = (row: CsvRow, field: ProductField) => {
    const header = Object.keys(mapping).find((key) => mapping[key] === field);
    return header ? row[header] : "";
  };

  const reviewedRows = useMemo(() => {
    const names = new Set<string>();
    return parsed.rows.map((row, index) => {
      const name = mappedValue(row, "name").trim();
      const price = Number(mappedValue(row, "price"));
      const stock = Number(mappedValue(row, "stock"));
      const messages: string[] = [];
      let state: RowState = "ready";
      if (!name || !mappedValue(row, "category") || Number.isNaN(price) || price <= 0 || Number.isNaN(stock) || stock < 0) {
        state = "error";
        messages.push(price <= 0 ? "Price must be greater than zero" : "Required value is invalid");
      } else if (names.has(name.toLowerCase())) {
        state = "warning";
        messages.push("Duplicate in this file — skipped");
      }
      names.add(name.toLowerCase());
      return { index: index + 2, row, state, message: messages[0] ?? "Validated and ready" };
    });
  }, [parsed.rows, mapping]);

  const counts = reviewedRows.reduce(
    (total, row) => ({ ...total, [row.state]: total[row.state] + 1 }),
    { ready: 0, warning: 0, error: 0 },
  );
  const mappingComplete = requiredFields.every((field) => Object.values(mapping).includes(field));

  function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const contents = String(reader.result ?? "");
      const next = parseCsv(contents);
      setCsv(contents);
      setFileName(file.name);
      setMapping(Object.fromEntries(next.headers.map((header) => [header, guessField(header)])));
      setPromoted(false);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const template = `product_name,product_category,unit_price,quantity,status\nExample Dog Treats,Food & Treats,12.99,50,active\n`;
    const url = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pawshop-product-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function promoteImport() {
    if (!organizationId) {
      setPromotionError("Choose a workspace before promoting this import.");
      return;
    }
    setIsPromoting(true);
    setPromotionError("");
    const rows = reviewedRows.map((item) => ({
      row_number: item.index,
      status: item.state === "warning" ? "duplicate" : item.state,
      message: item.message,
      payload: {
        name: mappedValue(item.row, "name"),
        category: mappedValue(item.row, "category"),
        price: mappedValue(item.row, "price"),
        stock: mappedValue(item.row, "stock"),
        status: mappedValue(item.row, "status") || "active",
      },
    }));

    try {
      const response = await fetch("/api/imports/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organizationId, file_name: fileName, mapping, rows }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Promotion failed");
      setPromotionResult(result);
      setPromoted(true);
      setStep(4);
    } catch (error) {
      setPromotionError(error instanceof Error ? error.message : "Promotion failed");
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl" data-testid="import-workspace">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
            <ShieldCheck size={15} /> Staging workspace
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Import product data</h1>
          <p className="mt-2 text-sm text-slate-500">Validate every row before anything reaches production.</p>
        </div>
        <label className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          Workspace
          <select aria-label="Import workspace" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="ml-1 bg-transparent font-semibold text-slate-800 outline-none">
            {organizations.length === 0 && <option value="">No workspace available</option>}
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </label>
      </div>

      <ol className="mb-8 grid grid-cols-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {["Upload", "Map columns", "Review", "Complete"].map((label, index) => {
          const number = index + 1;
          const active = step === number;
          const complete = step > number;
          return (
            <li key={label} className={`flex items-center gap-3 border-r border-slate-100 px-3 py-4 last:border-0 ${active ? "bg-indigo-50/70" : ""}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {complete ? <Check size={14} /> : number}
              </span>
              <span className={`hidden text-sm font-medium sm:block ${active ? "text-indigo-800" : "text-slate-500"}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section className="card overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">Choose a CSV file</h2>
              <p className="mt-1 text-sm text-slate-500">UTF-8 CSV, up to 10 MB. The first row must contain column names.</p>
            </div>
            <button type="button" onClick={downloadTemplate} className="btn-secondary shrink-0" data-testid="download-template">
              <Download size={16} /> Download CSV template
            </button>
          </div>
          <div className="p-6">
            <label className="group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
              <input data-testid="csv-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={loadFile} />
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 group-hover:scale-105">
                <UploadCloud size={25} />
              </span>
              <span className="font-semibold text-slate-900">Drop your CSV here, or click to browse</span>
              <span className="mt-2 text-sm text-slate-500">A sample file is preloaded so you can explore the workflow.</span>
              <span className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <FileSpreadsheet size={16} className="text-emerald-600" /> {fileName} · {parsed.rows.length} rows
              </span>
            </label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Map source columns</h2>
            <p className="mt-1 text-sm text-slate-500">Match the uploaded headings to the production product fields.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {parsed.headers.map((header) => (
              <div key={header} className="grid items-center gap-4 px-6 py-4 sm:grid-cols-[1fr_32px_1fr]">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">CSV column</p>
                  <p className="mt-1 font-mono text-sm font-medium text-slate-800">{header}</p>
                </div>
                <ArrowRight size={16} className="hidden text-slate-300 sm:block" />
                <select aria-label={`Map ${header}`} className="form-input" value={mapping[header] ?? "ignore"} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value as ProductField }))}>
                  {Object.entries(fieldLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            ))}
          </div>
          {!mappingComplete && <p className="mx-6 mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Map product name, category, price, and stock to continue.</p>}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary label="Ready to import" value={counts.ready} color="emerald" />
            <Summary label="Duplicates skipped" value={counts.warning} color="amber" />
            <Summary label="Errors blocked" value={counts.error} color="rose" />
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 className="font-semibold text-slate-900">Staging review</h2><p className="mt-0.5 text-xs text-slate-500">Only valid, non-duplicate rows will be promoted.</p></div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{reviewedRows.length} rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Row</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Validation</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewedRows.map((item) => <tr key={item.index} className={item.state === "error" ? "bg-rose-50/40" : item.state === "warning" ? "bg-amber-50/40" : ""}><td className="px-5 py-4 font-mono text-xs text-slate-400">{item.index}</td><td className="px-5 py-4 font-medium text-slate-900">{mappedValue(item.row, "name")}</td><td className="px-5 py-4 text-slate-600">{mappedValue(item.row, "category")}</td><td className="px-5 py-4 text-slate-600">${mappedValue(item.row, "price")}</td><td className="px-5 py-4 text-slate-600">{mappedValue(item.row, "stock")}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.state === "ready" ? "text-emerald-700" : item.state === "warning" ? "text-amber-700" : "text-rose-700"}`}>{item.state === "ready" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{item.message}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="card px-6 py-16 text-center" data-testid="import-complete">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32} /></span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Import promoted safely</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{promotionResult?.promoted ?? counts.ready} products moved from staging to production. {(promotionResult?.duplicates ?? counts.warning) + (promotionResult?.errors ?? counts.error)} blocked rows remain available for audit.</p>
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200"><ShieldCheck size={15} className="text-indigo-600" /> Transaction committed · duplicate-safe · tenant scoped</div>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button className="btn-secondary disabled:invisible" disabled={step === 1 || step === 4} onClick={() => setStep((value) => value - 1)}><ArrowLeft size={16} /> Back</button>
        {step < 3 && <button data-testid="import-next" className="btn-primary" disabled={step === 2 && !mappingComplete} onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight size={16} /></button>}
        {step === 3 && <div className="flex flex-col items-end gap-2">{promotionError && <p className="text-sm text-rose-600" role="alert">{promotionError}</p>}<button data-testid="promote-import" className="btn-primary" disabled={isPromoting || !organizationId} onClick={promoteImport}>{isPromoting ? <><Loader2 size={16} className="animate-spin" /> Promoting…</> : <>Promote {counts.ready} valid rows <ArrowRight size={16} /></>}</button></div>}
        {step === 4 && promoted && <button className="btn-secondary" onClick={() => { setPromoted(false); setPromotionResult(null); setStep(1); }}>Start another import</button>}
      </div>
    </div>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: "emerald" | "amber" | "rose" }) {
  const styles = { emerald: "border-emerald-200 bg-emerald-50 text-emerald-700", amber: "border-amber-200 bg-amber-50 text-amber-700", rose: "border-rose-200 bg-rose-50 text-rose-700" };
  return <div className={`rounded-xl border px-5 py-4 ${styles[color]}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>;
}
