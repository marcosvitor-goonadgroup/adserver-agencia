import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const COMPANY = "GO ON TECNOLOGIA E PARTICIPAÇÕES LTDA";
const CNPJ = "21.293.569/0001-62";
const EMAIL_DPO = "privacidade@goonadgroup.com.br";
const UPDATED_AT = "02/04/2026";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-4 sm:p-6">
      <div className="max-w-[800px] mx-auto">

        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-8 py-6 mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1 as unknown as string)}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-medium leading-tight">Política de Privacidade</h1>
            <p className="text-white/70 text-sm">Última atualização: {UPDATED_AT}</p>
          </div>
          <img src="/1-426.svg" alt="" aria-hidden className="h-9 brightness-0 invert opacity-60 pointer-events-none" />
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-[24px] px-8 py-8 flex flex-col gap-8 text-sm text-gray-700 leading-relaxed">

          <Section title="1. Quem somos">
            <p>
              Esta plataforma — <strong>AD Desk</strong> — é operada por{" "}
              <strong>{COMPANY}</strong>, inscrita no CNPJ <strong>{CNPJ}</strong>.
              O AD Desk é um painel interno de monitoramento de campanhas publicitárias digitais,
              destinado exclusivamente a colaboradores e parceiros autorizados da empresa.
            </p>
          </Section>

          <Section title="2. Quais dados coletamos e por quê">
            <p>Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
            <Table
              headers={["Dado", "Finalidade", "Base legal (LGPD)"]}
              rows={[
                ["E-mail e senha", "Autenticação do usuário", "Art. 7º, II – execução de contrato"],
                ["Nome e sobrenome", "Identificação e exibição no perfil", "Art. 7º, II – execução de contrato"],
                ["Cargo e área", "Personalização da interface", "Art. 7º, II – execução de contrato"],
                ["Empresa e CNPJ", "Filtrar campanhas da empresa do usuário", "Art. 7º, II – execução de contrato"],
                ["Cidade / UF", "Exibição no perfil", "Art. 7º, II – execução de contrato"],
                ["Foto de perfil", "Exibição no avatar do perfil", "Art. 7º, I – consentimento"],
                ["Token de sessão", "Manter o usuário autenticado por até 8 horas", "Art. 7º, II – execução de contrato"],
                ["Dados de campanhas (impressões, cliques, viewability)", "Relatórios de performance para os anunciantes", "Art. 7º, II – execução de contrato"],
                ["Dados geográficos agregados (país, estado)", "Mapa de distribuição geográfica das campanhas", "Art. 7º, II – execução de contrato"],
              ]}
            />
          </Section>

          <Section title="3. Como armazenamos seus dados">
            <p>
              O token de autenticação e o identificador de empresa são armazenados no <strong>localStorage</strong> do seu navegador,
              com validade máxima de <strong>8 horas</strong>. Após esse prazo, ou ao clicar em "Sair",
              todos os dados locais são removidos automaticamente.
            </p>
            <p className="mt-2">
              Nenhum dado pessoal é gravado em banco de dados próprio do AD Desk. As informações de perfil
              são recuperadas em tempo real da API <strong>api-prod-goon-app.up.railway.app</strong> e
              exibidas apenas durante a sessão ativa.
            </p>
          </Section>

          <Section title="4. Com quem compartilhamos seus dados">
            <p>Os dados trafegam entre as seguintes plataformas, todas sob controle da {COMPANY}:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li><strong>api-prod-goon-app.up.railway.app</strong> — autenticação e perfil do usuário</li>
              <li><strong>adserver-api.vercel.app</strong> — relatórios de campanhas publicitárias</li>
              <li><strong>Google BigQuery</strong> (go-on-adgroup.adserver) — dados consolidados de viewability e VAST</li>
              <li><strong>Google Sheets</strong> — planilha de controle de campanhas (agência, veículo, datas)</li>
            </ul>
            <p className="mt-2">
              Nenhum dado pessoal é vendido, alugado ou compartilhado com terceiros fora do grupo empresarial.
            </p>
          </Section>

          <Section title="5. Dados de campanhas e anunciantes">
            <p>
              Os dados de campanhas (impressões, cliques, viewability, distribuição geográfica) são de natureza
              <strong> comercial e agregada</strong>. Não identificam individualmente consumidores finais.
              Os dados geográficos exibidos no mapa representam regiões agregadas por estado, sem identificação pessoal.
            </p>
            <p className="mt-2">
              Os dados de anunciantes (nome e e-mail) são utilizados exclusivamente para identificação interna
              das campanhas no painel e não são exibidos publicamente.
            </p>
          </Section>

          <Section title="6. Seus direitos (LGPD – Lei nº 13.709/2018)">
            <p>Como titular de dados, você tem direito a:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li><strong>Confirmação e acesso</strong> — saber quais dados seus estamos tratando</li>
              <li><strong>Correção</strong> — solicitar a correção de dados incompletos ou inexatos</li>
              <li><strong>Anonimização ou eliminação</strong> — solicitar a exclusão de dados desnecessários</li>
              <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
              <li><strong>Revogação do consentimento</strong> — para dados tratados com base no consentimento (ex.: foto de perfil)</li>
              <li><strong>Oposição</strong> — se discordar de algum tratamento</li>
            </ul>
            <p className="mt-2">
              Para exercer qualquer desses direitos, entre em contato pelo e-mail:{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-[#153ece] underline">{EMAIL_DPO}</a>
            </p>
          </Section>

          <Section title="7. Segurança">
            <p>
              Adotamos as seguintes medidas técnicas para proteger seus dados:
            </p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Todas as comunicações com as APIs utilizam <strong>HTTPS/TLS</strong></li>
              <li>A sessão expira automaticamente após <strong>8 horas</strong> de inatividade</li>
              <li>Sem empresa identificada, nenhuma campanha é exibida — impedindo vazamento entre empresas</li>
              <li>O token é removido imediatamente ao clicar em "Sair"</li>
            </ul>
            <p className="mt-2 text-gray-500 text-xs">
              Nota: o token de sessão é armazenado no localStorage do navegador.
              Recomendamos não utilizar a plataforma em computadores compartilhados sem efetuar logout ao final.
            </p>
          </Section>

          <Section title="8. Retenção de dados">
            <p>
              Os dados de sessão (token, empresa) são retidos <strong>por no máximo 8 horas</strong> no navegador e
              removidos no logout. Dados de campanhas e perfil de usuário são retidos nos sistemas de origem
              (API da Go On) conforme a política de retenção desses sistemas.
            </p>
          </Section>

          <Section title="9. Cookies e armazenamento local">
            <p>
              Esta plataforma não utiliza cookies de rastreamento ou publicidade. O único dado armazenado
              localmente é a preferência de tema visual (<code className="bg-gray-100 px-1 rounded">claro/escuro</code>),
              que não contém informações pessoais.
            </p>
          </Section>

          <Section title="10. Alterações nesta política">
            <p>
              Esta política pode ser atualizada periodicamente. A data de última atualização está sempre
              indicada no topo desta página. Alterações significativas serão comunicadas aos usuários.
            </p>
          </Section>

          <Section title="11. Contato e Encarregado (DPO)">
            <p>
              Dúvidas, solicitações ou reclamações relacionadas à privacidade de dados devem ser
              encaminhadas para:
            </p>
            <div className="mt-2 flex flex-col gap-0.5">
              <span><strong>Empresa:</strong> {COMPANY}</span>
              <span><strong>CNPJ:</strong> {CNPJ}</span>
              <span>
                <strong>E-mail DPO:</strong>{" "}
                <a href={`mailto:${EMAIL_DPO}`} className="text-[#153ece] underline">{EMAIL_DPO}</a>
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Você também pode registrar reclamações perante a{" "}
              <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> pelo portal{" "}
              <strong>gov.br/anpd</strong>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-black font-semibold text-base mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#153ece]/8">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-black/70 border border-gray-200 bg-gray-50">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 border border-gray-200 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
