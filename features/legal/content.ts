import type { AppLocale } from "@/i18n/config";
import { LEGAL_ENTITY as E } from "@/lib/legal";

// DRAFT legal text. Must be reviewed by a qualified lawyer before launch. Placeholders are in [brackets].

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  intro?: string;
  sections: LegalSection[];
}

export type LegalKind = "privacy" | "terms" | "dpa";

const privacy: Record<AppLocale, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    intro:
      "This policy explains how RightSchedule handles personal data of business owners who use the service and visitors of our website. If you booked an appointment with a business, see that business's privacy notice on its booking page instead.",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `${E.name} (\"RightSchedule\", \"we\"), ${E.address}, tax ID ${E.taxId}, is the controller of the data described in this policy. Contact: ${E.privacyEmail}.`,
        ],
      },
      {
        heading: "2. Our two roles",
        paragraphs: [
          "For your account data (email, password, business profile) we are the controller.",
          "For the data of your own customers (names, phones, emails, notes, bookings, quote requests) each business is the controller and RightSchedule is the processor. That processing is governed by our Data Processing Agreement.",
        ],
      },
      {
        heading: "3. Data we collect and why",
        bullets: [
          "Account data: email, password hash, date and version of the Terms you accepted. Purpose: create and run your account. Basis: contract (Art. 6(1)(b) GDPR).",
          "Business data you enter: business profile, staff, services, working hours. Purpose: provide the booking service. Basis: contract.",
          "Technical data: IP address, request identifiers and security logs. Purpose: security, abuse and rate-limit protection. Basis: legitimate interest (Art. 6(1)(f)).",
          "Service emails (booking notifications, reminders): necessary to provide the service. We send no marketing emails without a separate opt-in.",
        ],
      },
      {
        heading: "4. Cookies",
        paragraphs: [
          "We use only strictly necessary cookies: a session cookie that keeps you signed in and a language preference cookie. We use no analytics or advertising trackers, so no cookie banner is required. If that changes, we will ask for your consent first.",
        ],
      },
      {
        heading: "5. Who receives data",
        paragraphs: [
          "Only our sub-processors (hosting, database and email delivery), listed on the sub-processors page, and authorities when legally required. We do not sell personal data.",
        ],
      },
      {
        heading: "6. International transfers",
        paragraphs: [
          "We host data in the EU/EEA where possible. Where a provider transfers data outside the EEA, we rely on the EU-US Data Privacy Framework or Standard Contractual Clauses.",
        ],
      },
      {
        heading: "7. How long we keep data",
        bullets: [
          "Account and business data: while your account is active; deleted when you delete your account.",
          "Bookings: anonymized 24 months after the appointment. Quote requests: deleted 12 months after receipt.",
          "Security logs: kept for a short period (up to 30 days) and then deleted.",
          "Backups: deleted data ages out of backups within [backup retention period].",
        ],
      },
      {
        heading: "8. Your rights",
        paragraphs: [
          "You can access, correct, export and erase your data, and object to or restrict processing. Use Settings > Privacy in the app to export or delete your account, or write to us. You may lodge a complaint with the Portuguese data protection authority, CNPD (www.cnpd.pt), or your local authority.",
        ],
      },
      {
        heading: "9. Security",
        paragraphs: [
          "We use encryption in transit, hashed passwords, HttpOnly session cookies, per-business data separation and rate limiting. No system is perfectly secure; we will notify affected parties of breaches as the law requires.",
        ],
      },
      {
        heading: "10. Changes",
        paragraphs: ["We will post changes here and notify account owners of material changes."],
      },
    ],
  },
  pt: {
    title: "Política de Privacidade",
    intro:
      "Esta política explica como o RightSchedule trata dados pessoais dos proprietários de negócios que usam o serviço e dos visitantes do nosso site. Se marcou um serviço num negócio, consulte o aviso de privacidade desse negócio na respetiva página de marcação.",
    sections: [
      {
        heading: "1. Quem somos",
        paragraphs: [
          `${E.name} (\"RightSchedule\", \"nós\"), ${E.address}, NIF ${E.taxId}, é o responsável pelo tratamento dos dados descritos nesta política. Contacto: ${E.privacyEmail}.`,
        ],
      },
      {
        heading: "2. Os nossos dois papéis",
        paragraphs: [
          "Relativamente aos dados da sua conta (email, palavra-passe, perfil do negócio), somos o responsável pelo tratamento.",
          "Relativamente aos dados dos seus clientes (nomes, telefones, emails, notas, marcações, pedidos de orçamento), cada negócio é o responsável pelo tratamento e o RightSchedule é o subcontratante. Esse tratamento rege-se pelo nosso Acordo de Tratamento de Dados.",
        ],
      },
      {
        heading: "3. Dados que recolhemos e porquê",
        bullets: [
          "Dados da conta: email, hash da palavra-passe, data e versão dos Termos aceites. Finalidade: criar e gerir a sua conta. Fundamento: execução de contrato (art. 6.º, n.º 1, al. b) RGPD).",
          "Dados do negócio que introduz: perfil, equipa, serviços, horários. Finalidade: prestar o serviço de marcações. Fundamento: execução de contrato.",
          "Dados técnicos: endereço IP, identificadores de pedido e registos de segurança. Finalidade: segurança, prevenção de abuso e limitação de pedidos. Fundamento: interesse legítimo (art. 6.º, n.º 1, al. f)).",
          "Emails de serviço (notificações e lembretes de marcações): necessários para prestar o serviço. Não enviamos emails de marketing sem consentimento autónomo.",
        ],
      },
      {
        heading: "4. Cookies",
        paragraphs: [
          "Usamos apenas cookies estritamente necessários: um cookie de sessão que mantém a sessão iniciada e um cookie de preferência de idioma. Não usamos analítica nem rastreadores publicitários, pelo que não é necessário banner de cookies. Se isso mudar, pediremos primeiro o seu consentimento.",
        ],
      },
      {
        heading: "5. Quem recebe os dados",
        paragraphs: [
          "Apenas os nossos subcontratantes (alojamento, base de dados e envio de email), indicados na página de subcontratantes, e autoridades quando legalmente exigido. Não vendemos dados pessoais.",
        ],
      },
      {
        heading: "6. Transferências internacionais",
        paragraphs: [
          "Alojamos dados na UE/EEE sempre que possível. Quando um fornecedor transfere dados para fora do EEE, recorremos ao Quadro de Privacidade de Dados UE-EUA ou a Cláusulas Contratuais-Tipo.",
        ],
      },
      {
        heading: "7. Durante quanto tempo guardamos os dados",
        bullets: [
          "Dados da conta e do negócio: enquanto a conta estiver ativa; eliminados quando eliminar a conta.",
          "Marcações: anonimizadas 24 meses após a data do serviço. Pedidos de orçamento: eliminados 12 meses após a receção.",
          "Registos de segurança: guardados por um período curto (até 30 dias) e depois eliminados.",
          "Cópias de segurança: os dados eliminados desaparecem das cópias em [período de retenção das cópias].",
        ],
      },
      {
        heading: "8. Os seus direitos",
        paragraphs: [
          "Pode aceder, retificar, exportar e apagar os seus dados, bem como opor-se ao tratamento ou limitá-lo. Use Definições > Privacidade na aplicação para exportar ou eliminar a conta, ou escreva-nos. Pode apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD, www.cnpd.pt) ou à autoridade do seu país.",
        ],
      },
      {
        heading: "9. Segurança",
        paragraphs: [
          "Usamos cifragem em trânsito, palavras-passe com hash, cookies de sessão HttpOnly, separação de dados por negócio e limitação de pedidos. Nenhum sistema é totalmente seguro; notificaremos as partes afetadas em caso de violação, conforme a lei.",
        ],
      },
      {
        heading: "10. Alterações",
        paragraphs: ["Publicaremos as alterações aqui e notificaremos os proprietários de conta das alterações materiais."],
      },
    ],
  },
};

