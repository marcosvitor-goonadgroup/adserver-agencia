import { useEffect, useState } from "react";
import {
  fetchSites, fetchDict, createSite, createZone, fetchZoneTag,
  createCampaign, createAd, assignAdToZones,
  type Site, type Dict, type AdDetails, type ZoneTagType,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function dictOptions(map: Record<string, string>) {
  return Object.entries(map).map(([id, name]) => ({ id: Number(id), name }));
}

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
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

function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded-lg"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
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

// ── Step 1: Campaigns ──────────────────────────────────────────────────────────

function Step1Campaigns({
  campaigns, dict, onNext,
}: {
  campaigns: import("@/lib/api").Campaign[];
  dict: Dict;
  onNext: (campaignId: number) => void;
}) {
  const [name, setName] = useState("");
  const [priceModel, setPriceModel] = useState("1");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

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
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar campanha." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-black">Nova campanha</h3>
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Campanha Janeiro" />
        </Field>
        <Field label="Modelo de preço">
          <Select
            options={dictOptions(dict.price_models)}
            value={priceModel}
            onChange={(e) => setPriceModel(e.target.value)}
          />
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
              <div>
                <p className="text-sm font-medium text-black">{c.name}</p>
                <p className="text-xs text-gray-400">ID {c.id} · {c.pricemodel.name} · {c.runstatus.name}</p>
              </div>
              <button
                onClick={() => onNext(c.id)}
                className="text-[#153ece] text-xs font-medium hover:underline shrink-0"
              >
                Selecionar →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
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

  async function handleCreate() {
    if (!name || !url) return setFeedback({ type: "err", msg: "Nome e URL são obrigatórios." });
    setLoading(true);
    setFeedback(null);
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

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-black">Novo site</h3>
        <Field label="Nome do site">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Meu Site" />
        </Field>
        <Field label="URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemplo.com" />
        </Field>
        <Field label="Categoria">
          <Select
            options={dictOptions(dict.categories)}
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
          />
        </Field>
        {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
        <Btn loading={loading} onClick={handleCreate}>Criar site</Btn>
      </div>

      {/* List */}
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-black">Sites existentes</h3>
        {sites.length === 0 && <p className="text-gray-400 text-sm">Nenhum site encontrado.</p>}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px]">
          {sites.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2 hover:border-[#153ece]/30"
            >
              <div>
                <p className="text-sm font-medium text-black">{s.name}</p>
                <p className="text-xs text-gray-400">{s.url} · {s.zones.length} zona(s)</p>
              </div>
              <button
                onClick={() => onNext(s.id)}
                className="text-[#153ece] text-xs font-medium hover:underline shrink-0"
              >
                Selecionar →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Zones ──────────────────────────────────────────────────────────────

function Step3Zones({
  sites, dict, selectedSiteId, onNext,
}: {
  sites: Site[];
  dict: Dict;
  selectedSiteId: number | null;
  onNext: (siteId: number, zoneId: number) => void;
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
    setLoading(true); setFeedback(null); setTag(null);
    try {
      const zone = await createZone(siteId, Number(formatId), {
        name,
        is_active: true,
        ...(sizeId ? { idsize: Number(sizeId) } : {}),
      });
      setFeedback({ type: "ok", msg: `Zona "${zone.name}" criada (ID ${zone.id}).` });
      setName(""); setFormatId(""); setSizeId("");
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar zona." });
    } finally {
      setLoading(false);
    }
  }

  async function handleTag(zoneId: number, type?: ZoneTagType) {
    const t = type ?? tagType;
    setTagLoading(true); setTag(null); setTagZoneId(zoneId);
    try {
      const code = await fetchZoneTag(zoneId, t);
      setTag(code);
    } catch {
      setTag("Erro ao buscar tag.");
    } finally {
      setTagLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-black">Nova zona</h3>
          <Field label="Site">
            <Select
              options={sites.map((s) => ({ id: s.id, name: s.name }))}
              value={siteId || ""}
              onChange={(e) => setSiteId(Number(e.target.value))}
            />
          </Field>
          <Field label="Nome da zona">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banner 300x250" />
          </Field>
          <Field label="Formato da zona">
            <Select
              options={dictOptions(dict.zone_formats)}
              value={formatId}
              onChange={(e) => { setFormatId(e.target.value); setSizeId(""); }}
            />
          </Field>
          {formatId === "6" && (
            <Field label="Tamanho do banner">
              <Select
                options={dictOptions(dict.sizes)}
                value={sizeId}
                onChange={(e) => setSizeId(e.target.value)}
              />
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
                <div>
                  <p className="text-sm font-medium text-black">{z.name}</p>
                  <p className="text-xs text-gray-400">ID {z.id} · {z.format.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTag(z.id)}
                    disabled={tagLoading}
                    className="text-[#153ece] text-xs font-medium hover:underline"
                  >
                    {tagLoading ? "…" : "Tag"}
                  </button>
                  <button
                    onClick={() => onNext(site.id, z.id)}
                    className="text-green-600 text-xs font-medium hover:underline"
                  >
                    Selecionar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tag && tagZoneId && (
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-base font-semibold text-black">
              Tag — Zona {tagZoneId}
            </h3>
            {/* Tag type tabs */}
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
          <CodeBox code={tag} />
        </div>
      )}
    </div>
  );
}

// ── Step 4: Ads ────────────────────────────────────────────────────────────────

// Detect format category by name (case-insensitive)
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

function Step4Ads({
  campaigns, sites, dict, selectedCampaignId, selectedZoneId,
}: {
  campaigns: import("@/lib/api").Campaign[];
  sites: Site[];
  dict: Dict;
  selectedCampaignId: number | null;
  selectedZoneId: number | null;
}) {
  const [campaignId, setCampaignId] = useState(selectedCampaignId ?? 0);
  const [zoneId, setZoneId] = useState(selectedZoneId ?? 0);
  const [name, setName] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [formatId, setFormatId] = useState(Object.keys(dict.ad_formats)[0] ?? "2");
  const [sizeId, setSizeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  // Banner Video extra fields
  const [videoSourceType, setVideoSourceType] = useState<"file" | "vast">("file");
  const [vastUrl, setVastUrl] = useState("");
  // VAST Linear extra fields
  const [allowSkip, setAllowSkip] = useState(false);
  const [skipOffset, setSkipOffset] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const formatName = dict.ad_formats[formatId] ?? "";
  const fcat = formatCategory(formatName);
  const needsSize = fcat === "banner_image" || fcat === "banner_video";
  const needsFile = fcat === "banner_image" || (fcat === "banner_video" && videoSourceType === "file") || fcat === "vast";

  const allZones = sites.flatMap((s) =>
    s.zones.map((z) => ({ id: z.id, name: `${s.name} / ${z.name}` }))
  );

  function resetFormat(newId: string) {
    setFormatId(newId);
    setSizeId(""); setFile(null); setVastUrl(""); setVideoSourceType("file");
  }

  async function handleCreate() {
    if (!campaignId || !name || !clickUrl || !formatId) {
      return setFeedback({ type: "err", msg: "Preencha todos os campos obrigatórios." });
    }
    if (needsSize && !sizeId) {
      return setFeedback({ type: "err", msg: "Selecione o tamanho." });
    }
    if (needsFile && !file) {
      return setFeedback({ type: "err", msg: "Selecione o arquivo do criativo." });
    }
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
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "Erro ao criar anúncio." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4 max-w-xl">
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
        <Select
          options={dictOptions(dict.ad_formats)}
          value={formatId}
          onChange={(e) => resetFormat(e.target.value)}
        />
      </Field>

      {/* Banner Image / ZIP / Native — tamanho + arquivo */}
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

      {/* Banner Video — tamanho + fonte (arquivo ou VAST URL) */}
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

      {/* VAST Linear (in-stream) — arquivo + opções de skip */}
      {fcat === "vast" && (
        <>
          <Field label="Arquivo de vídeo (MP4)">
            <FileInput accept="video/mp4,video/*" file={file} onChange={setFile} />
          </Field>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSkip}
                onChange={(e) => setAllowSkip(e.target.checked)}
                className="rounded"
              />
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

      <Field label="Atribuir à zona (opcional)">
        <Select
          options={allZones}
          value={zoneId || ""}
          onChange={(e) => setZoneId(Number(e.target.value))}
        />
      </Field>
      {feedback && <Alert type={feedback.type} msg={feedback.msg} />}
      <Btn loading={loading} onClick={handleCreate}>Criar anúncio</Btn>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdServer() {
  const [step, setStep] = useState(1);
  const [sites, setSites] = useState<Site[]>([]);
  const [campaigns, setCampaigns] = useState<import("@/lib/api").Campaign[]>([]);
  const [dict, setDict] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(true);

  // Context carried between steps
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
                  onClick={() => setStep(s.n)}
                />
              ))}
            </div>

            {/* Step description */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 mb-6">
              <p className="text-sm text-[#153ece] font-medium">
                Passo {step}: <span className="font-normal text-blue-800">{stepDescriptions[step]}</span>
              </p>
            </div>

            {/* Step content */}
            {step === 1 && (
              <Step1Campaigns
                campaigns={campaigns}
                dict={dict}
                onNext={(id) => { setSelectedCampaignId(id); setStep(2); }}
              />
            )}
            {step === 2 && (
              <Step2Sites
                sites={sites}
                dict={dict}
                onRefresh={loadAll}
                onNext={(id) => { setSelectedSiteId(id); setStep(3); }}
              />
            )}
            {step === 3 && (
              <Step3Zones
                sites={sites}
                dict={dict}
                selectedSiteId={selectedSiteId}
                onNext={(sId, zId) => { setSelectedSiteId(sId); setSelectedZoneId(zId); setStep(4); }}
              />
            )}
            {step === 4 && (
              <Step4Ads
                campaigns={campaigns}
                sites={sites}
                dict={dict}
                selectedCampaignId={selectedCampaignId}
                selectedZoneId={selectedZoneId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
