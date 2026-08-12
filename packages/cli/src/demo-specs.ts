import { listOutletIds } from '@injectlab/core';
import type { NewsInject, OutletId } from '@injectlab/core';

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
};

export function demoSpecs(): NewsInject[] {
  return listOutletIds().map((id) => DEMOS[id]);
}

export function demoFor(outlet: OutletId): NewsInject {
  return DEMOS[outlet];
}
