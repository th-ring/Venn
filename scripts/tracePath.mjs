import { getTransitRegion, isConnectionAllowed } from '../src/services/mvvMatrixService.ts';

const dataset = getTransitRegion();
console.log('Dataset station count:', dataset.stations.length);
console.log('Dataset connection count:', dataset.connections.length);

// Let's find all connections from domagkstr
const domagkConns = dataset.connections.filter(c => c.from === 'domagkstr' || c.to === 'domagkstr');
console.log('Domagkstr connections:', domagkConns);

// Let's find S6 connections around Pasing, Westkreuz, Lochham, Gräfelfing
const s6Conns = dataset.connections.filter(c => c.lines.includes('S6'));
console.log('S6 connections:', s6Conns);