const terms: Record<AppLocale, LegalDoc> = {
  en: {
    title: "Terms of Service",
    intro: `These terms govern your use of RightSchedule, provided by ${E.name} ("RightSchedule", "we").`,
    sections: [
      {
        heading: "1. Who may use the service",
        paragraphs: [
          "RightSchedule is a business-to-business service. You must be at least 18 years old and use it on behalf of a business or as a professional. It is not intended for consumers or for minors.",
        ],
      },
      {
        heading: "2. Your account",
        paragraphs: [
          "Keep your credentials confidential and tell us promptly of any unauthorized access. You are responsible for activity under your account. You confirm that you accepted these terms; we record the date and version of your acceptance.",
        ],
      },
      {
        heading: "3. Acceptable use",
        bullets: [
          "Do not use the service for unlawful purposes, spam or to harass others.",
          "Do not attempt to disrupt, probe or bypass the security of the service.",
          "Do not enter health data or other special categories of personal data (Art. 9 GDPR), such as medical conditions, diagnoses or treatments, in free-text fields (for example booking notes). The service is not designed to protect that data.",
        ],
      },
      {
        heading: "4. Your customers' data",
        paragraphs: [
          "You are the controller of your customers' personal data and we are your processor under the Data Processing Agreement, which forms part of these terms. You are responsible for having a lawful basis, for informing your customers (each booking page links to a privacy notice you may use) and for answering their requests. Our tools let you export and erase a customer's data.",
        ],
      },
      {
        heading: "5. Emails",
        paragraphs: [
          "The service sends transactional emails such as booking confirmations and reminders. You must not use it to send marketing messages without the recipient's prior consent.",
        ],
      },
      {
        heading: "6. Availability and changes",
        paragraphs: [
          "We work to keep the service available but do not guarantee uninterrupted operation. We may update the service and these terms; we will notify you of material changes.",
        ],
      },
      {
        heading: "7. Liability",
        paragraphs: ["[Liability cap, exclusions and warranty disclaimer to be defined by counsel.]"],
      },
      {
        heading: "8. Termination and your data",
        paragraphs: [
          "You can export your data and delete your account at any time in Settings > Privacy. On deletion we permanently erase your business data, subject to legal retention duties and backup rotation described in the Privacy Policy. We may suspend accounts that breach these terms.",
        ],
      },
      {
        heading: "9. Governing law and complaints",
        paragraphs: [
          "Portuguese law applies. [Competent courts and any consumer-complaints information, including the Livro de Reclamações requirements, to be confirmed by counsel.]",
        ],
      },
      { heading: "10. Contact", paragraphs: [`${E.supportEmail}`] },
    ],
  },
  pt: {
    title: "Termos de Serviço",
    intro: `Estes termos regem a utilização do RightSchedule, prestado por ${E.name} ("RightSchedule", "nós").`,
    sections: [
      {
        heading: "1. Quem pode usar o serviço",
        paragraphs: [
          "O RightSchedule é um serviço entre empresas. Tem de ter pelo menos 18 anos e usá-lo em nome de um negócio ou a título profissional. Não se destina a consumidores nem a menores.",
        ],
      },
      {
        heading: "2. A sua conta",
        paragraphs: [
          "Mantenha as credenciais confidenciais e informe-nos de imediato de qualquer acesso não autorizado. É responsável pela atividade na sua conta. Confirma que aceitou estes termos; registamos a data e a versão da aceitação.",
        ],
      },
      {
        heading: "3. Utilização aceitável",
        bullets: [
          "Não use o serviço para fins ilícitos, spam ou assédio.",
          "Não tente perturbar, sondar ou contornar a segurança do serviço.",
          "Não introduza dados de saúde nem outras categorias especiais de dados pessoais (art. 9.º RGPD), como condições médicas, diagnósticos ou tratamentos, em campos de texto livre (por exemplo, notas de marcação). O serviço não foi concebido para proteger esses dados.",
        ],
      },
      {
        heading: "4. Dados dos seus clientes",
        paragraphs: [
          "É o responsável pelo tratamento dos dados pessoais dos seus clientes e nós somos o seu subcontratante ao abrigo do Acordo de Tratamento de Dados, que faz parte destes termos. É responsável por ter fundamento de licitude, por informar os seus clientes (cada página de marcação tem uma ligação para um aviso de privacidade que pode usar) e por responder aos pedidos deles. As nossas ferramentas permitem exportar e apagar os dados de um cliente.",
        ],
      },
      {
        heading: "5. Emails",
        paragraphs: [
          "O serviço envia emails transacionais, como confirmações e lembretes de marcações. Não pode usá-lo para enviar mensagens de marketing sem consentimento prévio do destinatário.",
        ],
      },
      {
        heading: "6. Disponibilidade e alterações",
        paragraphs: [
          "Esforçamo-nos por manter o serviço disponível, mas não garantimos funcionamento ininterrupto. Podemos atualizar o serviço e estes termos; notificá-lo-emos das alterações materiais.",
        ],
      },
      {
        heading: "7. Responsabilidade",
        paragraphs: ["[Limite de responsabilidade, exclusões e isenção de garantias a definir por advogado.]"],
      },
      {
        heading: "8. Cessação e os seus dados",
        paragraphs: [
          "Pode exportar os dados e eliminar a conta a qualquer momento em Definições > Privacidade. Ao eliminar, apagamos definitivamente os dados do seu negócio, sem prejuízo de deveres legais de conservação e da rotação de cópias descrita na Política de Privacidade. Podemos suspender contas que violem estes termos.",
        ],
      },
      {
        heading: "9. Lei aplicável e reclamações",
        paragraphs: [
          "Aplica-se a lei portuguesa. [Tribunais competentes e informação sobre reclamações, incluindo requisitos do Livro de Reclamações, a confirmar por advogado.]",
        ],
      },
      { heading: "10. Contacto", paragraphs: [`${E.supportEmail}`] },
    ],
  },
};

