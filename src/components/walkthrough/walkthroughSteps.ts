export interface WalkthroughStep {
  id: string;
  title: string;
  badge?: string;
  description: string;
  tip?: string;
  targetId?: string; // HTML ID of element to highlight; undefined for centered modal
  targetView?: 'sidebar' | 'map' | 'any'; // Recommended view on mobile
  position?: 'bottom' | 'top' | 'left' | 'right' | 'center';
  iconName: 'Sparkles' | 'Users' | 'Clock' | 'Focus' | 'MapPin' | 'Building2' | 'CheckCircle';
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Venn!',
    badge: 'Überblick',
    description:
      'Venn löst das größte Problem bei der gemeinsamen Wohnungssuche: Wo können zwei oder mehr Personen wohnen, damit alle schnell und entspannt zur Arbeit, Uni oder Schule kommen?',
    tip: 'Venn berechnet Fahrzeiten mit echten ÖPNV-Fahrplänen, Straßennetzwerken und Live-Verkehr.',
    position: 'center',
    targetView: 'any',
    iconName: 'Sparkles',
  },
  {
    id: 'profiles',
    title: '1. Referenzorte & Personen',
    badge: 'Seitenleiste',
    description:
      'Trage hier für jede Person den Zielort ein (z. B. Büro, Campus oder Kita). Wähle individuelles Verkehrsmittel (ÖPNV, Auto, Fahrrad, Fuß) und die maximale Fahrzeit (z. B. 35 Minuten).',
    tip: 'Du kannst bis zu 6 Personen anlegen. Die Stecknadeln lassen sich auch direkt auf der Karte verschieben!',
    targetId: 'sidebar-first-person-card',
    targetView: 'sidebar',
    position: 'right',
    iconName: 'Users',
  },
  {
    id: 'schedule',
    title: '2. Pendelzeit & Fahrplan',
    badge: 'Fahrzeiten & Modi',
    description:
      'Passe Ankunfts- oder Abfahrtszeiten sowie Wochentage an. Venn analysiert Takte von U-Bahn, S-Bahn, Tram, Bus und Regio oder kalkuliert Stoßzeiten im Straßenverkehr.',
    tip: 'Mit der Prioritäts-Heatmap hebst du Lagen in direkter Nähe zu Haltestellen oder Autobahnauffahrten hervor.',
    targetId: 'commute-schedule-controls',
    targetView: 'sidebar',
    position: 'right',
    iconName: 'Clock',
  },
  {
    id: 'intersection',
    title: '3. Der gemeinsame Treffbereich',
    badge: 'Karten-Schnittmenge',
    description:
      'Der grüne Bereich auf der Karte ist euer gemeinsamer Treffbereich: Wer hier wohnt, erreicht alle hinterlegten Ziele garantiert innerhalb des Zeitlimits.',
    tip: 'Nutze den Schnellfilter "Nur Wohnbereich", um Industriezonen, Forste und Gewässer automatisch herauszufiltern.',
    targetId: 'btn-sidebar-only-intersection',
    targetView: 'sidebar',
    position: 'right',
    iconName: 'Focus',
  },
  {
    id: 'inspection',
    title: '4. Interaktive Klick-Inspektion',
    badge: 'Karten-Analyse',
    description:
      'Klicke auf einen beliebigen Punkt auf der Karte: Venn berechnet sofort die minutengenaue Pendelzeit und Route jeder Person zu diesem Standort.',
    tip: 'Zusätzlich erfährst du das durchschnittliche Mietpreisniveau (EUR/m²) des jeweiligen Stadtviertels.',
    targetId: 'venn-map-stage',
    targetView: 'map',
    position: 'center',
    iconName: 'MapPin',
  },
  {
    id: 'apartments',
    title: '5. Passende Wohnungsangebote',
    badge: 'Wohnungs-Manager',
    description:
      'Keine mühsame Suche auf verschiedenen Portalen: Venn filtert Mietangebote (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen) direkt passend für euren Treffbereich.',
    tip: 'Filtere nach Kaltmiete, Zimmeranzahl und Wohnfläche oder erstelle vorgefilterte Suchlinks mit einem Klick.',
    targetId: 'btn-open-apartments',
    targetView: 'any',
    position: 'bottom',
    iconName: 'Building2',
  },
  {
    id: 'ready',
    title: 'Bereit für eure Suche!',
    badge: 'Los geht\'s',
    description:
      'Teste vorbereitete Szenarien für München, Berlin, Frankfurt oder Hamburg – oder trage direkt eure eigenen Adressen ein. Viel Erfolg bei der Suche nach eurem perfekten Treffpunkt!',
    tip: 'Diese Einführung kannst du jederzeit über das Fragezeichen-Symbol (?) im oberen Menü erneut aufrufen.',
    position: 'center',
    targetView: 'any',
    iconName: 'CheckCircle',
  },
];
