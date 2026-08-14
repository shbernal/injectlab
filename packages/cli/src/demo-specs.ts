import { listOutletIds } from '@injectlab/core';
import type { InjectSpec, NewsInject, OutletId, XPostInject } from '@injectlab/core';

/**
 * The specs `inject demo` renders.
 *
 * Built in rather than shipped as files, so `inject demo` needs no arguments, no files and no
 * working directory. It is the first thing a new user or an agent runs, and the first thing
 * anyone runs should not be able to fail on a missing path.
 *
 * Every company named here is fictional, deliberately and without exception. A demo asset is
 * the one most likely to escape its context, and a demo naming a real organisation is a
 * plausible-looking false report about that organisation sitting in a package on npm.
 */

const DEMOS: Record<OutletId, NewsInject> = {
  bbc: {
    kind: 'news',
    outlet: 'bbc',
    section: 'Technology',
    headline: 'Northwind Logistics hit by ransomware, deliveries halted across the UK',
    standfirst:
      'The haulier says its depots are running on paper and that it has notified the regulator.',
    byline: 'Helen Morrow',
    publishedAt: '2026-08-12T08:14:00Z',
    body: [
      'Northwind Logistics has taken its depot systems offline after what it described as a significant ransomware attack, leaving several hundred delivery routes running on paper.',
      'In a short statement the company said it had isolated the affected systems as a precaution and had engaged external incident responders. It would not say whether customer data had been accessed.',
      'The regulator confirmed it had been notified and said it was in contact with the company. Industry figures said the timing, days before a bank holiday weekend, was likely to compound the disruption.',
    ],
  },
  lemonde: {
    kind: 'news',
    outlet: 'lemonde',
    section: 'Économie',
    headline: "Cyberattaque chez Aurélia Énergie : la production à l'arrêt sur trois sites",
    standfirst:
      "Le groupe affirme avoir isolé ses réseaux industriels et avoir saisi l'Agence nationale de la sécurité des systèmes d'information.",
    byline: 'Camille Faure',
    publishedAt: '2026-08-12T10:40:00+02:00',
    body: [
      "Aurélia Énergie a suspendu la production sur trois de ses sites français à la suite d'une cyberattaque détectée dans la nuit de lundi à mardi, a indiqué le groupe dans un communiqué.",
      "La direction assure que les réseaux industriels ont été isolés des réseaux bureautiques dès les premières heures, et qu'aucune donnée client n'a, à ce stade, été exfiltrée.",
      "L'Agence nationale de la sécurité des systèmes d'information a confirmé avoir été saisie. Plusieurs syndicats ont demandé la tenue d'un comité social et économique extraordinaire.",
    ],
  },
  /**
   * The same French incident again, two hours on and read off the share price rather than off
   * the communiqué. A business daily is the case for keeping the demo set to one scenario:
   * what changes between this and the Le Monde spec above is almost entirely which facts the
   * outlet thinks are the story.
   */
  lesechos: {
    kind: 'news',
    outlet: 'lesechos',
    section: 'Industrie',
    headline:
      "Cyberattaque chez Aurélia Énergie : le groupe chiffre l'arrêt à 12 millions d'euros par semaine",
    standfirst:
      "Le titre a cédé 4,2 % à l'ouverture. La direction vise une reprise partielle en fin de semaine et ne confirme aucune demande de rançon.",
    byline: 'Étienne Roux',
    publishedAt: '2026-08-12T12:10:00+02:00',
    body: [
      "Aurélia Énergie a chiffré mercredi matin le coût de l'arrêt de ses trois sites français à environ 12 millions d'euros par semaine de production perdue, un ordre de grandeur que la direction présente comme provisoire et hors coûts de remédiation.",
      "Le titre a ouvert en baisse de 4,2 % avant de refluer à moins de 3 % en séance. Deux analystes ont maintenu leur objectif de cours, en jugeant que l'essentiel de la facture serait absorbé par la couverture cyber souscrite l'an dernier.",
      "Interrogée sur l'existence d'une demande de rançon, la direction n'a ni confirmé ni démenti, en renvoyant à l'enquête en cours. Une reprise partielle est visée en fin de semaine sur le site le moins touché.",
    ],
  },
  /**
   * The same French incident as the daily above, an hour later and in the other register.
   * Rendered side by side that is the useful demonstration: one event, two publications, and
   * the difference between them is the outlet record rather than the copy.
   */
  '20minutes': {
    kind: 'news',
    outlet: '20minutes',
    section: 'Économie',
    headline: "Cyberattaque chez Aurélia Énergie : ce que l'on sait de la panne",
    standfirst:
      "La production est à l'arrêt sur trois sites, le groupe dit avoir isolé ses réseaux industriels et l'ANSSI a été saisie.",
    byline: '20 Minutes avec agence',
    publishedAt: '2026-08-12T11:25:00+02:00',
    body: [
      "La production d'Aurélia Énergie est suspendue depuis mardi matin sur trois sites français, après une cyberattaque détectée dans la nuit. Le groupe n'a pas précisé combien de salariés sont concernés.",
      "Selon le communiqué publié en fin de matinée, les réseaux industriels ont été coupés des réseaux bureautiques dès les premières heures. Aucune donnée client n'aurait été volée à ce stade, une formulation qui laisse la question ouverte.",
      "L'Agence nationale de la sécurité des systèmes d'information a été saisie et accompagne l'entreprise. Aucune date de reprise n'a été annoncée.",
    ],
  },
};

/**
 * The rumour chain.
 *
 * Same fictional company as the BBC demo, deliberately: rendered together the demo set reads
 * as one scenario rather than as three unrelated samples, which is what an exercise actually
 * looks like.
 */
const X_DEMO: XPostInject = {
  kind: 'x-post',
  author: {
    name: 'Freight Watch UK',
    handle: 'freightwatchuk',
    verified: 'grey',
  },
  text: 'Hearing Northwind Logistics depots have been down since about 4am. Drivers being turned away at Daventry and Warrington. Anyone else seeing this?',
  postedAt: '2026-08-12T07:05:00Z',
  thread: [
    'Update: a second source says it is a ransomware incident, not a systems outage. Northwind have not said anything publicly yet.',
    'Northwind statement just out. They are calling it a "cyber incident", say depots are running on paper, and are not answering on customer data.',
  ],
  metrics: { replies: 184, reposts: 1240, likes: 3820, views: 412_000 },
  theme: 'light',
};

export function demoSpecs(): InjectSpec[] {
  return [...listOutletIds().map((id) => DEMOS[id]), X_DEMO];
}

export function demoFor(outlet: OutletId): NewsInject {
  return DEMOS[outlet];
}