const dpa: Record<AppLocale, LegalDoc> = {
  en: {
    title: "Data Processing Agreement",
    intro: `This agreement (Art. 28 GDPR) is between the business using RightSchedule ("Controller") and ${E.name} ("Processor") and applies to personal data of the Controller's customers processed through the service. It forms part of the Terms of Service.`,
    sections: [
      {
        heading: "1. Subject matter, duration and nature",
        paragraphs: [
          "The Processor hosts and processes customer, booking and quote-request data on the Controller's behalf to provide online scheduling, for as long as the Controller has an account.",
        ],
      },
      {
        heading: "2. Data and data subjects",
        bullets: [
          "Data subjects: the Controller's customers and prospects.",
          "Data: name, phone, email, booking details, free-text notes and quote-request descriptions.",
          "Special categories (Art. 9) must not be entered, as set out in the Terms.",
        ],
      },
      {
        heading: "3. Processor obligations",
        bullets: [
          "Process data only on the Controller's documented instructions (the Terms and the Controller's use of the service), and tell the Controller if an instruction appears to breach the law.",
          "Ensure that authorized personnel are bound by confidentiality.",
          "Apply appropriate technical and organizational measures (Art. 32): encryption in transit, hashed credentials, HttpOnly session cookies, per-business data separation, access control, rate limiting and logging without personal data.",
          "Assist the Controller with data subject requests: customer records can be exported and erased in the application.",
          "Assist the Controller with security, breach notification, impact assessments and consultations, taking into account the nature of processing.",
          "Notify the Controller without undue delay, and within 48 hours where feasible, after becoming aware of a personal data breach.",
          "At the end of the service, delete the data (or return it via export) unless the law requires storage.",
          "Make available the information needed to demonstrate compliance and allow reasonable audits with prior notice.",
        ],
      },
      {
        heading: "4. Sub-processors",
        paragraphs: [
          "The Controller gives general authorization to use the sub-processors listed on the sub-processors page. The Processor will inform the Controller of intended changes so it may object, and will impose equivalent data protection obligations on each sub-processor.",
        ],
      },
      {
        heading: "5. International transfers",
        paragraphs: [
          "Transfers outside the EEA occur only with a valid mechanism (adequacy decision, EU-US Data Privacy Framework or Standard Contractual Clauses).",
        ],
      },
      {
        heading: "6. Retention",
        paragraphs: [
          "Unless the Controller deletes data earlier, bookings are anonymized 24 months after the appointment and quote requests are deleted 12 months after receipt. Deleted data is removed from backups within [backup retention period].",
        ],
      },
      {
        heading: "7. Controller obligations",
        paragraphs: [
          "The Controller is responsible for the lawfulness of the processing, for informing its customers and for not entering special-category data.",
        ],
      },
      {
        heading: "8. Liability and governing law",
        paragraphs: ["[Liability terms and governing law to be defined by counsel.]"],
      },
    ],
  },
  pt: {
    title: "Acordo de Tratamento de Dados",
    intro: `Este acordo (art. 28.º RGPD) é celebrado entre o negócio que usa o RightSchedule ("Responsável pelo Tratamento") e ${E.name} ("Subcontratante") e aplica-se aos dados pessoais dos clientes do Responsável tratados através do serviço. Faz parte dos Termos de Serviço.`,
    sections: [
      {
        heading: "1. Objeto, duração e natureza",
        paragraphs: [
          "O Subcontratante aloja e trata dados de clientes, marcações e pedidos de orçamento por conta do Responsável para prestar o serviço de marcações online, enquanto o Responsável tiver conta.",
        ],
      },
      {
        heading: "2. Dados e titulares",
        bullets: [
          "Titulares: clientes e potenciais clientes do Responsável.",
          "Dados: nome, telefone, email, detalhes das marcações, notas de texto livre e descrições de pedidos de orçamento.",
          "Não podem ser introduzidas categorias especiais (art. 9.º), conforme os Termos.",
        ],
      },
      {
        heading: "3. Obrigações do Subcontratante",
        bullets: [
          "Tratar os dados apenas mediante instruções documentadas do Responsável (os Termos e a utilização do serviço) e informá-lo se uma instrução parecer violar a lei.",
          "Garantir que o pessoal autorizado está vinculado a confidencialidade.",
          "Aplicar medidas técnicas e organizativas adequadas (art. 32.º): cifragem em trânsito, credenciais com hash, cookies de sessão HttpOnly, separação de dados por negócio, controlo de acesso, limitação de pedidos e registos sem dados pessoais.",
          "Apoiar o Responsável nos pedidos dos titulares: os registos de clientes podem ser exportados e apagados na aplicação.",
          "Apoiar o Responsável em segurança, notificação de violações, avaliações de impacto e consultas, tendo em conta a natureza do tratamento.",
          "Notificar o Responsável sem demora injustificada, e em 48 horas sempre que possível, após tomar conhecimento de uma violação de dados pessoais.",
          "No fim do serviço, apagar os dados (ou devolvê-los por exportação), salvo obrigação legal de conservação.",
          "Disponibilizar a informação necessária para demonstrar conformidade e permitir auditorias razoáveis com aviso prévio.",
        ],
      },
      {
        heading: "4. Subcontratantes ulteriores",
        paragraphs: [
          "O Responsável dá autorização geral para o recurso aos subcontratantes indicados na página de subcontratantes. O Subcontratante informará o Responsável de alterações previstas para que possa opor-se, e imporá a cada um obrigações equivalentes de proteção de dados.",
        ],
      },
      {
        heading: "5. Transferências internacionais",
        paragraphs: [
          "Transferências para fora do EEE só ocorrem com mecanismo válido (decisão de adequação, Quadro de Privacidade de Dados UE-EUA ou Cláusulas Contratuais-Tipo).",
        ],
      },
      {
        heading: "6. Conservação",
        paragraphs: [
          "Salvo eliminação anterior pelo Responsável, as marcações são anonimizadas 24 meses após o serviço e os pedidos de orçamento são eliminados 12 meses após a receção. Os dados eliminados desaparecem das cópias de segurança em [período de retenção das cópias].",
        ],
      },
      {
        heading: "7. Obrigações do Responsável",
        paragraphs: [
          "O Responsável é responsável pela licitude do tratamento, por informar os seus clientes e por não introduzir categorias especiais de dados.",
        ],
      },
      {
        heading: "8. Responsabilidade e lei aplicável",
        paragraphs: ["[Termos de responsabilidade e lei aplicável a definir por advogado.]"],
      },
    ],
  },
};

