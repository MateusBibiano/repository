// Dados de demonstração: 14 equipes no meio do evento (nomes genéricos, senhas fictícias).
export const T0 = new Date('2026-11-07T20:05:00-03:00').getTime();
const M = 60000;
export const PINS = { org: 'demo-org', mat: '1111', qui: '2222', fis: '3333', bio: '4444', hge: '5555', fil: '6666', por: '7777', esp: '8888', art: '9999', ef1: '1212', ef2: '2323', ef3: '3434', d4: '4545' };
const ACAD = ['mat', 'qui', 'fis', 'bio', 'hge', 'fil', 'por', 'esp', 'art'];
const SPORT = { ef1: ['mat'], ef2: ['qui', 'fis', 'bio'], ef3: ['hge', 'fil'], d4: ['por', 'esp', 'art'] };
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
export function seed(now = T0) {
  const S = { 'config/pins': PINS, 'config/main': {} };
  const r = rng(7);
  for (let i = 1; i <= 14; i++) S['teams/t' + String(i).padStart(2, '0')] = { n: i, name: '' };
  // quantos desafios cada equipe já concluiu
  const doneN = [9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2];
  const running = { 1: 'ef2', 2: 'fil', 3: 'mat', 5: 'qui', 6: 'art', 8: 'bio', 10: 'esp', 12: 'hge', 13: 'por' };
  const failing = { 4: 'fis', 9: 'mat' };
  for (let i = 1; i <= 14; i++) {
    const tid = 't' + String(i).padStart(2, '0');
    const order = [...ACAD].sort(() => r() - 0.5);
    let done = order.slice(0, doneN[i - 1]);
    // esportivos concluídos quando a área inteira está feita
    const sports = Object.entries(SPORT).filter(([, req]) => req.every((x) => done.includes(x))).map(([k]) => k);
    done = done.concat(sports.slice(0, i <= 3 ? 2 : 1));
    const skip = new Set([running[i], failing[i]].filter(Boolean));
    let tEnd = now - 3 * M;
    done.filter((s) => !skip.has(s)).reverse().forEach((s) => {
      const dur = Math.round((3.8 + r() * 5.4) * M + r() * 59000);
      S['runs/' + tid + '__' + s] = { team: tid, station: s, status: 'done', start: tEnd - dur, end: tEnd, dur };
      tEnd -= dur + Math.round((1 + r() * 3) * M);
    });
    if (running[i]) S['runs/' + tid + '__' + running[i]] = { team: tid, station: running[i], status: 'running', start: now - Math.round((1 + r() * 7) * M) };
    if (failing[i]) { const end = now - Math.round((2 + r() * 4) * M); S['runs/' + tid + '__' + failing[i]] = { team: tid, station: failing[i], status: 'fail', start: end - 10 * M - 20000, end, dur: 10 * M + 20000 }; }
  }
  return S;
}
