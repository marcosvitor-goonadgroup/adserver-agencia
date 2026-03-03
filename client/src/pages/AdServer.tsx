import { useEffect, useRef, useState } from "react";
import {
  fetchSites, fetchDict, createSite, createZone, fetchZone, fetchZoneTag,
  createCampaign, createAd, assignAdToZones,
  updateCampaign, deleteCampaign, updateAd, deleteAd,
  updateSite, deleteSite, updateZone, deleteZone,
  type Site, type Dict, type AdDetails, type ZoneTagType, type AssignedAd,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function dictOptions(map: Record<string, string>) {
  return Object.entries(map).map(([id, name]) => ({ id: Number(id), name }));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#153ece]/30 w-full"
    />
  );
}

function Select({
  options, ...props
}: { options: { id: number; name: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#153ece]/30 w-full"
    >
      <option value="">— selecione —</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

function Btn({
  loading, children, ...props
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="bg-[#153ece] hover:bg-[#1233b0] disabled:opacity-50 text-white text-sm px-5 py-2 rounded-xl transition-colors"
    >
      {loading ? "Aguarde…" : children}
    </button>
  );
}

function Alert({ type, msg }: { type: "ok" | "err"; msg: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
      {msg}
    </div>
  );
}

function CodeBox({ code, loading }: { code: string; loading?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative">
      <pre className={`bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed transition-opacity duration-200 ${loading ? "opacity-40" : "opacity-100"}`}>
        {code}
      </pre>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-xs bg-gray-800/80 px-3 py-1 rounded-lg">Carregando…</span>
        </div>
      )}
      <button
        onClick={copy}
        disabled={loading}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs px-2 py-1 rounded-lg"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

// ── Modals ──────────────────────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {children}
    </div>
  );
}

function ConfirmModal({
  title, description, onConfirm, onCancel, loading,
}: {
  title: string; description: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <ModalOverlay>
      <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-black mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function EditModal({
  title, onSave, onCancel, loading, error, children,
}: {
  title: string; onSave: () => void; onCancel: () => void;
  loading?: boolean; error?: string | null; children: React.ReactNode;
}) {
  return (
    <ModalOverlay>
      <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
        <h3 className="text-base font-semibold text-black">{title}</h3>
        <div className="flex flex-col gap-3">{children}</div>
        {error && <Alert type="err" msg={error} />}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <Btn loading={loading} onClick={onSave}>Salvar</Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Step badge ─────────────────────────────────────────────────────────────────

function StepTab({
  step, label, active, done, onClick,
}: { step: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
        active
          ? "bg-[#153ece] text-white"
          : done
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-white text-gray-500 border border-gray-200 hover:border-[#153ece] hover:text-[#153ece]"
      }`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        active ? "bg-white/20" : done ? "bg-green-200 text-green-800" : "bg-gray-100"
      }`}>
        {done && !active ? "✓" : step}
      </span>
      {label}
    </button>
  );
}

// ── Icon buttons ───────────────────────────────────────────────────────────────

function IconBtn({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors shrink-0 ${
        danger
          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

// Pencil icon
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Trash icon
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Step 1: Campaigns ──────────────────────────────────────────────────────────

function Step1Campaigns({
  campaigns, dict, onNext, onRefresh,
}: {
  campaigns: import("@/lib/api").Campaign[];
  dict: Dict;
  onNext: (campaignId: number) => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [priceModel, setPriceModel] = useState("1");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<import("@/lib/api").Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<import("@/lib/api").Campaign | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(c: import("@/lib/api").Campaign) {
    setEditTarget(c);
    setEditName(c.name);
    setEditRate(String(c.counters?.total_balance ?? ""));
    setEditStart(c.limits?.start_at?.slice(0, 10) ?? "");
    setEditEnd(c.limits?.finish_at?.slice(0, 10) ?? "");
    setEditError(null);
  }

  async function handleCreate() {
    if (!name) return setFeedback({ type: "err", msg: "Nome é obrigatório." });
    setLoading(true); setFeedback(null);
    try {
      const c = await createCampaign({
        name,
        idpricemodel: Number(priceModel),
        ...(rate ? { rate: Number(rate) } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { finish_date: endDate } : {}),
      });
      setFeedback({ type: "ok", msg: `Campanha "${c.name}" criada (ID ${c.id}). Selecione-a para continuar.` });
      setName(""); setRate(""); setStartDate(""); setEndDate("");
      onRefresh();
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar campanha." });
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editTarget || !editName) return setEditError("Nome é obrigatório.");
    setEditLoading(true); setEditError(null);
    try {
      await updateCampaign(editTarget.id, {
        name: editName,
        ...(editRate ? { rate: Number(editRate) } : {}),
        ...(editStart ? { start_date: editStart } : {}),
        ...(editEnd ? { finish_date: editEnd } : {}),
      });
      setEditTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Erro ao editar.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCampaign(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setDeleteTarget(null);
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao excluir." });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-black">Nova campanha</h3>
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Campanha Janeiro" />
          </Field>
          <Field label="Modelo de preço">
            <Select options={dictOptions(dict.price_models)} value={priceModel} onChange={(e) => setPriceModel(e.target.value)} />
          </Field>
          <Field label="Taxa (CPM/CPC)">
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Ex: 1.5" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Término">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
          <Btn loading={loading} onClick={handleCreate}>Criar campanha</Btn>
        </div>

        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
          <h3 className="text-base font-semibold text-black">Campanhas existentes</h3>
          {campaigns.length === 0 && <p className="text-gray-400 text-sm">Nenhuma campanha.</p>}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px]">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2 hover:border-[#153ece]/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-black truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">ID {c.id} · {c.pricemodel.name} · {c.runstatus.name}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <IconBtn onClick={() => openEdit(c)} title="Editar campanha"><PencilIcon /></IconBtn>
                  <IconBtn onClick={() => setDeleteTarget(c)} title="Excluir campanha" danger><TrashIcon /></IconBtn>
                  <a
                    href={`/dashboard/${c.id}`}
                    title="Ver dashboard desta campanha"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </a>
                  <button
                    onClick={() => onNext(c.id)}
                    className="text-[#153ece] text-xs font-medium hover:underline ml-1"
                  >
                    Selecionar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editTarget && (
        <EditModal title={`Editar: ${editTarget.name}`} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={editLoading} error={editError}>
          <Field label="Nome">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="Taxa (CPM/CPC)">
            <Input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} placeholder="Ex: 1.5" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
            </Field>
            <Field label="Término">
              <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
            </Field>
          </div>
        </EditModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir campanha"
          description={`Tem certeza que deseja excluir a campanha "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ── Step 2: Sites ──────────────────────────────────────────────────────────────

function Step2Sites({
  sites, dict, onRefresh, onNext,
}: {
  sites: Site[];
  dict: Dict;
  onRefresh: () => void;
  onNext: (siteId: number) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [catId, setCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Site | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openEdit(s: Site) {
    setEditTarget(s);
    setEditName(s.name);
    setEditUrl(s.url);
    setEditCat(String(s.category?.id ?? ""));
    setEditError(null);
  }

  async function handleCreate() {
    if (!name || !url) return setFeedback({ type: "err", msg: "Nome e URL são obrigatórios." });
    setLoading(true); setFeedback(null);
    try {
      await createSite({ name, url, ...(catId ? { idcategory: Number(catId) } : {}) });
      setName(""); setUrl(""); setCatId("");
      setFeedback({ type: "ok", msg: "Site criado com sucesso!" });
      onRefresh();
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar site." });
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editTarget || !editName || !editUrl) return setEditError("Nome e URL são obrigatórios.");
    setEditLoading(true); setEditError(null);
    try {
      await updateSite(editTarget.id, {
        name: editName,
        url: editUrl,
        ...(editCat ? { idcategory: Number(editCat) } : {}),
      });
      setEditTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Erro ao editar.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSite(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setDeleteTarget(null);
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao excluir." });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-black">Novo site</h3>
          <Field label="Nome do site">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Meu Site" />
          </Field>
          <Field label="URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemplo.com" />
          </Field>
          <Field label="Categoria">
            <Select options={dictOptions(dict.categories)} value={catId} onChange={(e) => setCatId(e.target.value)} />
          </Field>
          {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
          <Btn loading={loading} onClick={handleCreate}>Criar site</Btn>
        </div>

        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
          <h3 className="text-base font-semibold text-black">Sites existentes</h3>
          {sites.length === 0 && <p className="text-gray-400 text-sm">Nenhum site encontrado.</p>}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px]">
            {sites.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2 hover:border-[#153ece]/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-black truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.url} · {s.zones.length} zona(s)</p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <IconBtn onClick={() => openEdit(s)} title="Editar site"><PencilIcon /></IconBtn>
                  <IconBtn onClick={() => setDeleteTarget(s)} title="Excluir site" danger><TrashIcon /></IconBtn>
                  <button
                    onClick={() => onNext(s.id)}
                    className="text-[#153ece] text-xs font-medium hover:underline ml-1"
                  >
                    Selecionar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editTarget && (
        <EditModal title={`Editar: ${editTarget.name}`} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={editLoading} error={editError}>
          <Field label="Nome">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="URL">
            <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <Select options={dictOptions(dict.categories)} value={editCat} onChange={(e) => setEditCat(e.target.value)} />
          </Field>
        </EditModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir site"
          description={`Tem certeza que deseja excluir o site "${deleteTarget.name}"? Todas as zonas associadas também serão removidas.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ── Step 3: Zones ──────────────────────────────────────────────────────────────

function Step3Zones({
  sites, dict, selectedSiteId, onNext, onRefresh,
}: {
  sites: Site[];
  dict: Dict;
  selectedSiteId: number | null;
  onNext: (siteId: number, zoneId: number) => void;
  onRefresh: () => void;
}) {
  const [siteId, setSiteId] = useState(selectedSiteId ?? 0);
  const [name, setName] = useState("");
  const [formatId, setFormatId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagType, setTagType] = useState<ZoneTagType>("normal");
  const [tagZoneId, setTagZoneId] = useState<number | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<import("@/lib/api").Zone | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<import("@/lib/api").Zone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const site = sites.find((s) => s.id === siteId);

  const TAG_TYPES: { id: ZoneTagType; label: string; desc: string }[] = [
    { id: "normal",  label: "Standard", desc: "Script assíncrono — recomendado para a maioria dos sites" },
    { id: "iframe",  label: "IFrame",   desc: "Para sites com restrições de script" },
    { id: "amp",     label: "AMP",      desc: "Para páginas Google AMP" },
    { id: "prebid",  label: "Prebid",   desc: "Configuração JSON para header bidding" },
    { id: "email",   label: "Email",    desc: "Link de imagem para newsletters" },
  ];

  async function handleCreate() {
    if (!siteId || !name || !formatId) return setFeedback({ type: "err", msg: "Preencha todos os campos obrigatórios." });
    setLoading(true); setFeedback(null);
    try {
      const zone = await createZone(siteId, Number(formatId), {
        name,
        is_active: true,
        ...(sizeId ? { idsize: Number(sizeId) } : {}),
      });
      setFeedback({ type: "ok", msg: `Zona "${zone.name}" criada (ID ${zone.id}).` });
      setName(""); setFormatId(""); setSizeId("");
      onRefresh();
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar zona." });
    } finally {
      setLoading(false);
    }
  }

  async function handleTag(zoneId: number, type?: ZoneTagType) {
    const t = type ?? tagType;
    setTagLoading(true);
    setTagZoneId(zoneId);
    // Don't clear tag — keep old content visible while loading (just fade it)
    if (tagZoneId !== zoneId) setTag(null); // Only clear if switching zone entirely
    try {
      const code = await fetchZoneTag(zoneId, t);
      setTag(code);
    } catch {
      setTag("Erro ao buscar tag.");
    } finally {
      setTagLoading(false);
    }
  }

  function openEdit(z: import("@/lib/api").Zone) {
    setEditTarget(z);
    setEditName(z.name);
    setEditActive(z.is_active);
    setEditError(null);
  }

  async function handleEdit() {
    if (!editTarget || !editName) return setEditError("Nome é obrigatório.");
    setEditLoading(true); setEditError(null);
    try {
      await updateZone(editTarget.id, { name: editName, is_active: editActive });
      setEditTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Erro ao editar.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteZone(deleteTarget.id);
      if (tagZoneId === deleteTarget.id) { setTag(null); setTagZoneId(null); }
      setDeleteTarget(null);
      onRefresh();
    } catch (e: unknown) {
      setDeleteTarget(null);
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao excluir." });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-black">Nova zona</h3>
            <Field label="Site">
              <Select options={sites.map((s) => ({ id: s.id, name: s.name }))} value={siteId || ""} onChange={(e) => setSiteId(Number(e.target.value))} />
            </Field>
            <Field label="Nome da zona">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banner 300x250" />
            </Field>
            <Field label="Formato da zona">
              <Select options={dictOptions(dict.zone_formats)} value={formatId} onChange={(e) => { setFormatId(e.target.value); setSizeId(""); }} />
            </Field>
            {formatId === "6" && (
              <Field label="Tamanho do banner">
                <Select options={dictOptions(dict.sizes)} value={sizeId} onChange={(e) => setSizeId(e.target.value)} />
              </Field>
            )}
            {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
            <Btn loading={loading} onClick={handleCreate}>Criar zona</Btn>
          </div>

          {/* Zones of selected site */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
            <h3 className="text-base font-semibold text-black">
              Zonas {site ? `— ${site.name}` : "(selecione um site)"}
            </h3>
            {!site && <p className="text-gray-400 text-sm">Selecione um site ao lado.</p>}
            {site && site.zones.length === 0 && <p className="text-gray-400 text-sm">Nenhuma zona.</p>}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
              {site?.zones.map((z) => (
                <div
                  key={z.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black truncate">{z.name}</p>
                    <p className="text-xs text-gray-400">ID {z.id} · {z.format.name}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <IconBtn onClick={() => openEdit(z)} title="Editar zona"><PencilIcon /></IconBtn>
                    <IconBtn onClick={() => setDeleteTarget(z)} title="Excluir zona" danger><TrashIcon /></IconBtn>
                    <button
                      onClick={() => handleTag(z.id)}
                      className="text-[#153ece] text-xs font-medium hover:underline ml-1"
                    >
                      Tag
                    </button>
                    <button
                      onClick={() => onNext(site.id, z.id)}
                      className="text-green-600 text-xs font-medium hover:underline ml-1"
                    >
                      Selecionar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tag panel — stays visible while switching types, content fades */}
        {tagZoneId && (tag !== null || tagLoading) && (
          <div className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-semibold text-black">
                Tag — Zona {tagZoneId}
              </h3>
              <div className="flex gap-1 flex-wrap">
                {TAG_TYPES.map((t) => (
                  <button
                    key={t.id}
                    title={t.desc}
                    onClick={() => { setTagType(t.id); handleTag(tagZoneId, t.id); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      tagType === t.id
                        ? "bg-[#153ece] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {tag !== null
              ? <CodeBox code={tag} loading={tagLoading} />
              : <div className="bg-gray-900 rounded-xl p-4 text-green-400 text-xs text-center">Carregando tag…</div>
            }
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal title={`Editar: ${editTarget.name}`} onSave={handleEdit} onCancel={() => setEditTarget(null)} loading={editLoading} error={editError}>
          <Field label="Nome">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="rounded" />
            Ativa
          </label>
        </EditModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir zona"
          description={`Tem certeza que deseja excluir a zona "${deleteTarget.name}" (ID ${deleteTarget.id})?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ── Step 4: Ads ────────────────────────────────────────────────────────────────

function formatCategory(name: string): "banner_image" | "banner_video" | "vast" | "html" | "other" {
  const n = name.toLowerCase();
  if (n.includes("vast") || n.includes("linear") || n.includes("in-stream")) return "vast";
  if (n.includes("video")) return "banner_video";
  if (n.includes("html")) return "html";
  if (n.includes("banner") || n.includes("image") || n.includes("zip") || n.includes("native")) return "banner_image";
  return "other";
}

function FileInput({ accept, file, onChange }: { accept: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 w-full file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#153ece] file:text-white"
      />
      {file && <p className="text-xs text-gray-400 mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
    </div>
  );
}

// AssignedAd from zone: id, name, idcampaign, is_active (no url — fetched separately if needed)
type AdItem = AssignedAd & { url: string };

function Step4Ads({
  campaigns, sites, dict, selectedCampaignId, selectedZoneId, onRefresh,
}: {
  campaigns: import("@/lib/api").Campaign[];
  sites: Site[];
  dict: Dict;
  selectedCampaignId: number | null;
  selectedZoneId: number | null;
  onRefresh: () => void;
}) {
  const [campaignId, setCampaignId] = useState(selectedCampaignId ?? 0);
  const [zoneId, setZoneId] = useState(selectedZoneId ?? 0);
  const [name, setName] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [formatId, setFormatId] = useState(Object.keys(dict.ad_formats)[0] ?? "2");
  const [sizeId, setSizeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<"file" | "vast">("file");
  const [vastUrl, setVastUrl] = useState("");
  const [allowSkip, setAllowSkip] = useState(false);
  const [skipOffset, setSkipOffset] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Ads list (from zone's assigned_ads)
  const [ads, setAds] = useState<AdItem[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);

  // Edit ad modal
  const [editTarget, setEditTarget] = useState<AdItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete ad modal
  const [deleteTarget, setDeleteTarget] = useState<AdItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatName = dict.ad_formats[formatId] ?? "";
  const fcat = formatCategory(formatName);
  const needsSize = fcat === "banner_image" || fcat === "banner_video";
  const needsFile = fcat === "banner_image" || (fcat === "banner_video" && videoSourceType === "file") || fcat === "vast";

  const allZones = sites.flatMap((s) =>
    s.zones.map((z) => ({ id: z.id, name: `${s.name} / ${z.name}` }))
  );

  // Load ads from selected zone's assigned_ads
  async function loadAds(zid: number) {
    if (!zid) { setAds([]); return; }
    setAdsLoading(true);
    try {
      const zone = await fetchZone(zid);
      setAds((zone.assigned_ads ?? []).map((a) => ({ ...a, url: a.url ?? "" })));
    } catch {
      setAds([]);
    } finally {
      setAdsLoading(false);
    }
  }

  useEffect(() => { loadAds(zoneId); }, [zoneId]);

  function resetFormat(newId: string) {
    setFormatId(newId);
    setSizeId(""); setFile(null); setVastUrl(""); setVideoSourceType("file");
  }

  function openEditAd(ad: AdItem) {
    setEditTarget(ad);
    setEditName(ad.name);
    setEditUrl(ad.url);
    setEditActive(ad.is_active);
    setEditError(null);
  }

  async function handleCreate() {
    if (!campaignId || !name || !clickUrl || !formatId) {
      return setFeedback({ type: "err", msg: "Preencha todos os campos obrigatórios." });
    }
    if (needsSize && !sizeId) return setFeedback({ type: "err", msg: "Selecione o tamanho." });
    if (needsFile && !file) return setFeedback({ type: "err", msg: "Selecione o arquivo do criativo." });
    if (fcat === "banner_video" && videoSourceType === "vast" && !vastUrl) {
      return setFeedback({ type: "err", msg: "Informe a VAST URL." });
    }

    setLoading(true); setFeedback(null);
    try {
      const normalizedUrl = /^https?:\/\//i.test(clickUrl) ? clickUrl : `https://${clickUrl}`;

      const details: AdDetails = {};
      if (needsSize && sizeId) details.idsize = Number(sizeId);
      if (fcat === "banner_video") {
        details.source_type = videoSourceType;
        if (videoSourceType === "vast") details.vast_url = vastUrl;
      }
      if (fcat === "vast") {
        details.allow_skip = allowSkip;
        if (skipOffset) details.skipoffset = Number(skipOffset);
      }

      const ad = await createAd(Number(formatId), {
        idcampaign: campaignId,
        name,
        url: normalizedUrl,
        is_active: true,
        details,
        fileObj: needsFile && file ? file : undefined,
      });

      let msg = `Anúncio "${ad.name}" criado (ID ${ad.id}).`;
      if (zoneId) {
        await assignAdToZones(ad.id, [zoneId]);
        msg += ` Atribuído à zona ${zoneId}.`;
      }
      setFeedback({ type: "ok", msg });
      setName(""); setClickUrl(""); setSizeId(""); setFile(null); setVastUrl("");
      loadAds(zoneId);
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar anúncio." });
    } finally {
      setLoading(false);
    }
  }

  async function handleEditAd() {
    if (!editTarget || !editName) return setEditError("Nome é obrigatório.");
    setEditLoading(true); setEditError(null);
    try {
      const normalizedUrl = editUrl && !/^https?:\/\//i.test(editUrl) ? `https://${editUrl}` : editUrl;
      await updateAd(editTarget.id, { name: editName, url: normalizedUrl, is_active: editActive });
      setEditTarget(null);
      loadAds(zoneId);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Erro ao editar.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteAd() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAd(deleteTarget.id);
      setDeleteTarget(null);
      loadAds(zoneId);
    } catch (e: unknown) {
      setDeleteTarget(null);
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao excluir." });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        {/* Create ad form */}
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-black">Novo anúncio</h3>
          <Field label="Campanha">
            <Select
              options={campaigns.map((c) => ({ id: c.id, name: `${c.name} (${c.pricemodel.name})` }))}
              value={campaignId || ""}
              onChange={(e) => setCampaignId(Number(e.target.value))}
            />
          </Field>
          <Field label="Nome do anúncio">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banner 300x250 - v1" />
          </Field>
          <Field label="URL de destino (clique)">
            <Input value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="https://exemplo.com/lp" />
          </Field>
          <Field label="Formato do anúncio">
            <Select options={dictOptions(dict.ad_formats)} value={formatId} onChange={(e) => resetFormat(e.target.value)} />
          </Field>

          {fcat === "banner_image" && (
            <>
              <Field label="Tamanho do banner">
                <Select options={dictOptions(dict.sizes)} value={sizeId} onChange={(e) => setSizeId(e.target.value)} />
              </Field>
              <Field label="Arquivo de imagem (JPG, PNG, GIF, ZIP)">
                <FileInput accept="image/*,.zip" file={file} onChange={setFile} />
              </Field>
            </>
          )}

          {fcat === "banner_video" && (
            <>
              <Field label="Tamanho do banner">
                <Select options={dictOptions(dict.sizes)} value={sizeId} onChange={(e) => setSizeId(e.target.value)} />
              </Field>
              <Field label="Fonte do vídeo">
                <select
                  value={videoSourceType}
                  onChange={(e) => setVideoSourceType(e.target.value as "file" | "vast")}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#153ece]/30 w-full"
                >
                  <option value="file">Arquivo de vídeo (MP4)</option>
                  <option value="vast">VAST URL</option>
                </select>
              </Field>
              {videoSourceType === "file" && (
                <Field label="Arquivo de vídeo (MP4)">
                  <FileInput accept="video/mp4,video/*" file={file} onChange={setFile} />
                </Field>
              )}
              {videoSourceType === "vast" && (
                <Field label="VAST URL">
                  <Input value={vastUrl} onChange={(e) => setVastUrl(e.target.value)} placeholder="https://..." />
                </Field>
              )}
            </>
          )}

          {fcat === "vast" && (
            <>
              <Field label="Arquivo de vídeo (MP4)">
                <FileInput accept="video/mp4,video/*" file={file} onChange={setFile} />
              </Field>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={allowSkip} onChange={(e) => setAllowSkip(e.target.checked)} className="rounded" />
                  Permitir skip
                </label>
                {allowSkip && (
                  <Field label="Skip offset (segundos)">
                    <Input type="number" value={skipOffset} onChange={(e) => setSkipOffset(e.target.value)} placeholder="5" />
                  </Field>
                )}
              </div>
            </>
          )}

          <Field label="Zona (selecione para ver criativos atribuídos)">
            <Select options={allZones} value={zoneId || ""} onChange={(e) => setZoneId(Number(e.target.value))} />
          </Field>
          {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
          <Btn loading={loading} onClick={handleCreate}>Criar anúncio</Btn>
        </div>

        {/* Ads list */}
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-black">Criativos na zona</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {zoneId > 0 ? "Anúncios atribuídos a esta zona" : "Selecione uma zona ao lado"}
              </p>
            </div>
            {zoneId > 0 && (
              <button
                onClick={() => loadAds(zoneId)}
                disabled={adsLoading}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
              >
                ↻ Atualizar
              </button>
            )}
          </div>

          {zoneId === 0 && (
            <p className="text-sm text-gray-400 py-2">Selecione uma zona no formulário ao lado para ver os criativos atribuídos.</p>
          )}

          {zoneId > 0 && adsLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <span className="animate-spin">↻</span> Carregando criativos…
            </div>
          )}

          {zoneId > 0 && !adsLoading && ads.length === 0 && (
            <p className="text-sm text-gray-400 py-2">Nenhum criativo atribuído a esta zona ainda.</p>
          )}

          {zoneId > 0 && !adsLoading && ads.length > 0 && (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-[#153ece]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ad.is_active ? "bg-green-400" : "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black leading-tight">{ad.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">ID {ad.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                      <IconBtn onClick={() => openEditAd(ad)} title="Editar anúncio"><PencilIcon /></IconBtn>
                      <IconBtn onClick={() => setDeleteTarget(ad)} title="Excluir anúncio" danger><TrashIcon /></IconBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {editTarget && (
        <EditModal title={`Editar: ${editTarget.name}`} onSave={handleEditAd} onCancel={() => setEditTarget(null)} loading={editLoading} error={editError}>
          <Field label="Nome">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="URL de destino">
            <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="rounded" />
            Ativo
          </label>
        </EditModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir anúncio"
          description={`Tem certeza que deseja excluir o anúncio "${deleteTarget.name}"?`}
          onConfirm={handleDeleteAd}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdServer() {
  const [step, setStep] = useState(1);
  const [slideOut, setSlideOut] = useState<"left" | "right" | null>(null);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sites, setSites] = useState<Site[]>([]);
  const [campaigns, setCampaigns] = useState<import("@/lib/api").Campaign[]>([]);
  const [dict, setDict] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const completedSteps = new Set<number>();
  if (selectedCampaignId) completedSteps.add(1);
  if (selectedSiteId)     completedSteps.add(2);
  if (selectedZoneId)     completedSteps.add(3);

  async function loadAll() {
    try {
      const [s, d, { fetchCampaigns }] = await Promise.all([
        fetchSites(),
        fetchDict(),
        import("@/lib/api"),
      ]);
      const c = await fetchCampaigns();
      setSites(s);
      setDict(d);
      setCampaigns(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function goToStep(next: number) {
    if (next === step) return;
    if (slideTimer.current) clearTimeout(slideTimer.current);
    const dir = next > step ? "left" : "right";
    setSlideOut(dir);
    slideTimer.current = setTimeout(() => {
      setStep(next);
      setSlideOut(null);
    }, 220);
  }

  const steps = [
    { n: 1, label: "Campanhas" },
    { n: 2, label: "Sites" },
    { n: 3, label: "Zonas & Tags" },
    { n: 4, label: "Anúncios" },
  ];

  const stepDescriptions: Record<number, string> = {
    1: "Uma campanha é o conjunto de anúncios relacionados a um objetivo. Crie ou selecione a campanha que receberá os anúncios.",
    2: "Um site é onde os anúncios serão exibidos. Crie ou selecione o site associado a esta campanha.",
    3: "Uma zona é uma área específica do site. Crie a zona e obtenha o código HTML (tag) para colar no publisher.",
    4: "Crie o anúncio (criativo) para a campanha e zona selecionadas. O formato do anúncio deve corresponder ao formato da zona.",
  };

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-6">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-10 py-7 mb-6">
          <h1 className="text-white text-[28px] font-medium mb-1">AdServer</h1>
          <p className="text-white/70 text-base">Gerencie sites, zonas, campanhas e anúncios</p>
        </div>

        {loading || !dict ? (
          <div className="bg-white rounded-[31px] p-12 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Carregando dados…</p>
          </div>
        ) : (
          <>
            {/* Step tabs */}
            <div className="flex gap-3 mb-6 flex-wrap">
              {steps.map((s) => (
                <StepTab
                  key={s.n}
                  step={s.n}
                  label={s.label}
                  active={step === s.n}
                  done={completedSteps.has(s.n)}
                  onClick={() => goToStep(s.n)}
                />
              ))}
            </div>

            {/* Step description */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mb-6">
              <p className="text-sm text-[#153ece] font-medium">
                Passo {step}: <span className="font-normal text-blue-800">{stepDescriptions[step]}</span>
              </p>
            </div>

            {/* Step content with slide animation */}
            <div
              style={{ transition: "transform 220ms ease, opacity 220ms ease" }}
              className={
                slideOut === "left"
                  ? "-translate-x-8 opacity-0 pointer-events-none"
                  : slideOut === "right"
                  ? "translate-x-8 opacity-0 pointer-events-none"
                  : "translate-x-0 opacity-100"
              }
            >
              {step === 1 && (
                <Step1Campaigns
                  campaigns={campaigns}
                  dict={dict}
                  onRefresh={loadAll}
                  onNext={(id) => { setSelectedCampaignId(id); goToStep(2); }}
                />
              )}
              {step === 2 && (
                <Step2Sites
                  sites={sites}
                  dict={dict}
                  onRefresh={loadAll}
                  onNext={(id) => { setSelectedSiteId(id); goToStep(3); }}
                />
              )}
              {step === 3 && (
                <Step3Zones
                  sites={sites}
                  dict={dict}
                  selectedSiteId={selectedSiteId}
                  onRefresh={loadAll}
                  onNext={(sId, zId) => { setSelectedSiteId(sId); setSelectedZoneId(zId); goToStep(4); }}
                />
              )}
              {step === 4 && (
                <Step4Ads
                  campaigns={campaigns}
                  sites={sites}
                  dict={dict}
                  selectedCampaignId={selectedCampaignId}
                  selectedZoneId={selectedZoneId}
                  onRefresh={loadAll}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
