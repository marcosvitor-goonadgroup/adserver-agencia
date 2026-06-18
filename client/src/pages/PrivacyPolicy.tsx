import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const COMPANY = "GO ON TECNOLOGIA E PARTICIPAÇÕES LTDA";
const CNPJ = "21.293.569/0001-62";
const EMAIL_DPO = "privacidade@goonadgroup.com.br";
const UPDATED_AT = "07/04/2026";

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
              O token de autenticação e o identificador de empresa são armazenados no <strong>sessionStorage</strong> do seu navegador,
              com validade máxima de <strong>8 horas</strong>. O <strong>sessionStorage</strong> é apagado automaticamente
              ao fechar a aba/janela do navegador. Após o prazo de 8 horas, ou ao clicar em "Sair",
              todos os dados locais também são removidos imediatamente.
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
              <li><strong>api-adserver.crmaddesk.com</strong> — relatórios de campanhas publicitárias</li>
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
            <p className="mt-2">
              <strong>Opt-out de medição:</strong> a medição de impressões e viewability não utiliza cookies nem
              identificadores de usuário. Respeitamos os sinais de opt-out do navegador — <strong>Do Not Track (DNT)</strong> e{" "}
              <strong>Global Privacy Control (GPC)</strong>: quando ativados, nenhum dado de medição é registrado.
              O endereço IP é utilizado apenas transitoriamente para derivar a localização aproximada (país/estado/cidade)
              e não é armazenado. Você também pode solicitar oposição pelo e-mail{" "}
              <a href={`mailto:${EMAIL_DPO}`} className="text-[#153ece] underline">{EMAIL_DPO}</a>.
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
              Nota: o token de sessão é armazenado no sessionStorage do navegador.
              Recomendamos não utilizar a plataforma em computadores compartilhados sem efetuar logout ao final.
            </p>
          </Section>

          <Section title="8. Retenção de dados">
            <p>
              Os dados de sessão (token, empresa) são retidos <strong>por no máximo 8 horas</strong> no navegador e
              removidos no logout. Dados de campanhas e perfil de usuário são retidos nos sistemas de origem
              (API da Go On) conforme a política de retenção desses sistemas.
            </p>
            <p className="mt-2">
              Dados agregados de campanhas (impressões, cliques, viewability) armazenados no Google BigQuery
              são retidos por <strong>até 24 meses</strong> para fins de relatórios históricos, após o que são
              excluídos ou anonimizados permanentemente.
            </p>
          </Section>

          <Section title="9. Transferência internacional de dados">
            <p>
              Alguns dos nossos parceiros de tecnologia estão localizados fora do Brasil e da União Europeia.
              As transferências de dados para esses parceiros são realizadas com as seguintes salvaguardas:
            </p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>
                <strong>Google BigQuery / Google Sheets</strong> (EUA) — Google LLC é certificada sob as
                Standard Contractual Clauses (SCCs) da UE e segue o EU-U.S. Data Privacy Framework.
              </li>
              <li>
                <strong>Railway</strong> (EUA) — infraestrutura de autenticação sujeita aos termos de
                processamento de dados do Railway, com criptografia em trânsito e em repouso.
              </li>
              <li>
                <strong>Vercel</strong> (EUA) — hospedagem da API sujeita ao DPA (Data Processing Agreement)
                da Vercel, compatível com GDPR.
              </li>
            </ul>
            <p className="mt-2">
              Nenhuma transferência envolve dados pessoais de usuários finais de campanhas — apenas dados
              agregados e anonimizados de performance publicitária.
            </p>
          </Section>

          <Section title="10. Cookies e armazenamento local">
            <p>
              Esta plataforma não utiliza cookies de rastreamento ou publicidade. O único dado armazenado
              localmente é a preferência de tema visual (<code className="bg-gray-100 px-1 rounded">claro/escuro</code>),
              que não contém informações pessoais.
            </p>
          </Section>

          <Section title="11. Alterações nesta política">
            <p>
              Esta política pode ser atualizada periodicamente. A data de última atualização está sempre
              indicada no topo desta página. Alterações significativas serão comunicadas aos usuários.
            </p>
          </Section>

          {/* ── GDPR Section (Articles 13 & 14) ── */}
          <div className="border-t-2 border-[#153ece]/20 pt-6">
            <p className="text-xs font-semibold text-[#153ece] uppercase tracking-widest mb-4">
              Informações adicionais — Regulamento Geral de Proteção de Dados (GDPR)
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Esta seção aplica-se a titulares de dados localizados no Espaço Econômico Europeu (EEE),
              conforme exigido pelos Artigos 13 e 14 do GDPR (Regulamento UE 2016/679).
            </p>

            <Section title="12. Controlador de dados (GDPR Art. 13.1.a)">
              <div className="flex flex-col gap-0.5">
                <span><strong>Controlador:</strong> {COMPANY}</span>
                <span><strong>CNPJ:</strong> {CNPJ}</span>
                <span><strong>País:</strong> Brasil</span>
                <span>
                  <strong>Contato DPO:</strong>{" "}
                  <a href={`mailto:${EMAIL_DPO}`} className="text-[#153ece] underline">{EMAIL_DPO}</a>
                </span>
              </div>
            </Section>

            <Section title="13. Finalidade e base legal do tratamento (GDPR Art. 13.1.c / Art. 6)">
              <Table
                headers={["Dado", "Finalidade", "Base legal (GDPR Art. 6)"]}
                rows={[
                  ["E-mail e senha", "Autenticação do usuário", "Art. 6(1)(b) — execução de contrato"],
                  ["Nome, cargo, empresa", "Identificação e personalização da interface", "Art. 6(1)(b) — execução de contrato"],
                  ["Foto de perfil", "Exibição no avatar", "Art. 6(1)(a) — consentimento"],
                  ["Token de sessão (sessionStorage)", "Manter sessão autenticada por 8 horas", "Art. 6(1)(b) — execução de contrato"],
                  ["Dados geográficos agregados (país, estado)", "Relatórios de distribuição geográfica de campanhas", "Art. 6(1)(f) — interesse legítimo"],
                  ["Dados de performance (impressões, cliques)", "Relatórios de performance publicitária", "Art. 6(1)(b) — execução de contrato"],
                ]}
              />
              <p className="mt-2 text-xs text-gray-500">
                <strong>Interesse legítimo (Art. 6.1.f):</strong> os dados geográficos agregados são necessários
                para a prestação do serviço de relatórios contratado pelos anunciantes. Estes dados não identificam
                individualmente nenhum usuário final.
              </p>
            </Section>

            <Section title="14. Destinatários dos dados (GDPR Art. 13.1.e)">
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li><strong>Railway (EUA)</strong> — autenticação e perfil de usuário</li>
                <li><strong>Vercel (EUA)</strong> — hospedagem da API</li>
                <li><strong>Google BigQuery / Google Sheets (EUA)</strong> — dados agregados de campanhas</li>
              </ul>
              <p className="mt-2">
                Nenhum dado é compartilhado com terceiros para fins de marketing, publicidade comportamental
                ou venda de dados.
              </p>
            </Section>

            <Section title="15. Transferências para países terceiros (GDPR Art. 13.1.f)">
              <p>
                Os dados são transferidos para os Estados Unidos da América. As transferências são realizadas
                com base nas seguintes salvaguardas adequadas (GDPR Art. 46):
              </p>
              <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
                <li><strong>Google:</strong> Standard Contractual Clauses (SCCs) + EU-U.S. Data Privacy Framework</li>
                <li><strong>Vercel:</strong> Data Processing Agreement (DPA) com SCCs</li>
                <li><strong>Railway:</strong> Data Processing Agreement (DPA) com criptografia em trânsito e repouso</li>
              </ul>
            </Section>

            <Section title="16. Prazo de retenção (GDPR Art. 13.2.a)">
              <Table
                headers={["Dado", "Prazo de retenção"]}
                rows={[
                  ["Token de sessão (sessionStorage)", "8 horas ou até logout"],
                  ["Perfil de usuário (Railway API)", "Enquanto a conta estiver ativa"],
                  ["Dados agregados de campanhas (BigQuery)", "Até 24 meses"],
                  ["Preferência de tema (sessionStorage)", "Indefinido — não contém dados pessoais"],
                ]}
              />
            </Section>

            <Section title="17. Decisões automatizadas e profiling (GDPR Art. 13.2.f)">
              <p>
                Esta plataforma <strong>não realiza decisões automatizadas</strong> nem criação de perfis
                comportamentais (<em>profiling</em>) de usuários finais conforme definido no Art. 22 do GDPR.
                O targeting de anúncios é exclusivamente contextual (zona, site, campanha e data),
                sem análise de histórico de navegação ou preferências individuais.
              </p>
            </Section>

            <Section title="18. Direitos dos titulares sob o GDPR (Art. 13.2.b / Art. 15–21)">
              <p>Titulares de dados no EEE têm direito a:</p>
              <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
                <li><strong>Acesso (Art. 15)</strong> — obter cópia dos dados pessoais tratados</li>
                <li><strong>Retificação (Art. 16)</strong> — corrigir dados inexatos ou incompletos</li>
                <li><strong>Apagamento / "Direito ao esquecimento" (Art. 17)</strong> — solicitar exclusão dos dados</li>
                <li><strong>Limitação do tratamento (Art. 18)</strong> — restringir o uso dos dados em determinadas circunstâncias</li>
                <li><strong>Portabilidade (Art. 20)</strong> — receber os dados em formato estruturado e legível por máquina</li>
                <li><strong>Oposição (Art. 21)</strong> — opor-se ao tratamento baseado em interesse legítimo</li>
                <li><strong>Revogação do consentimento (Art. 7.3)</strong> — retirar o consentimento a qualquer momento, sem prejuízo da licitude do tratamento anterior</li>
              </ul>
              <p className="mt-2">
                Para exercer qualquer desses direitos, entre em contato:{" "}
                <a href={`mailto:${EMAIL_DPO}`} className="text-[#153ece] underline">{EMAIL_DPO}</a>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Responderemos no prazo máximo de <strong>30 dias</strong> (prorrogável por mais 60 dias
                em casos complexos, com aviso prévio), conforme Art. 12.3 do GDPR.
              </p>
            </Section>

            <Section title="19. Direito de reclamação à autoridade supervisora (GDPR Art. 13.2.d)">
              <p>
                Titulares de dados no EEE têm o direito de apresentar reclamação à autoridade supervisora
                de proteção de dados competente no seu país de residência. Lista de autoridades:
              </p>
              <p className="mt-2">
                <a
                  href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#153ece] underline"
                >
                  edpb.europa.eu — Lista de autoridades supervisoras do EEE
                </a>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                No Brasil, reclamações podem ser registradas perante a{" "}
                <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> em{" "}
                <strong>gov.br/anpd</strong>.
              </p>
            </Section>
          </div>

          <Section title="20. Contato e Encarregado (DPO)">
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