export const legalDocs: Record<LegalKind, Record<AppLocale, LegalDoc>> = { privacy, terms, dpa };

export function customerNotice(locale: AppLocale, business: string): LegalDoc {
  if (locale === "pt") {
    return {
      title: `Aviso de privacidade - ${business}`,
      intro: `Este aviso explica como ${business} trata os seus dados pessoais quando faz uma marcação ou pede um orçamento.`,
      sections: [
        {
          heading: "Quem trata os seus dados",
          paragraphs: [
            `${business} é o responsável pelo tratamento. Use os contactos indicados na página de marcação do negócio para qualquer pedido. O RightSchedule (${E.name}) fornece a plataforma e trata os dados por conta de ${business}, como subcontratante.`,
          ],
        },
        {
          heading: "Que dados e para quê",
          bullets: [
            "Nome, telefone e/ou email, detalhes da marcação, notas e descrição do pedido de orçamento.",
            "Finalidades: gerir a sua marcação ou orçamento e enviar confirmações e lembretes do serviço.",
            "Fundamento: diligências pré-contratuais e execução do contrato (art. 6.º, n.º 1, al. b) RGPD).",
            "Não introduza dados de saúde nem outros dados sensíveis nas notas.",
          ],
        },
        {
          heading: "Quem recebe os dados",
          paragraphs: [
            "O negócio, a plataforma RightSchedule e os seus subcontratantes (alojamento, base de dados, envio de email). Não vendemos os seus dados.",
          ],
        },
        {
          heading: "Durante quanto tempo",
          paragraphs: [
            "Enquanto o negócio os mantiver; por omissão, as marcações são anonimizadas 24 meses após o serviço e os pedidos de orçamento eliminados 12 meses após a receção.",
          ],
        },
        {
          heading: "Os seus direitos",
          paragraphs: [
            `Pode pedir a ${business} acesso, retificação, exportação ou apagamento dos seus dados. Pode também apresentar reclamação à CNPD (www.cnpd.pt). Mais informação na Política de Privacidade do RightSchedule.`,
          ],
        },
      ],
    };
  }
  return {
    title: `Privacy notice - ${business}`,
    intro: `This notice explains how ${business} handles your personal data when you book an appointment or request a quote.`,
    sections: [
      {
        heading: "Who handles your data",
        paragraphs: [
          `${business} is the controller. Use the contact details on the business's booking page for any request. RightSchedule (${E.name}) provides the platform and processes the data on behalf of ${business}, as a processor.`,
        ],
      },
      {
        heading: "What data and why",
        bullets: [
          "Name, phone and/or email, booking details, notes and quote-request description.",
          "Purposes: manage your booking or quote and send service confirmations and reminders.",
          "Basis: pre-contractual steps and performance of a contract (Art. 6(1)(b) GDPR).",
          "Please do not enter health data or other sensitive data in notes.",
        ],
      },
      {
        heading: "Who receives it",
        paragraphs: [
          "The business, the RightSchedule platform and its sub-processors (hosting, database, email delivery). We do not sell your data.",
        ],
      },
      {
        heading: "How long",
        paragraphs: [
          "For as long as the business keeps it; by default bookings are anonymized 24 months after the appointment and quote requests are deleted 12 months after receipt.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You can ask ${business} for access, correction, export or erasure of your data. You may also lodge a complaint with the CNPD (www.cnpd.pt). More in the RightSchedule Privacy Policy.`,
        ],
      },
    ],
  };
}
