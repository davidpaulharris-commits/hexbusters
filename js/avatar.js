/* Rush Hour – character options and drawing */
(function (RH) {
  'use strict';

  const A = RH.Avatar = {};

  A.SKIN = ['#FDE3CE', '#F3C9A0', '#E0AC69', '#C68642', '#8D5524', '#5C3A21'];
  A.HAIR_COLOURS = [
    { name: 'Black', c: '#231b17' }, { name: 'Dark brown', c: '#4a2c1d' }, { name: 'Brown', c: '#80502c' },
    { name: 'Blonde', c: '#e9c25b' }, { name: 'Ginger', c: '#c9611f' }, { name: 'Pink', c: '#ff6fb5' },
    { name: 'Blue', c: '#3e8bff' }, { name: 'Purple', c: '#8e5cf7' },
  ];
  A.CLOTH_COLOURS = ['#e63946', '#f4a261', '#ffd166', '#2a9d8f', '#3a86ff', '#8338ec', '#ff70a6', '#3b3b3b'];
  A.FACES = [
    { id: 'happy', name: 'Happy' }, { id: 'cheeky', name: 'Cheeky' }, { id: 'cool', name: 'Cool' },
    { id: 'sleepy', name: 'Sleepy' }, { id: 'surprised', name: 'Surprised' }, { id: 'grumpy', name: 'Grumpy' },
  ];
  A.HAIR = {
    boy: [{ id: 'short', name: 'Short' }, { id: 'spiky', name: 'Spiky' }, { id: 'curly', name: 'Curly' }, { id: 'quiff', name: 'Quiff' }, { id: 'buzz', name: 'Buzz cut' }],
    girl: [{ id: 'long', name: 'Long' }, { id: 'ponytail', name: 'Ponytail' }, { id: 'bunches', name: 'Bunches' }, { id: 'bob', name: 'Bob' }, { id: 'curls', name: 'Curly' }],
  };
  A.OUTFITS = {
    boy: [{ id: 'tee', name: 'T-shirt & shorts' }, { id: 'hoodie', name: 'Hoodie & jeans' }, { id: 'football', name: 'Football kit' }, { id: 'smart', name: 'Shirt & tie' }, { id: 'tracksuit', name: 'Tracksuit' }],
    girl: [{ id: 'dress', name: 'Dress' }, { id: 'skirt', name: 'Top & skirt' }, { id: 'hoodieg', name: 'Hoodie & leggings' }, { id: 'dungarees', name: 'Dungarees' }, { id: 'footballg', name: 'Football kit' }],
  };

  A.defaults = function (gender) {
    gender = gender || 'boy';
    return { gender, skin: A.SKIN[1], face: 'happy', hair: A.HAIR[gender][0].id, hairColour: A.HAIR_COLOURS[1].c, outfit: A.OUTFITS[gender][0].id, colour: A.CLOTH_COLOURS[4] };
  };
  A.random = function () {
    const g = Math.random() < 0.5 ? 'boy' : 'girl';
    return { gender: g, skin: RH.pick(A.SKIN), face: RH.pick(A.FACES).id, hair: RH.pick(A.HAIR[g]).id, hairColour: RH.pick(A.HAIR_COLOURS).c, outfit: RH.pick(A.OUTFITS[g]).id, colour: RH.pick(A.CLOTH_COLOURS) };
  };
  A.fix = function (av) {
    const d = A.defaults((av && av.gender) || 'boy');
    av = Object.assign({}, d, av || {});
    if (!A.HAIR[av.gender].some((x) => x.id === av.hair)) av.hair = d.hair;
    if (!A.OUTFITS[av.gender].some((x) => x.id === av.outfit)) av.outfit = d.outfit;
    return av;
  };

  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  A.shade = shade;

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  A.rr = rr;
  function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function ellipse(ctx, x, y, rx, ry, rot, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

  const OUT = {
    tee: { top: 'main', sleeve: 'short', bottom: 'shorts', bottomColour: '#2b3a67', shoes: '#f2f2f2' },
    hoodie: { top: 'main', sleeve: 'long', bottom: 'long', bottomColour: '#3d5a99', shoes: '#333333', hood: true },
    football: { top: 'main', sleeve: 'short', bottom: 'football', bottomColour: '#ffffff', shoes: '#222222', number: true },
    smart: { top: '#f4f4f4', sleeve: 'long', bottom: 'long', bottomColour: '#454a55', shoes: '#3a2a1a', tie: true },
    tracksuit: { top: 'main', sleeve: 'long', bottom: 'long', bottomColour: 'main', shoes: '#f2f2f2', stripes: true },
    dress: { top: 'main', sleeve: 'short', bottom: 'dress', bottomColour: 'main', shoes: 'dark' },
    skirt: { top: 'main', sleeve: 'short', bottom: 'skirt', bottomColour: 'darker', shoes: '#f2f2f2' },
    hoodieg: { top: 'main', sleeve: 'long', bottom: 'long', bottomColour: '#26262b', shoes: '#f2f2f2', hood: true },
    dungarees: { top: '#fafafa', sleeve: 'short', bottom: 'long', bottomColour: 'main', shoes: '#333333', bib: true },
    footballg: { top: 'main', sleeve: 'short', bottom: 'football', bottomColour: '#ffffff', shoes: '#222222', number: true },
  };

  // Draws a character with feet at (x, y). One unit = about 1px at scale 1 (character ~104 units tall).
  A.draw = function (ctx, av, x, y, s, o) {
    o = o || {};
    av = A.fix(av);
    const spec = OUT[av.outfit] || OUT.tee;
    const main = av.colour;
    const col = (c) => (c === 'main' ? main : c === 'darker' ? shade(main, -0.35) : c === 'dark' ? shade(main, -0.45) : c);
    const topC = col(spec.top), botC = col(spec.bottomColour), shoeC = col(spec.shoes);
    const skin = av.skin, skinD = shade(skin, -0.12);
    const moving = !!o.moving;
    const sw = moving ? Math.sin(o.walk || 0) : 0;
    const bob = moving ? -Math.abs(Math.sin(o.walk || 0)) * 2.5 : Math.sin(o.idle || 0) * 1.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (!o.noShadow) ellipse(ctx, 0, -1, 19, 5, 0, 'rgba(0,0,0,0.18)');
    ctx.translate(0, bob);

    // Legs
    const liftL = Math.max(0, sw) * 4, liftR = Math.max(0, -sw) * 4;
    [[-8, liftL], [8, liftR]].forEach(([lx, lift]) => {
      const top = -32, bottom = -6 - lift;
      const lxl = lx - 5.5, w = 11;
      if (spec.bottom === 'shorts') {
        ctx.fillStyle = skin; ctx.fillRect(lxl + 1, -22, w - 2, bottom + 22);
      } else if (spec.bottom === 'football') {
        ctx.fillStyle = skin; ctx.fillRect(lxl + 1, -22, w - 2, 8);
        ctx.fillStyle = main; ctx.fillRect(lxl + 0.5, -15, w - 1, bottom + 15);
        ctx.fillStyle = '#fff'; ctx.fillRect(lxl + 0.5, -15, w - 1, 2);
      } else if (spec.bottom === 'long') {
        ctx.fillStyle = botC; ctx.fillRect(lxl, top, w, bottom - top);
        if (spec.stripes) { ctx.fillStyle = '#fff'; ctx.fillRect(lx > 0 ? lxl + w - 2.5 : lxl, top, 2.5, bottom - top); }
      } else {
        ctx.fillStyle = skin; ctx.fillRect(lxl + 1, -26, w - 2, bottom + 26);
      }
      // shoe
      ctx.fillStyle = shoeC; rr(ctx, lxl - 1.5, bottom - 2, w + 3, 8, 3.5); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(lxl - 1, bottom + 4.5, w + 2, 1.5);
    });
    if (spec.bottom === 'shorts' || spec.bottom === 'football') {
      ctx.fillStyle = botC; rr(ctx, -15, -34, 30, 13, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-0.75, -28, 1.5, 7);
    }

    // Arms (behind body edges)
    const armSwing = sw * 0.35;
    [[-1, armSwing], [1, -armSwing]].forEach(([side, rot]) => {
      ctx.save();
      ctx.translate(side * 17, -54);
      ctx.rotate(rot * side * -1 + side * 0.12);
      const sleeveLen = spec.sleeve === 'long' ? 20 : 8;
      ctx.fillStyle = skin; rr(ctx, -4.5, 0, 9, 22, 4.5); ctx.fill();
      ctx.fillStyle = topC; rr(ctx, -5, -1, 10, sleeveLen + 1, 4.5); ctx.fill();
      if (spec.stripes) { ctx.fillStyle = '#fff'; ctx.fillRect(side > 0 ? 2.5 : -5, 0, 2.5, sleeveLen); }
      circle(ctx, 0, 22, 4.6, skin);
      ctx.restore();
    });

    // Body
    if (spec.bottom === 'dress') {
      ctx.fillStyle = topC;
      ctx.beginPath();
      ctx.moveTo(-15, -52); ctx.quadraticCurveTo(-15, -57, -9, -57); ctx.lineTo(9, -57); ctx.quadraticCurveTo(15, -57, 15, -52);
      ctx.lineTo(16, -40); ctx.lineTo(23, -20); ctx.quadraticCurveTo(0, -15, -23, -20); ctx.lineTo(-16, -40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(main, -0.2); ctx.fillRect(-16, -41, 32, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      [[-10, -28], [0, -25], [10, -28], [-5, -34], [6, -34]].forEach(([dx, dy]) => circle(ctx, dx, dy, 1.6, 'rgba(255,255,255,0.65)'));
    } else {
      ctx.fillStyle = topC; rr(ctx, -16, -58, 32, 28, 9); ctx.fill();
      ctx.fillRect(-16, -40, 32, 8);
    }
    if (spec.bottom === 'skirt') {
      ctx.fillStyle = botC;
      ctx.beginPath(); ctx.moveTo(-15, -34); ctx.lineTo(15, -34); ctx.lineTo(21, -20); ctx.quadraticCurveTo(0, -17, -21, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      [-9, 0, 9].forEach((dx) => ctx.fillRect(dx - 0.6, -32, 1.2, 12));
    }
    if (spec.bottom === 'long' && !spec.bib) { ctx.fillStyle = shade(botC, -0.15); ctx.fillRect(-16, -33, 32, 3); }
    if (spec.hood) {
      ctx.fillStyle = shade(main, -0.18); rr(ctx, -9, -43, 18, 8, 3); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-4, -57); ctx.lineTo(-5, -48); ctx.moveTo(4, -57); ctx.lineTo(5, -48); ctx.stroke();
    }
    if (spec.tie) {
      ctx.fillStyle = '#dcdcdc'; ctx.beginPath(); ctx.moveTo(-7, -58); ctx.lineTo(0, -52); ctx.lineTo(7, -58); ctx.closePath(); ctx.fill();
      ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(-2.5, -54); ctx.lineTo(2.5, -54); ctx.lineTo(3.5, -38); ctx.lineTo(0, -35); ctx.lineTo(-3.5, -38); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c4c4c4'; [-50, -44, -38].forEach((dy) => circle(ctx, 9, dy, 0.9, '#bbb'));
    }
    if (spec.stripes) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -57); ctx.lineTo(0, -33); ctx.stroke(); }
    if (spec.number) {
      ctx.fillStyle = '#fff'; ctx.fillRect(-16, -58, 32, 2.5);
      ctx.font = 'bold 13px Fredoka, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText('10', 0, -45);
    }
    if (spec.bib) {
      ctx.fillStyle = main;
      rr(ctx, -11, -47, 22, 16, 3); ctx.fill();
      ctx.fillRect(-16, -34, 32, 4);
      ctx.fillRect(-10, -58, 3.5, 12); ctx.fillRect(6.5, -58, 3.5, 12);
      circle(ctx, -8, -46, 1.6, '#ffd166'); circle(ctx, 8, -46, 1.6, '#ffd166');
      ctx.fillStyle = shade(main, -0.2); rr(ctx, -5, -43, 10, 7, 2); ctx.fill();
    }

    // Hair behind head
    drawHairBack(ctx, av);
    // Ears + head
    circle(ctx, -22, -77, 4.5, skinD); circle(ctx, 22, -77, 4.5, skinD);
    circle(ctx, 0, -78, 23, skin);
    // Face
    drawFace(ctx, o.face || av.face, skin);
    // Hair on top
    drawHairFront(ctx, av);

    ctx.restore();
  };

  function drawHairBack(ctx, av) {
    const c = av.hairColour, d = shade(c, -0.2);
    switch (av.hair) {
      case 'long': ctx.fillStyle = d; rr(ctx, -26, -98, 52, 60, 16); ctx.fill(); break;
      case 'bob': ctx.fillStyle = d; rr(ctx, -27, -98, 54, 36, 14); ctx.fill(); break;
      case 'ponytail':
        ellipse(ctx, 25, -72, 8, 18, -0.35, d);
        ellipse(ctx, 27, -60, 6, 10, -0.2, d);
        break;
      case 'bunches':
        circle(ctx, -28, -74, 11, c); circle(ctx, 28, -74, 11, c);
        circle(ctx, -27, -62, 8, d); circle(ctx, 27, -62, 8, d);
        circle(ctx, -22, -82, 3, '#ff4d8d'); circle(ctx, 22, -82, 3, '#ff4d8d');
        break;
      case 'curls':
        for (let a = 0; a < 12; a++) {
          const ang = Math.PI * 0.85 + (a / 11) * Math.PI * 1.3;
          circle(ctx, Math.cos(ang) * 25, -80 + Math.sin(ang) * 25, 9, d);
        }
        [[-25, -66], [25, -66], [-24, -55], [24, -55]].forEach(([x, y]) => circle(ctx, x, y, 8, d));
        break;
    }
  }

  function cap(ctx, c, fringeY, startA, endA, r) {
    r = r || 24.5;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, -78, r, Math.PI - (startA || 0.18), Math.PI * 2 + (endA || 0.18));
    ctx.lineTo(16, fringeY);
    ctx.quadraticCurveTo(10, fringeY + 3, 5, fringeY);
    ctx.quadraticCurveTo(0, fringeY + 3, -5, fringeY);
    ctx.quadraticCurveTo(-10, fringeY + 3, -16, fringeY);
    ctx.closePath();
    ctx.fill();
  }

  function drawHairFront(ctx, av) {
    const c = av.hairColour, l = shade(c, 0.2);
    switch (av.hair) {
      case 'short': cap(ctx, c, -88); break;
      case 'spiky':
        cap(ctx, c, -88);
        ctx.fillStyle = c;
        for (let i = 0; i < 7; i++) {
          const ang = Math.PI * 1.12 + (i / 6) * Math.PI * 0.76;
          const bx = Math.cos(ang) * 22, by = -78 + Math.sin(ang) * 22;
          const tx = Math.cos(ang) * 33, ty = -78 + Math.sin(ang) * 33;
          const px = -Math.sin(ang) * 6, py = Math.cos(ang) * 6;
          ctx.beginPath(); ctx.moveTo(bx - px, by - py); ctx.lineTo(tx, ty); ctx.lineTo(bx + px, by + py); ctx.closePath(); ctx.fill();
        }
        break;
      case 'curly':
        cap(ctx, c, -89);
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI * 1.02 + (i / 8) * Math.PI * 0.96;
          circle(ctx, Math.cos(ang) * 23, -78 + Math.sin(ang) * 23, 7.5, i % 2 ? c : l);
        }
        break;
      case 'quiff':
        cap(ctx, c, -90);
        ellipse(ctx, 5, -101, 16, 9, -0.25, c);
        ellipse(ctx, 8, -103, 8, 4, -0.25, l);
        break;
      case 'buzz':
        ctx.globalAlpha *= 0.8; cap(ctx, c, -93, 0.02, 0.02, 23.6); ctx.globalAlpha /= 0.8;
        break;
      case 'long':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, -78, 24.5, Math.PI - 0.5, Math.PI * 2 + 0.5);
        ctx.lineTo(18, -82); ctx.quadraticCurveTo(6, -92, -4, -96);
        ctx.quadraticCurveTo(-10, -86, -19, -80);
        ctx.closePath(); ctx.fill();
        break;
      case 'ponytail':
        cap(ctx, c, -93, 0.1, 0.1);
        circle(ctx, 19, -94, 3.5, '#ff4d8d');
        break;
      case 'bunches':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, -78, 24.5, Math.PI - 0.15, Math.PI * 2 + 0.15);
        ctx.lineTo(16, -87); ctx.quadraticCurveTo(6, -90, 0, -100); ctx.quadraticCurveTo(-6, -90, -16, -87);
        ctx.closePath(); ctx.fill();
        break;
      case 'bob':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, -78, 25, Math.PI - 0.35, Math.PI * 2 + 0.35);
        ctx.lineTo(18, -86); ctx.lineTo(-18, -86); ctx.closePath(); ctx.fill();
        break;
      case 'curls':
        cap(ctx, c, -89);
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI * 1.02 + (i / 8) * Math.PI * 0.96;
          circle(ctx, Math.cos(ang) * 23, -78 + Math.sin(ang) * 23, 7, i % 2 ? c : l);
        }
        break;
    }
  }

  function drawFace(ctx, face, skin) {
    const ink = '#2a1d1a';
    ctx.lineCap = 'round';
    const eye = (x, y, r) => circle(ctx, x, y, r || 3, ink);
    const shine = (x, y) => circle(ctx, x + 1, y - 1, 1, '#fff');
    const cheeks = () => { circle(ctx, -14, -70, 3.6, 'rgba(255,110,130,0.35)'); circle(ctx, 14, -70, 3.6, 'rgba(255,110,130,0.35)'); };
    ctx.strokeStyle = ink; ctx.lineWidth = 2.2;
    switch (face) {
      case 'cheeky':
        eye(-8, -78); shine(-8, -78);
        ctx.beginPath(); ctx.moveTo(4, -78); ctx.quadraticCurveTo(8, -82, 12, -78); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -71, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#ff5c7a'; ctx.beginPath(); ctx.arc(2, -64.5, 3.6, 0, Math.PI); ctx.fill();
        cheeks();
        break;
      case 'cool':
        ctx.fillStyle = '#111';
        rr(ctx, -16, -83, 13, 9, 3); ctx.fill(); rr(ctx, 3, -83, 13, 9, 3); ctx.fill();
        ctx.fillRect(-4, -81, 8, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-14, -82, 4, 2); ctx.fillRect(5, -82, 4, 2);
        ctx.beginPath(); ctx.moveTo(-5, -68); ctx.quadraticCurveTo(2, -64, 8, -69); ctx.stroke();
        break;
      case 'sleepy':
        ctx.beginPath(); ctx.moveTo(-12, -77); ctx.quadraticCurveTo(-8, -74, -4, -77); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -77); ctx.quadraticCurveTo(8, -74, 12, -77); ctx.stroke();
        ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(0, -67, 2.6, 3, 0, 0, Math.PI * 2); ctx.fill();
        cheeks();
        break;
      case 'surprised':
        circle(ctx, -8, -78, 4.6, '#fff'); circle(ctx, 8, -78, 4.6, '#fff');
        eye(-8, -78, 2.8); eye(8, -78, 2.8);
        ctx.beginPath(); ctx.moveTo(-12, -86); ctx.lineTo(-5, -88); ctx.moveTo(5, -88); ctx.lineTo(12, -86); ctx.stroke();
        ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(0, -67, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'grumpy':
        eye(-8, -77); eye(8, -77);
        ctx.beginPath(); ctx.moveTo(-13, -85); ctx.lineTo(-4, -82); ctx.moveTo(4, -82); ctx.lineTo(13, -85); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -62, 6, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke();
        break;
      case 'silly':
        circle(ctx, -8, -78, 4.6, '#fff'); circle(ctx, 8, -78, 4.6, '#fff');
        eye(-6, -77, 2.6); eye(6, -79, 2.6);
        ctx.beginPath(); ctx.arc(0, -71, 8, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#ff5c7a'; ctx.beginPath(); ctx.ellipse(0, -62, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d43b5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(0, -58); ctx.stroke();
        cheeks();
        break;
      default: // happy
        eye(-8, -78); eye(8, -78); shine(-8, -78); shine(8, -78);
        ctx.beginPath(); ctx.arc(0, -71, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        cheeks();
    }
  }

  // Render to an image (data URL), cached
  const cache = new Map();
  A.img = function (av, w, h, mode, face) {
    const key = JSON.stringify([av, w, h, mode, face]);
    if (cache.has(key)) return cache.get(key);
    const c = A.canvas(av, w, h, mode, face);
    const url = c.toDataURL('image/png');
    if (cache.size > 300) cache.clear();
    cache.set(key, url);
    return url;
  };
  A.canvas = function (av, w, h, mode, face) {
    const dpr = 2;
    const c = document.createElement('canvas');
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    if (mode === 'head') {
      const s = h / 62;
      A.draw(ctx, av, w / 2, h / 2 + 79 * s, s, { noShadow: true, face });
    } else {
      const s = h / 116;
      A.draw(ctx, av, w / 2, h - 4 * s, s, { face });
    }
    return c;
  };
  A.imgEl = function (av, w, h, mode, cls, face) {
    return RH.h('img', { src: A.img(av, w, h, mode, face), width: w, height: h, class: cls || '', alt: '' });
  };
})(window.RH);
