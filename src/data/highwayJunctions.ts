/**
 * Major Motorway Junctions and Exits (Autobahnanschlussstellen)
 * in the Greater Munich Metropolitan Area (A9, A99, A96, A8, A95, A94, A92, Mittlerer Ring).
 */

export interface HighwayJunction {
  id: string;
  name: string;
  autobahn: string; // 'A9', 'A99', 'A96', 'A8', 'A95', 'A94', 'A92', 'B2R'
  lat: number;
  lng: number;
}

export const MUNICH_HIGHWAY_JUNCTIONS: HighwayJunction[] = [
  // A9 München - Nürnberg
  { id: 'a9_schwabing', name: 'A9 - AS München-Schwabing (Mittlerer Ring Nord)', autobahn: 'A9', lat: 48.1795, lng: 11.5935 },
  { id: 'a9_frankfurter_ring', name: 'A9 - AS Frankfurter Ring', autobahn: 'A9', lat: 48.1882, lng: 11.5998 },
  { id: 'a9_freimann', name: 'A9 - AS München-Freimann', autobahn: 'A9', lat: 48.2052, lng: 11.6148 },
  { id: 'a9_froettmaning_sued', name: 'A9 - AS Fröttmaning-Süd', autobahn: 'A9', lat: 48.2162, lng: 11.6215 },
  { id: 'a9_ak_muenchen_nord', name: 'A9 / A99 - Autobahnkreuz München-Nord', autobahn: 'A9', lat: 48.2312, lng: 11.6295 },
  { id: 'a9_garching_sued', name: 'A9 - AS Garching-Süd', autobahn: 'A9', lat: 48.2435, lng: 11.6368 },
  { id: 'a9_garching_nord', name: 'A9 - AS Garching-Nord (Forschungszentrum)', autobahn: 'A9', lat: 48.2672, lng: 11.6492 },

  // A99 Autobahnring München
  { id: 'a99_ludwigsfeld', name: 'A99 - AS München-Ludwigsfeld', autobahn: 'A99', lat: 48.2125, lng: 11.5015 },
  { id: 'a99_neuherberg', name: 'A99 - AS Neuherberg', autobahn: 'A99', lat: 48.2245, lng: 11.5652 },
  { id: 'a99_asne_muenchen_nord', name: 'A99 - AK München-Nord', autobahn: 'A99', lat: 48.2312, lng: 11.6295 },
  { id: 'a99_asmaning', name: 'A99 - AS Aschheim / Ismaning', autobahn: 'A99', lat: 48.2045, lng: 11.6912 },
  { id: 'a99_kirchheim', name: 'A99 - AS Kirchheim bei München', autobahn: 'A99', lat: 48.1752, lng: 11.7385 },
  { id: 'a99_ak_muenchen_ost', name: 'A99 / A94 - AK München-Ost', autobahn: 'A99', lat: 48.1472, lng: 11.7585 },
  { id: 'a99_haar', name: 'A99 - AS Haar', autobahn: 'A99', lat: 48.1125, lng: 11.7512 },
  { id: 'a99_hohenbrunn', name: 'A99 - AS Hohenbrunn / Ottobrunn', autobahn: 'A99', lat: 48.0645, lng: 11.7212 },
  { id: 'a99_ak_muenchen_sued', name: 'A99 / A8 - AK München-Süd (Brunnthal)', autobahn: 'A99', lat: 48.0285, lng: 11.6885 },
  { id: 'a99_allach', name: 'A99 - AD München-Allach (A99 / A8 West)', autobahn: 'A99', lat: 48.1975, lng: 11.4395 },
  { id: 'a99_lochhausen', name: 'A99 - AS München-Lochhausen / Gröbenzell', autobahn: 'A99', lat: 48.1815, lng: 11.4112 },
  { id: 'a99_freiham', name: 'A99 - AS München-Freiham Mitte', autobahn: 'A99', lat: 48.1455, lng: 11.3912 },
  { id: 'a99_ad_sw', name: 'A99 / A96 - Autobahndreieck München-Süd-West', autobahn: 'A99', lat: 48.1325, lng: 11.3952 },

  // A96 München - Lindau (West / Gilching / Germering)
  { id: 'a96_sendling', name: 'A96 - AD München-Sendling (Mittlerer Ring Süd-West)', autobahn: 'A96', lat: 48.1215, lng: 11.5285 },
  { id: 'a96_laim', name: 'A96 - AS München-Laim', autobahn: 'A96', lat: 48.1265, lng: 11.4985 },
  { id: 'a96_blumenau', name: 'A96 - AS München-Blumenau / Hadern', autobahn: 'A96', lat: 48.1305, lng: 11.4652 },
  { id: 'a96_germering_ost', name: 'A96 - AS Germering-Ost', autobahn: 'A96', lat: 48.1315, lng: 11.4115 },
  { id: 'a96_ad_suedwest', name: 'A96 / A99 - AD München-Südwest', autobahn: 'A96', lat: 48.1325, lng: 11.3952 },
  { id: 'a96_germering_sued', name: 'A96 - AS Germering-Süd', autobahn: 'A96', lat: 48.1212, lng: 11.3652 },
  { id: 'a96_gilching_ost', name: 'A96 - AS Gilching-Ost (Geisenbrunn)', autobahn: 'A96', lat: 48.1105, lng: 11.3312 },
  { id: 'a96_gilching', name: 'A96 - AS Gilching (Argelsried / Gewerbegebiet)', autobahn: 'A96', lat: 48.0985, lng: 11.2952 },
  { id: 'a96_oberpfaffenhofen', name: 'A96 - AS Oberpfaffenhofen / Weßling', autobahn: 'A96', lat: 48.0825, lng: 11.2712 },
  { id: 'a96_woerthsee', name: 'A96 - AS Wörthsee / Steinebach', autobahn: 'A96', lat: 48.0695, lng: 11.2152 },

  // A8 West München - Augsburg / Stuttgart
  { id: 'a8_obermenzing', name: 'A8 - AS München-Obermenzing (Verdistraße)', autobahn: 'A8', lat: 48.1675, lng: 11.4675 },
  { id: 'a8_ad_eschenried', name: 'A8 - AD Eschenried (A8 / A99a)', autobahn: 'A8', lat: 48.2045, lng: 11.4285 },
  { id: 'a8_dachau_ffb', name: 'A8 - AS Dachau / Fürstenfeldbruck', autobahn: 'A8', lat: 48.2325, lng: 11.3785 },

  // A8 Süd München - Salzburg
  { id: 'a8_ramersdorf', name: 'A8 - AS München-Ramersdorf (Mittlerer Ring Süd-Ost)', autobahn: 'A8', lat: 48.1112, lng: 11.6115 },
  { id: 'a8_neubiberg', name: 'A8 - AS Neubiberg', autobahn: 'A8', lat: 48.0815, lng: 11.6425 },
  { id: 'a8_unterhaching_ost', name: 'A8 - AS Unterhaching-Ost', autobahn: 'A8', lat: 48.0612, lng: 11.6625 },

  // A95 München - Garmisch
  { id: 'a95_sendling_sued', name: 'A95 - AD München-Süd (Luise-Kiesselbach-Platz)', autobahn: 'A95', lat: 48.1095, lng: 11.5305 },
  { id: 'a95_fuerstenried', name: 'A95 - AS München-Fürstenried', autobahn: 'A95', lat: 48.0825, lng: 11.4985 },
  { id: 'a95_forstenried', name: 'A95 - AS Forstenried', autobahn: 'A95', lat: 48.0652, lng: 11.4825 },
  { id: 'a95_starnberg', name: 'A95 - AD Starnberg (A95 / A952)', autobahn: 'A95', lat: 48.0195, lng: 11.4425 },

  // A94 München - Passau
  { id: 'a94_steinhausen', name: 'A94 - AS München-Steinhausen (Einsteinstraße)', autobahn: 'A94', lat: 48.1365, lng: 11.6352 },
  { id: 'a94_zamdorf', name: 'A94 - AS München-Zamdorf', autobahn: 'A94', lat: 48.1415, lng: 11.6525 },
  { id: 'a94_riem', name: 'A94 - AS München-Riem (Messe)', autobahn: 'A94', lat: 48.1385, lng: 11.6895 },
  { id: 'a94_feldkirchen_west', name: 'A94 - AS Feldkirchen-West', autobahn: 'A94', lat: 48.1445, lng: 11.7215 },

  // Mittlerer Ring (B2R) Hauptknoten
  { id: 'b2r_donnersberger', name: 'B2R - Donnersbergerbrücke / Landsberger Str.', autobahn: 'B2R', lat: 48.1425, lng: 11.5352 },
  { id: 'b2r_olympiapark', name: 'B2R - Georg-Brauchle-Ring / Landshuter Allee', autobahn: 'B2R', lat: 48.1745, lng: 11.5365 },
  { id: 'b2r_petueltunnel', name: 'B2R - Petuelring / Leopoldstraße', autobahn: 'B2R', lat: 48.1772, lng: 11.5815 },
  { id: 'b2r_effnerplatz', name: 'B2R - Effnerplatz / Richard-Strauss-Tunnel', autobahn: 'B2R', lat: 48.1525, lng: 11.6152 },
  { id: 'b2r_innsbrucker_ring', name: 'B2R - Innsbrucker Ring / Chiemgaustraße', autobahn: 'B2R', lat: 48.1185, lng: 11.6125 },
  { id: 'b2r_brudermuehltunnel', name: 'B2R - Brudermühltunnel / Isarquerung', autobahn: 'B2R', lat: 48.1105, lng: 11.5512 },
];
