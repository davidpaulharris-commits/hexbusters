/* Rush Hour – the four maps.
   Each map is a 25 x 35 grid. Lower-case letters, '.', digits and 'P' are floor you can walk on.
   Upper-case letters and '#' are solid. Digits 1–5 are the task stations, P is where you start. */
(function (RH) {
  'use strict';
  const CELL = 40;
  const M = RH.Maps = { CELL };

  M.list = {
    school: {
      id: 'school', name: 'School', emoji: '🏫', bg: '#3f7d3a',
      tasks: ['books', 'maths', 'pekit', 'wires', 'spelling'],
      stationNames: ['Library', 'Classroom whiteboard', 'Changing rooms', 'School hall', 'English room'],
      grid: [
        '#########################',
        '#BBBBBBBBBB#cccccc2ccccc#',
        '#llllllllll#cccccccccccc#',
        '#lBBlBBlBBl#cDDcDDcDDccc#',
        '#llllllllll#cccccccccccc#',
        '#lBBl1lBBll#cDDcDDcDDccc#',
        '#llllllllll#cccccccccccc#',
        '#####..#############..###',
        '#.......................#',
        '#...........P...........#',
        '#####..#############..###',
        '#SShhhhhhhh#kkkkkkkkkkkk#',
        '#SShhhhhhhh#kLLLLkkLLLLk#',
        '#SShh4hhhhh#kkkkkkkkkkkk#',
        '#SShhhhhhhh#kkkkkk3kkkkk#',
        '#SShhhhhhhh#kLLLLkkLLLLk#',
        '#SShhhhhhhh#kkkkkkkkkkkk#',
        '#####..#############..###',
        '#.......................#',
        '#.......................#',
        '#####..#############..###',
        '#eeeeeeeeee#nnnnnnnnnnnn#',
        '#eDDeDDeDDe#nTTTnnnnTTTn#',
        '#eeeeeeeeee#nnnnnnnnnnnn#',
        '#eDDe5eDDee#nTTTnnnnTTTn#',
        '#eeeeeeeeee#nnnnnnnnnnnn#',
        '#eeeeeeeeee#KKKKKKKKKKKK#',
        '#####..##################',
        'gpppppppppppppppppppppppg',
        'gpppppppppppppppppppppppg',
        'gpppppppppppppppppppppppg',
        'ggggggggggg...ggggggggggg',
        'FFFFFFFFFFF...FFFFFFFFFFF',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
      ],
      legend: {
        '#': ['wall', '#6b6f86'], '.': ['floor', '#e9e2d0'], 'l': ['floor', '#9b5a6e'], 'c': ['wood', '#d8b07a'],
        'h': ['wood', '#e3c08d'], 'k': ['tile', '#9cc9e6'], 'e': ['wood', '#c99c68'], 'n': ['checker', '#f1ede4'],
        'p': ['tarmac', '#8d8f99'], 'g': ['grass', '#5ea84d'], 'B': ['shelf', '#7a4b2a'], 'D': ['desk', '#b9874f'],
        'S': ['stage', '#5a3a26'], 'L': ['bench', '#6f8fb3'], 'T': ['table', '#e07a5f'], 'K': ['counter', '#a8b0bd'],
        'F': ['hedge', '#2f7a34'], 'R': ['road', '#3b3d45'],
      },
      labels: [['Library', 5.5, 2.5], ['Classroom', 17.5, 6.4], ['School Hall', 6.5, 15.6], ['Changing Rooms', 17.5, 16.4], ['English', 5.5, 25.6], ['Canteen', 17.5, 23.2], ['Playground', 12.5, 29.6], ['Bus stop', 15.5, 31.5]],
      decor: [
        { board: '7 + 5 = ?', c: 18.5, r: 0.5, w: 3.4 },
        { board: 'Spelling', c: 5.5, r: 20.5, w: 3 },
        { screen: true, c: 1.5, r: 13.5 },
        ['🍎', 14, 22.5, 18], ['🥪', 21, 22.5, 18], ['🍕', 14.5, 24.5, 18], ['🧃', 20.5, 24.5, 18],
        ['⚽', 5, 29, 26], ['🏀', 20, 29, 26], ['🚏', 14, 31.5, 30], ['🌳', 0.6, 31.5, 34], ['🌳', 24.4, 31.5, 34],
      ],
      ending: 'school',
    },

    bank: {
      id: 'bank', name: 'Bank', emoji: '🏦', bg: '#55606e',
      tasks: ['vault', 'till', 'coins', 'fake', 'atm'],
      stationNames: ['Vault door', 'Cashier till', 'Coin room', "Manager's office", 'Cash machine'],
      grid: [
        '#########################',
        '#VVVvvvvVVV#oooooooooooo#',
        '#vvvvvvvvvv#oDDDooooYooo#',
        '#Vvvvvvvvvv#oo4ooooooooo#',
        '#vvvv1vvvvv#oooooooooooo#',
        '#VvvvvvvvvV#ooooooooDDDo#',
        '#vvvvvvvvvv#oooooooooooo#',
        '#####..#############..###',
        '#.......................#',
        '#...........P...........#',
        '###########..############',
        '#mmmmmmmmmmmmmmmm#cccccc#',
        '#mCCCCCC2CCCCCCCm#cccccc#',
        '#mmmmmmmmmmmmmmmm#cCCccc#',
        '#mmYmmmmmmmmmmYmm#cccccc#',
        '#mmmmmmmmmmmmmmmmmcc3ccc#',
        '#mmmmmmmmmmmmmmmmmcccccc#',
        '#mmmmmmmmmmmmmmmm#cCCccc#',
        '#mmYmmmmmmmmmmYmm#cccccc#',
        '#mmmmmmmmmmmmmmmm#cccccc#',
        '#mmmmmmmmmmmmmmmm#cccccc#',
        '########mmm###A##########',
        'ssssssssssssss5ssssssssss',
        'ssYssssssssssssssssssYsss',
        'sssssssssssssssssssssssss',
        'sssssssssssssssssssssssss',
        'ssYssssssssssssssssssYsss',
        'sssssssssssssssssssssssss',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
        'RRRRRRRRRRRRRRRRRRRRRRRRR',
        'HHHHH.HHHHHHH.HHHHHHH.HHH',
        'HHHHH.HHHHHHH.HHHHHHH.HHH',
        'HHHHH.HHHHHHH.HHHHHHH.HHH',
      ],
      legend: {
        '#': ['wall', '#7b6a58'], '.': ['marble', '#efe9dc'], 'v': ['steel', '#9aa3ad'], 'o': ['carpet', '#3f7f6a'],
        'm': ['marble', '#f4efe6'], 'c': ['tile', '#d9d2c3'], 's': ['paving', '#c9c4ba'], 'V': ['gold', '#8a8f96'],
        'D': ['desk', '#7a4b2a'], 'C': ['counter', '#8b5a35'], 'Y': ['plant', '#2e8b57'], 'A': ['atm', '#4a5568'],
        'R': ['road', '#3b3d45'], 'H': ['house', '#b5654a'],
      },
      labels: [['Vault', 5.5, 6.4], ["Manager's Office", 17.5, 6.4], ['Banking Hall', 8.5, 19.6], ['Coin Room', 20.5, 19.6], ['Cash Machine', 14.5, 23.4]],
      decor: [['💰', 2.5, 1.5, 22], ['💰', 8.5, 1.5, 22], ['🔒', 5.5, 3, 26], ['🖥️', 13.5, 2.5, 18], ['☕', 21.5, 5, 16], ['🪙', 20, 13, 18], ['🪙', 20, 17, 18], ['🕰️', 11.5, 11, 22]],
      ending: 'bank',
    },

    shop: {
      id: 'shop', name: 'Shopping Centre', emoji: '🛍️', bg: '#4b5b8a',
      tasks: ['shoplist', 'checkout', 'mannequin', 'cctv', 'coffee'],
      stationNames: ['Supermarket aisles', 'Supermarket checkout', 'Fashion shop', 'Security office', 'Café counter'],
      grid: [
        '#########################',
        '#uuuuuuuuuuuu#ffffffffff#',
        '#uAAuAAuAAuAu#fMMffffMMf#',
        '#uAAuAAuAAuAu#ffff3fffff#',
        '#uAAuAA1AAuAu#fMMffffMMf#',
        '#uAAuAAuAAuAu#ffffffffff#',
        '#uuuuuuuuuuuu#ffffffffff#',
        '#uuuuuuuuuuuu######..####',
        '#uXXu2uXXuuuu#..........#',
        '#uuuuuuuuuuuu#..........#',
        '#######..#####..........#',
        '#.......................#',
        '#..........WWW..........#',
        '#..........WWW...P......#',
        '#.......................#',
        '#####..#####..####..#####',
        '#tttttttttt#..#qqqqqqqqq#',
        '#tOOtOOtOOt#..#qZZZZqqqq#',
        '#tttttttttt#..#qq4qqqqqq#',
        '#tOOtOOtOOt#..#qqqqqqqqq#',
        '#tttttttttt#..#qqqqqqqqq#',
        '############..###########',
        '#.......................#',
        '#.......................#',
        '##########..#############',
        '#aaaaaaaaaaaaaaaaaaaaaaa#',
        '#aTTaaTTaaTTaaaaaaaaaaaa#',
        '#aaaaaaaaaaaaaaaaaa5aaaa#',
        '#aTTaaTTaaTTaaaaKKKKKKKa#',
        '#aaaaaaaaaaaaaaaaaaaaaaa#',
        '#########################',
        'GGGGGGGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGGGGGGG',
        'GGGGGGGGGGGGGGGGGGGGGGGGG',
      ],
      legend: {
        '#': ['wall', '#3c4a75'], '.': ['marble', '#ece8f2'], 'u': ['tile', '#f4f6f8'], 'f': ['carpet', '#f2b8cf'],
        't': ['wood', '#ffd98a'], 'q': ['carpet', '#33415c'], 'a': ['wood', '#c8956a'], 'A': ['aisle', '#d9534f'],
        'X': ['checkout', '#596273'], 'M': ['rails', '#b86b93'], 'O': ['toys', '#e9a23b'], 'Z': ['cctv', '#1d2433'],
        'T': ['table', '#7a4b2a'], 'K': ['counter', '#5c3a26'], 'W': ['fountain', '#4fb3e8'], 'G': ['carpark', '#585b63'],
      },
      labels: [['Supermarket', 6.5, 6.6], ['Fashion', 18.5, 5.6], ['Toy Shop', 5.5, 20.6], ['Security', 19, 20.6], ['Café', 5.5, 29.6], ['Car Park', 12.5, 32.5]],
      decor: [['🛒', 11.5, 9, 22], ['👗', 15.5, 1.5, 20], ['👔', 22.5, 1.5, 20], ['🧸', 2, 16.5, 20], ['🚂', 9, 18.5, 20], ['📺', 17, 16.3, 18], ['☕', 19.5, 28.4, 20], ['🧁', 22, 28.4, 18], ['🌴', 1.5, 12.5, 26], ['🌴', 23.5, 12.5, 26], ['🚗', 4, 32, 30], ['🚙', 10, 33, 30], ['🚕', 19, 32, 30]],
      lights: [[1, 1, 12, 9], [14, 1, 10, 6], [1, 16, 10, 5], [15, 16, 9, 5], [1, 25, 23, 5], [14, 8, 10, 3], [12, 15, 2, 7], [1, 22, 23, 2], [1, 11, 23, 4]],
      ending: 'shop',
    },

    town: {
      id: 'town', name: 'Town', emoji: '🏘️', bg: '#4c8c3f',
      tasks: ['letters', 'crossing', 'litter', 'ducks', 'valves'],
      stationNames: ['Post office', 'Zebra crossing', 'Park', 'Duck pond', 'Burst water pipe'],
      grid: [
        'HHH.HHH.HHH.OOOOO.HHH.HHH',
        'HHH.HHH.HHH.OOOOO.HHH.HHH',
        'HHH.HHH.HHH.OOOOO.HHH.HHH',
        '..............1..........',
        '..........2..............',
        'RRRRRRRRRRzzRRRRRRRRRRRRR',
        'RRRRRRRRRRzzRRRRRRRRRRRRR',
        'RRRRRRRRRRzzRRRRRRRRRRRRR',
        '............P............',
        'gYgggggggggggggggggggggYg',
        'ggggpppppppppppppppppgggg',
        'gggpgggggggggggggggggpggg',
        'gggpgggggggggWWWWWWggpggg',
        'gFFpggggggggWWWWWWWWgpggg',
        'gFFpg3ggggggWWWWWWWW4pggg',
        'gFFpggggggggWWWWWWWWgpggg',
        'gggpgggggggggWWWWWWggpggg',
        'gggpgggYgggggggggggggpggg',
        'gggpppppppppppppppppppggg',
        'gYgggggggBBgggggggggggYgg',
        'ggggggggggggggggggggggggg',
        '.........................',
        'RRRRRRRRRRRRRRzzRRRRRRRRR',
        'RRRRRRRRRRRRRRzzRRRRRRRRR',
        'RRRRRRRRRRRRRRzzRRRRRRRRR',
        '.........................',
        '......5..................',
        'SSSSS.SSSSS.CCC.SSSSS.SSS',
        'SSSSS.SSSSS.CCC.SSSSS.SSS',
        'SSSSS.SSSSS.CCC.SSSSS.SSS',
        'SSSSS.SSSSS.CCC.SSSSS.SSS',
        '.........................',
        'HHH.HHH.HHH.HHH.HHH.HHHHH',
        'HHH.HHH.HHH.HHH.HHH.HHHHH',
        'HHH.HHH.HHH.HHH.HHH.HHHHH',
      ],
      legend: {
        '.': ['paving', '#cfc9bd'], 'g': ['grass', '#62b04f'], 'p': ['sand', '#e3cf98'], 'z': ['zebra', '#3b3d45'],
        'R': ['road', '#3b3d45'], 'H': ['house', '#c0664c'], 'O': ['postoffice', '#d23c3c'], 'S': ['shop', '#7a8fb8'],
        'C': ['clock', '#a68a64'], 'W': ['water', '#3b9ae1'], 'Y': ['tree', '#2f7a34'], 'F': ['flowers', '#62b04f'], 'B': ['bench', '#62b04f'],
      },
      labels: [['Post Office', 14.5, 1.5], ['Park', 7, 11.5], ['Duck Pond', 16, 17.4], ['Town Clock', 13.5, 26.3]],
      decor: [['📮', 14.5, 2.6, 22], ['🕰️', 13.5, 28.6, 34], ['🥖', 2.5, 28.6, 26], ['☕', 8.5, 28.6, 26], ['🍦', 18.5, 28.6, 26], ['💈', 23, 28.6, 26], ['🦆', 14, 14, 22], ['🦆', 17.5, 13, 20], ['🌷', 1.5, 14, 18], ['🌼', 2.5, 13.5, 18], ['🌷', 2, 15.2, 18]],
      lamps: [[2, 4], [7, 4], [17, 4], [22, 4], [2, 8], [8, 8], [17, 8], [22, 8], [4, 10], [20, 18], [12, 18], [2, 21], [8, 21], [18, 21], [23, 21], [2, 25], [10, 25], [19, 25], [23, 25], [5, 31], [11, 31], [19, 31]],
      ending: 'town',
    },
  };

  M.ids = ['school', 'bank', 'shop', 'town'];

  M.isSolid = (ch) => ch === '#' || (ch >= 'A' && ch <= 'Z' && ch !== 'P');

  // Parse a map once: walkable grid, stations, start point and floor under stations
  M.prepare = function (map) {
    if (map._ready) return map;
    const H = map.grid.length, W = map.grid[0].length;
    const cells = map.grid.map((row) => row.split(''));
    const solid = new Uint8Array(W * H);
    const stations = {};
    let start = null;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = cells[y][x];
        if (M.isSolid(ch)) solid[y * W + x] = 1;
        if (ch >= '1' && ch <= '5') stations[+ch] = { n: +ch, x, y };
        if (ch === 'P') start = { x, y };
      }
    }
    // Floor colour under special cells: copy a neighbour
    const floorChar = cells.map((row) => row.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = cells[y][x];
      if ((ch >= '1' && ch <= '5') || ch === 'P') {
        const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => (cells[b] && cells[b][a]) || '').find((c) => c && !M.isSolid(c) && !(c >= '1' && c <= '5') && c !== 'P');
        floorChar[y][x] = nb || '.';
      }
    }
    Object.assign(map, { W, H, cells, floorChar, solid, stations, start, _ready: true });
    return map;
  };

  // ---------- Drawing the static map ----------
  function rr(ctx, x, y, w, h, r) { RH.Avatar.rr(ctx, x, y, w, h, r); }
  const shade = (c, a) => RH.Avatar.shade(c, a);

  function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

  function drawCell(ctx, map, x, y, ch) {
    const L = map.legend, S = CELL, px = x * S, py = y * S;
    const def = L[ch] || ['floor', '#ddd'];
    const type = def[0], col = def[1];
    const base = () => {
      // floor under furniture: use the most common walkable neighbour
      const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => map.floorChar[b] && map.floorChar[b][a]).find((c) => c && !M.isSolid(c));
      const fdef = L[nb] || ['floor', '#ddd'];
      drawFloor(ctx, fdef[0], fdef[1], px, py, x, y);
    };
    const R = (r) => hash(x + r * 31, y + r * 17);
    switch (type) {
      case 'wall':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = shade(col, 0.25); ctx.fillRect(px, py, S, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px, py + S - 4, S, 4);
        break;
      case 'shelf': case 'aisle': case 'toys': {
        base();
        ctx.fillStyle = col; rr(ctx, px + 2, py + 3, S - 4, S - 6, 4); ctx.fill();
        const cols = type === 'aisle' ? ['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#f78c6b'] : type === 'toys' ? ['#ef476f', '#118ab2', '#06d6a0', '#8338ec'] : ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#ffd166', '#8338ec'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[Math.floor(R(i) * cols.length)]; ctx.fillRect(px + 5 + i * 5.2, py + 7 + (type === 'aisle' ? (i % 2) * 2 : 0), 4, type === 'aisle' ? 10 : 12); }
        for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[Math.floor(R(i + 9) * cols.length)]; ctx.fillRect(px + 5 + i * 5.2, py + 22, 4, type === 'aisle' ? 9 : 12); }
        break;
      }
      case 'desk': case 'table':
        base();
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; rr(ctx, px + 4, py + 7, S - 6, S - 8, 6); ctx.fill();
        ctx.fillStyle = col; rr(ctx, px + 3, py + 4, S - 6, S - 9, 6); ctx.fill();
        ctx.fillStyle = shade(col, 0.2); ctx.fillRect(px + 6, py + 7, S - 12, 3);
        break;
      case 'stage':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px, py + i * 10 + 5); ctx.lineTo(px + S, py + i * 10 + 5); ctx.stroke(); }
        break;
      case 'bench':
        base();
        ctx.fillStyle = col; rr(ctx, px + 2, py + 12, S - 4, 16, 4); ctx.fill();
        ctx.fillStyle = shade(col, 0.25); ctx.fillRect(px + 4, py + 15, S - 8, 3);
        if (map.id === 'town') { ctx.fillStyle = '#8b5a35'; rr(ctx, px + 2, py + 12, S - 4, 14, 3); ctx.fill(); ctx.fillStyle = '#6b4226'; ctx.fillRect(px + 2, py + 17, S - 4, 2); }
        break;
      case 'counter': case 'checkout':
        base();
        ctx.fillStyle = col; ctx.fillRect(px, py + 4, S, S - 8);
        ctx.fillStyle = shade(col, 0.3); ctx.fillRect(px, py + 4, S, 6);
        if (type === 'checkout') { ctx.fillStyle = '#222'; ctx.fillRect(px + 8, py + 14, 24, 12); ctx.fillStyle = '#5ef'; ctx.fillRect(px + 10, py + 16, 10, 5); }
        break;
      case 'road':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        break;
      case 'zebra':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#f5f5f5'; for (let i = 0; i < 3; i++) ctx.fillRect(px + 4, py + 4 + i * 13, S - 8, 7);
        break;
      case 'hedge':
        drawFloor(ctx, 'grass', '#5ea84d', px, py, x, y);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px + 10, py + 22, 13, 0, 7); ctx.arc(px + 28, py + 20, 14, 0, 7); ctx.fill();
        ctx.fillStyle = shade(col, 0.2); ctx.beginPath(); ctx.arc(px + 24, py + 14, 6, 0, 7); ctx.fill();
        break;
      case 'tree':
        drawFloor(ctx, 'grass', '#62b04f', px, py, x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(px + 22, py + 30, 17, 8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px + 20, py + 18, 18, 0, 7); ctx.fill();
        ctx.fillStyle = shade(col, 0.25); ctx.beginPath(); ctx.arc(px + 14, py + 12, 7, 0, 7); ctx.fill();
        break;
      case 'flowers':
        drawFloor(ctx, 'grass', col, px, py, x, y);
        ctx.fillStyle = '#4b8b3b'; ctx.fillRect(px + 2, py + 2, S - 4, S - 4);
        ['#ff6fb5', '#ffd166', '#fff', '#ef476f'].forEach((c, i) => { for (let k = 0; k < 3; k++) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px + 6 + R(i * 3 + k) * 28, py + 6 + R(i * 3 + k + 50) * 28, 3, 0, 7); ctx.fill(); } });
        break;
      case 'plant':
        base();
        ctx.fillStyle = '#b5654a'; rr(ctx, px + 12, py + 22, 16, 13, 3); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px + 20, py + 16, 12, 0, 7); ctx.fill();
        ctx.fillStyle = shade(col, 0.25); ctx.beginPath(); ctx.arc(px + 16, py + 12, 5, 0, 7); ctx.fill();
        break;
      case 'gold':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = '#6b7178'; ctx.fillRect(px + 2, py + 2, S - 4, S - 4);
        ctx.fillStyle = '#f2c14e';
        for (let i = 0; i < 3; i++) { rr(ctx, px + 5 + i * 10, py + 22, 9, 10, 2); ctx.fill(); }
        for (let i = 0; i < 2; i++) { rr(ctx, px + 10 + i * 10, py + 12, 9, 10, 2); ctx.fill(); }
        break;
      case 'atm':
        ctx.fillStyle = '#7b6a58'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = col; rr(ctx, px + 4, py + 4, S - 8, S - 4, 4); ctx.fill();
        ctx.fillStyle = '#7fe0ff'; ctx.fillRect(px + 9, py + 9, S - 18, 10);
        ctx.fillStyle = '#ddd'; for (let i = 0; i < 3; i++) ctx.fillRect(px + 10 + i * 7, py + 24, 5, 4);
        break;
      case 'rails':
        base();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 2, py + 12); ctx.lineTo(px + S - 2, py + 12); ctx.stroke();
        ['#ff70a6', '#3a86ff', '#ffd166', '#8338ec', '#2a9d8f'].forEach((c, i) => { ctx.fillStyle = c; rr(ctx, px + 3 + i * 7, py + 12, 6, 20, 2); ctx.fill(); });
        break;
      case 'cctv':
        base();
        ctx.fillStyle = col; ctx.fillRect(px, py + 6, S, S - 10);
        ctx.fillStyle = '#5fe08a'; ctx.fillRect(px + 5, py + 10, 13, 10); ctx.fillRect(px + 22, py + 10, 13, 10);
        break;
      case 'fountain': case 'water':
        ctx.fillStyle = type === 'fountain' ? '#c9c1d6' : '#62b04f'; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = col; ctx.fillRect(px + (type === 'fountain' ? 2 : 0), py + (type === 'fountain' ? 2 : 0), S - (type === 'fountain' ? 4 : 0), S - (type === 'fountain' ? 4 : 0));
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px + 6, py + 14 + R(1) * 8); ctx.quadraticCurveTo(px + 14, py + 8, px + 22, py + 14); ctx.stroke();
        break;
      case 'carpark':
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; if (y % 2 === 1) ctx.fillRect(px, py + S - 2, S, 2); ctx.fillRect(px, py, 2, 18);
        break;
      case 'house': case 'shop': case 'postoffice': case 'clock': {
        ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
        if (type === 'house') { ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px, py + i * 10); ctx.lineTo(px + S, py + i * 10); ctx.stroke(); } }
        const roofTop = !map.cells[y - 1] || map.cells[y - 1][x] !== map.cells[y][x];
        if (roofTop) { ctx.fillStyle = type === 'house' ? '#5d4037' : type === 'shop' ? '#ffffff' : '#7a1f1f'; ctx.fillRect(px, py, S, 9); if (type === 'shop') { for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#e63946' : '#fff'; ctx.fillRect(px + i * 10, py, 10, 9); } } }
        if (type !== 'clock') { ctx.fillStyle = '#a8d8ff'; ctx.fillRect(px + 13, py + 16, 14, 12); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px + 13, py + 21, 14, 2); (map._windows = map._windows || []).push([px + 20, py + 22]); }
        break;
      }
      default:
        drawFloor(ctx, type, col, px, py, x, y);
    }
  }

  function drawFloor(ctx, type, col, px, py, x, y) {
    const S = CELL;
    ctx.fillStyle = col; ctx.fillRect(px, py, S, S);
    switch (type) {
      case 'wood':
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(px, py + 9, S, 1.5); ctx.fillRect(px, py + 19, S, 1.5); ctx.fillRect(px, py + 29, S, 1.5);
        ctx.fillRect(px + ((x * 13 + y * 7) % 30) + 4, py + 9, 1.5, 10); ctx.fillRect(px + ((x * 7 + y * 11) % 30) + 4, py + 19, 1.5, 10);
        break;
      case 'tile': case 'marble': case 'paving':
        ctx.strokeStyle = type === 'paving' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, S / 2, S / 2); ctx.strokeRect(px + S / 2 + 0.5, py + S / 2 + 0.5, S / 2 - 1, S / 2 - 1);
        break;
      case 'checker':
        ctx.fillStyle = 'rgba(30,40,80,0.12)'; ctx.fillRect(px, py, S / 2, S / 2); ctx.fillRect(px + S / 2, py + S / 2, S / 2, S / 2);
        break;
      case 'grass':
        ctx.fillStyle = 'rgba(0,60,0,0.12)';
        for (let i = 0; i < 3; i++) { const hx = hash(x + i, y * 3 + i); ctx.fillRect(px + hx * 34 + 2, py + hash(y + i, x) * 34 + 2, 2, 5); }
        break;
      case 'tarmac':
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(px + hash(x, y) * 30, py + hash(y, x) * 30, 3, 3);
        break;
      case 'carpet':
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; if ((x + y) % 2) ctx.fillRect(px, py, S, S);
        break;
      case 'steel':
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(px + 3, py + 3, 3, 3); ctx.fillRect(px + S - 6, py + S - 6, 3, 3);
        break;
      case 'sand':
        ctx.fillStyle = 'rgba(120,90,40,0.12)'; ctx.fillRect(px + hash(x, y) * 34, py + hash(y, x) * 34, 3, 3);
        break;
    }
  }

  // Renders the whole map to an off-screen canvas at R pixels per unit
  M.render = function (map, R) {
    M.prepare(map);
    map._windows = [];
    const c = document.createElement('canvas');
    c.width = Math.round(map.W * CELL * R); c.height = Math.round(map.H * CELL * R);
    const ctx = c.getContext('2d');
    ctx.scale(R, R);
    ctx.fillStyle = map.bg; ctx.fillRect(0, 0, map.W * CELL, map.H * CELL);
    for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) {
      const ch = map.cells[y][x];
      drawCell(ctx, map, x, y, (ch >= '1' && ch <= '5') || ch === 'P' ? map.floorChar[y][x] : ch);
    }
    // Road markings
    map.roads = [];
    for (let y = 0; y < map.H; y++) {
      if (map.cells[y][0] !== 'R' || (map.cells[y - 1] && map.cells[y - 1][0] === 'R')) continue;
      let b = y; while (map.cells[b + 1] && map.cells[b + 1][0] === 'R') b++;
      const mid = (y + b + 1) / 2;
      map.roads.push({ top: y, bottom: b + 1, mid });
      ctx.fillStyle = '#f2f2f2';
      for (let x = 6; x < map.W * CELL; x += 44) {
        const cx = Math.floor((x + 13) / CELL);
        if (map.cells[Math.floor(mid)][cx] === 'z' || map.cells[Math.floor(mid) - 1][cx] === 'z') continue;
        ctx.fillRect(x, mid * CELL - 2, 26, 4);
      }
    }
    // Decorations
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    (map.decor || []).forEach((d) => {
      if (Array.isArray(d)) {
        ctx.font = `${d[3] || 24}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.fillText(d[0], d[1] * CELL, d[2] * CELL);
      } else if (d.board) {
        const w = d.w * CELL, cx = d.c * CELL, cy = d.r * CELL;
        ctx.fillStyle = '#ffffff'; rr(ctx, cx - w / 2, cy - 13, w, 26, 4); ctx.fill();
        ctx.strokeStyle = '#9aa'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#2255aa'; ctx.font = 'bold 15px Fredoka, Arial, sans-serif'; ctx.fillText(d.board, cx, cy + 1);
      } else if (d.screen) {
        const cx = d.c * CELL, cy = d.r * CELL;
        ctx.fillStyle = '#fafafa'; rr(ctx, cx - 30, cy - 50, 60, 100, 3); ctx.fill();
        ctx.fillStyle = '#d0e4ff'; ctx.fillRect(cx - 24, cy - 44, 48, 88);
      }
    });
    // Room labels
    (map.labels || []).forEach(([t, lx, ly]) => {
      ctx.font = 'bold 15px Fredoka, Arial, sans-serif';
      const w = ctx.measureText(t).width + 16;
      ctx.fillStyle = 'rgba(20,24,48,0.72)'; rr(ctx, lx * CELL - w / 2, ly * CELL - 12, w, 24, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(t, lx * CELL, ly * CELL + 1);
    });
    return c;
  };
})(window.RH);
