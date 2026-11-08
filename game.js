const $ = id => document.getElementById(id), rnd = (a, b) => a + Math.random() * (b - a);
const CNAME = c => ({ warlock: 'Spiritcaller', druid: 'Wildheart' }[c] || (c ? c[0].toUpperCase() + c.slice(1) : ''));
const R = new THREE.WebGLRenderer({ antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setSize(innerWidth, innerHeight);
R.domElement.className = 'main';
document.body.prepend(R.domElement);
const S = new THREE.Scene(), SKY = 0x87b8e8;
S.background = new THREE.Color(SKY);
S.fog = new THREE.Fog(SKY, 40, 170);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 400);
const hemi = new THREE.HemisphereLight(0xffffff, 0x3a5a2a, .95);
S.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0cc, .8);
sun.position.set(50, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
S.add(sun, sun.target);
R.shadowMap.enabled = true;
R.shadowMap.type = THREE.PCFSoftShadowMap;
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
const WORLD = 450, TOWN = 17, add = (m, x, y, z, p) => { m.position.set(x, y, z); (p || S).add(m); return m; };
const sway = [], clouds = [];
function tex(fn, rep) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); fn(g, 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; return t; }
function speck(g, w, base, cols, n, l) { g.fillStyle = base; g.fillRect(0, 0, w, w); for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillRect(Math.random() * w, Math.random() * w, rnd(1, 3), rnd(1, l));
} }
const grassT = tex((g, w) => speck(g, w, '#3f7a3a', ['#4d8c43', '#356b30', '#5a9a4a', '#2f5f2c'], 2500, 9), 90);
const stoneT = tex((g, w) => { speck(g, w, '#9a8a6a', ['#8a7a5a', '#aa9a7a'], 900, 3); g.strokeStyle = '#5f5238'; g.lineWidth = 3; for (let y = 0; y < w; y += 64) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
    for (let x = (y / 64 % 2) * 32; x < w; x += 64) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 64);
        g.stroke();
    }
} }, 6);
const wallT = tex((g, w) => { speck(g, w, '#c4b088', ['#b8a37a', '#d0bc94'], 800, 4); g.strokeStyle = '#5a3a1a'; g.lineWidth = 8; g.strokeRect(0, 0, w, w); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, w); g.stroke(); }, 1);
const roofT = tex((g, w) => { speck(g, w, '#8a3a2a', ['#7a3020', '#9a4a38'], 600, 3); g.strokeStyle = '#4a1a10'; g.lineWidth = 3; for (let y = 0; y < w; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
} }, 3);
const leafT = tex((g, w) => speck(g, w, '#1f5a2a', ['#2a6e34', '#17481f', '#35803e'], 2000, 6), 2);
const barkT = tex((g, w) => speck(g, w, '#5a3a1a', ['#4a2e14', '#6a4824'], 1500, 40), 1);
const rockT = tex((g, w) => speck(g, w, '#777777', ['#666666', '#888888', '#999999'], 1800, 5), 1);
const fur = tex((g, w) => speck(g, w, '#dddddd', ['#bbbbbb', '#ffffff', '#999999'], 2200, 6), 1);
const TM = t => new THREE.MeshLambertMaterial({ map: t }), barkM = TM(barkT), leafM = TM(leafT);
// ground & town
// ===== World zones =====
const R0 = 95, PI = Math.PI;
const ZONES = [
    { n: 'Emberwood Meadow', e: '🌿', c: '#8be07a', lv: '1-3', col: 0x4b9a44, sky: 0x87b8e8, fn: 40, ff: 170, hi: .95, si: .8, mm: '#2d5a2b' },
    { n: 'Frostpeak Tundra', e: '❄️', c: '#bfe6ff', lv: '4-15', col: 0xe6f0f8, sky: 0xcfe0ee, fn: 22, ff: 115, hi: 1.05, si: .6, mm: '#c9d8e4' },
    { n: 'Ashen Dunes', e: '🏜️', c: '#ffd27a', lv: '4-15', col: 0xdcb86e, sky: 0xf2d9a2, fn: 60, ff: 240, hi: 1.1, si: 1.05, mm: '#c9a55c' },
    { n: 'Amberfall Forest', e: '🍂', c: '#ffa94d', lv: '4-15', col: 0xb8742e, sky: 0xe6b27a, fn: 30, ff: 150, hi: .9, si: .7, mm: '#8a5522' },
    { n: 'Stormveil Fen', e: '🌧️', c: '#9fc4e8', lv: '4-15', col: 0x3f6a58, sky: 0x66727e, fn: 16, ff: 100, hi: .7, si: .3, mm: '#2c4a40' }
];
function zoneAt(x, z) {
    const d = Math.hypot(x, z);
    if (d < R0)
        return 0;
    const a = Math.atan2(z, x);
    if (a >= -PI / 4 && a < PI / 4)
        return 2;
    if (a >= PI / 4 && a < 3 * PI / 4)
        return 3;
    if (a >= -3 * PI / 4 && a < -PI / 4)
        return 1;
    return 4;
}
const ZSAMP = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
function zoneW(x, z, r) {
    const w = [0, 0, 0, 0, 0];
    ZSAMP.forEach(([a, b]) => { w[zoneAt(x + a * r, z + b * r)] += 1 / 9; });
    return w;
}
const detailT = tex((g, w) => speck(g, w, '#d2d2d2', ['#ececec', '#b4b4b4', '#f6f6f6', '#9c9c9c'], 2600, 9), 200);
const gGeo = new THREE.PlaneGeometry(WORLD * 2.2, WORLD * 2.2, 220, 220), gp = gGeo.attributes.position, gcol = new Float32Array(gp.count * 3);
for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = -gp.getY(i), w = zoneW(x, z, 10);
    let r = 0, g = 0, b = 0;
    w.forEach((v, k) => { if (v) {
        const c = ZONES[k].col;
        r += ((c >> 16) & 255) / 255 * v;
        g += ((c >> 8) & 255) / 255 * v;
        b += (c & 255) / 255 * v;
    } });
    const n = .92 + Math.random() * .16;
    gcol[i * 3] = r * n;
    gcol[i * 3 + 1] = g * n;
    gcol[i * 3 + 2] = b * n;
}
gGeo.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
// ===== The Pit: a sunken PvP arena in the starting meadow =====
const ARENA = { x: 52, z: 40, R: 30, F: 18, D: 4.5 };
// Jump Challenge course, just north-west of The Pit
const JC = { x: 16, z: 76, R: 19 };
function groundH(x, z) {
    const d = Math.hypot(x - ARENA.x, z - ARENA.z);
    if (d >= ARENA.R)
        return 0;
    if (d <= ARENA.F)
        return -ARENA.D;
    const t = (ARENA.R - d) / (ARENA.R - ARENA.F);
    return -ARENA.D * t * t * (3 - 2 * t);
}
{
    // cut a hole in the ground where the pit goes
    const ia = gGeo.index.array, keep = [];
    for (let i = 0; i < ia.length; i += 3) {
        let inside = false;
        for (let k = 0; k < 3; k++) {
            const v = ia[i + k];
            if (Math.hypot(gp.getX(v) - ARENA.x, -gp.getY(v) - ARENA.z) < ARENA.R) {
                inside = true;
                break;
            }
        }
        if (!inside)
            keep.push(ia[i], ia[i + 1], ia[i + 2]);
    }
    gGeo.setIndex(keep);
}
const ground = add(new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ map: detailT, vertexColors: true })), 0, 0, 0);
const pitFlames = [];
(function buildPit() {
    const NR = 36, NS = 72, RO = 37, pos = [], col = [], uv = [], idx = [], cm = c => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    const cG = cm(0x4b9a44), cS = cm(0x8a6a44), cF = cm(0xcdb078);
    for (let i = 0; i <= NR; i++) {
        const r = RO * i / NR;
        for (let j = 0; j <= NS; j++) {
            const a = j / NS * Math.PI * 2, x = ARENA.x + Math.cos(a) * r, z = ARENA.z + Math.sin(a) * r;
            pos.push(x, groundH(x, z) + .03, z);
            const tS = Math.min(1, Math.max(0, (ARENA.R + 2 - r) / 4)), tF = Math.min(1, Math.max(0, (ARENA.F + 3 - r) / 5)), n = .92 + Math.random() * .16;
            const c = [0, 1, 2].map(k => (cG[k] * (1 - tS) + cS[k] * tS) * (1 - tF) + cF[k] * tF);
            col.push(c[0] * n, c[1] * n, c[2] * n);
            uv.push((x + WORLD * 1.1) / (WORLD * 2.2), (WORLD * 1.1 - z) / (WORLD * 2.2));
        }
    }
    for (let i = 0; i < NR; i++)
        for (let j = 0; j < NS; j++) {
            const a = i * (NS + 1) + j, b = a + NS + 1;
            idx.push(a, a + 1, b, b, a + 1, b + 1);
        }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const bowl = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: detailT, vertexColors: true, side: 2 }));
    bowl.receiveShadow = true;
    S.add(bowl);
    const flat = (g, y, mat) => { const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.set(ARENA.x, y, ARENA.z); S.add(m); return m; };
    const floorY = -ARENA.D + .07;
    flat(new THREE.RingGeometry(ARENA.F - 1.4, ARENA.F, 64), floorY, TM(stoneT));
    flat(new THREE.RingGeometry(10, 10.5, 64), floorY, new THREE.MeshBasicMaterial({ color: 0xe8b84a, side: 2, transparent: true, opacity: .8 }));
    flat(new THREE.RingGeometry(3.2, 3.6, 48), floorY, new THREE.MeshBasicMaterial({ color: 0xcc2222, side: 2, transparent: true, opacity: .85 }));
    [0, Math.PI / 2].forEach(a => { const m = flat(new THREE.PlaneGeometry(14, .5), floorY, new THREE.MeshBasicMaterial({ color: 0x8a1a1a, side: 2, transparent: true, opacity: .8 })); m.rotation.z = a; });
    flat(new THREE.RingGeometry(ARENA.R, ARENA.R + 2.2, 64), .07, TM(stoneT));
    for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, rr = ARENA.R + 1.6, x = ARENA.x + Math.cos(a) * rr, z = ARENA.z + Math.sin(a) * rr;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, 6, 10), TM(stoneT));
        p.position.set(x, 3, z);
        p.castShadow = true;
        S.add(p);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.5, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
        fl.position.set(x, 6.8, z);
        S.add(fl);
        pitFlames.push(fl);
        const bn2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.2), new THREE.MeshLambertMaterial({ color: i % 2 ? 0x9a1a1a : 0x2a2a3a, side: 2 }));
        bn2.position.set(x - Math.cos(a) * 1.15, 4.2, z - Math.sin(a) * 1.15);
        bn2.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
        S.add(bn2);
    }
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const g = cv.getContext('2d');
    g.font = 'bold 54px Georgia';
    g.textAlign = 'center';
    g.lineWidth = 8;
    g.strokeStyle = '#000';
    g.strokeText('⚔ THE PIT ⚔', 256, 62);
    g.fillStyle = '#ff6b6b';
    g.fillText('⚔ THE PIT ⚔', 256, 62);
    g.font = 'bold 30px Georgia';
    g.strokeText('PvP arena — enter at your own risk', 256, 108);
    g.fillStyle = '#ffe0a0';
    g.fillText('PvP arena — enter at your own risk', 256, 108);
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
    sign.scale.set(15, 3.75, 1);
    sign.position.set(ARENA.x - .79 * 35, 9, ARENA.z - .61 * 35);
    S.add(sign);
})();

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
add(new THREE.Mesh(new THREE.CylinderGeometry(TOWN, TOWN, .2, 40), TM(stoneT)), 0, .1, 0).receiveShadow = true;
[[-10, -9], [10, -9], [-11, 8], [11, 9]].forEach(([x, z]) => { add(new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), TM(wallT)), x, 2, z); add(new THREE.Mesh(new THREE.ConeGeometry(5, 3, 4), TM(roofT)), x, 5.5, z).rotation.y = Math.PI / 4; });
// ----- zone-specific scenery (instanced) -----
const leafN = tex((g, w) => speck(g, w, '#d8d8d8', ['#ffffff', '#b0b0b0', '#ececec'], 2000, 6), 2);
const barkN = tex((g, w) => speck(g, w, '#9a9a9a', ['#808080', '#b4b4b4'], 1500, 40), 1);
const rockN = tex((g, w) => speck(g, w, '#bdbdbd', ['#a0a0a0', '#d4d4d4', '#e6e6e6'], 1800, 5), 1);
const leafNM = TM(leafN), barkNM = TM(barkN), rockNM = TM(rockN), tuftM = new THREE.MeshLambertMaterial({ color: 0xffffff });
const pick = a => a[Math.floor(Math.random() * a.length)];
function pt(zi, minD) {
    for (let k = 0; k < 60; k++) {
        let x, z;
        if (zi === 0) {
            const a = rnd(0, 6.283), d = rnd(minD, R0 - 2);
            x = Math.cos(a) * d;
            z = Math.sin(a) * d;
            if (Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.R + 6)
                continue;
            if (Math.hypot(x - JC.x, z - JC.z) < JC.R)
                continue;
        }
        else {
            x = rnd(-WORLD + 6, WORLD - 6);
            z = rnd(-WORLD + 6, WORLD - 6);
            if (zoneAt(x, z) !== zi)
                continue;
        }
        return [x, z];
    }
    return null;
}
function inst(geo, mat, items) {
    const im = new THREE.InstancedMesh(geo, mat, items.length), o = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
        o.position.set(it.x, it.y, it.z);
        o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        o.scale.set(it.sx, it.sy, it.sz);
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
        if (it.col != null)
            im.setColorAt(i, c.setHex(it.col));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor)
        im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    S.add(im);
    return im;
}
const GREENS = [0x2a6e34, 0x1f5a2a, 0x35803e], AUT = [0xd2691e, 0xe8a317, 0xb83a1a, 0xc98a1a, 0x8a4a1a], SNOWC = [0xe8f2f8, 0xcfe6ee, 0x9fc4b4], FEN = [0x2f5a4a, 0x3a6a52, 0x264a40];
const gCone = new THREE.ConeGeometry(1, 1, 7), gBall = new THREE.SphereGeometry(1, 8, 6), gTrunk = new THREE.CylinderGeometry(.3, .4, 1, 6), gRock = new THREE.DodecahedronGeometry(1);
function forest(zi, n, kind, cols) {
    const T = [], C = [];
    for (let i = 0; i < n; i++) {
        const p = pt(zi, TOWN + 4);
        if (!p)
            continue;
        const h = rnd(3, 7) * (kind == 'oak' ? 1.2 : 1), col = pick(cols);
        T.push({ x: p[0], y: h * .2, z: p[1], sx: 1, sy: h * .4, sz: 1, col: 0x6a4a2a });
        if (kind == 'pine')
            C.push({ x: p[0], y: h * .9, z: p[1], sx: h * .45, sy: h, sz: h * .45, col });
        else
            C.push({ x: p[0], y: h * .85, z: p[1], sx: h * .55, sy: h * .45, sz: h * .55, col, ry: rnd(0, 6) });
    }
    inst(gTrunk, barkNM, T);
    inst(kind == 'pine' ? gCone : gBall, leafNM, C);
}
forest(0, 130, 'pine', GREENS);
forest(3, 520, 'oak', AUT);
forest(1, 400, 'pine', SNOWC);
forest(4, 300, 'pine', FEN);
{
    const B = [], A = [];
    for (let i = 0; i < 170; i++) {
        const p = pt(2, 0);
        if (!p)
            continue;
        const h = rnd(2.5, 6);
        B.push({ x: p[0], y: h / 2, z: p[1], sx: 1.6, sy: h, sz: 1.6, col: 0x5a8a3a });
        A.push({ x: p[0] + .8, y: h * .6, z: p[1], sx: 1.1, sy: h * .35, sz: 1.1, col: 0x5a8a3a }, { x: p[0] - .8, y: h * .45, z: p[1], sx: 1.1, sy: h * .3, sz: 1.1, col: 0x5a8a3a });
    }
    inst(gTrunk, leafNM, B);
    inst(gTrunk, leafNM, A);
}
function rocks(zi, n, cols) {
    const R = [];
    for (let i = 0; i < n; i++) {
        const p = pt(zi, TOWN + 3);
        if (!p)
            continue;
        const s = rnd(.5, 1.7);
        R.push({ x: p[0], y: s * .4, z: p[1], sx: s, sy: s * .8, sz: s, col: pick(cols), ry: rnd(0, 6) });
    }
    inst(gRock, rockNM, R);
}
rocks(0, 40, [0x777777, 0x888888]);
rocks(1, 120, [0xaac4d6, 0xd4e4ee, 0x8aa6b8]);
rocks(2, 140, [0xc9a05a, 0xb8884a, 0xd8b878]);
rocks(3, 90, [0x8a6a4a, 0x6a5a4a]);
rocks(4, 120, [0x5a6a64, 0x4a5a56]);
function tufts(zi, n, cols, geo, y) {
    const R = [];
    for (let i = 0; i < n; i++) {
        const p = pt(zi, TOWN + 1);
        if (!p)
            continue;
        R.push({ x: p[0], y: y || .3, z: p[1], sx: rnd(.7, 1.6), sy: rnd(.7, 1.6), sz: rnd(.7, 1.6), col: pick(cols), rx: rnd(-.2, .2), ry: rnd(0, 6), rz: rnd(-.2, .2) });
    }
    inst(geo, tuftM, R);
}
const gTuft = new THREE.ConeGeometry(.12, .7, 4), gReed = new THREE.ConeGeometry(.1, 1.4, 4), gSnow = new THREE.SphereGeometry(.5, 6, 4);
tufts(0, 2200, [0x5fae4a, 0x4e9a3e], gTuft);
tufts(3, 2600, [0xd9892b, 0xe8b23a, 0xb5651d], gTuft);
tufts(4, 2200, [0x3f7a5a, 0x4a8a64, 0x2e5a48], gReed, .6);
tufts(2, 800, [0xc9b06a, 0xb8964a], gTuft);
tufts(1, 900, [0xffffff, 0xdbe9f2], gSnow, .1);
for (let i = 0; i < 26; i++) {
    const c = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
    for (let k = 0; k < 4; k++)
        add(new THREE.Mesh(new THREE.SphereGeometry(rnd(5, 9), 8, 6), m), k * 7 - 10, rnd(-1, 2), rnd(-3, 3), c);
    c.position.set(rnd(-WORLD, WORLD), rnd(55, 75), rnd(-WORLD, WORLD));
    c.scale.y = .5;
    S.add(c);
    clouds.push(c);
}
// ----- landmarks -----
add(new THREE.Mesh(new THREE.ConeGeometry(32, 38, 4), M(0xcfa86a)), 330, 19, -40).rotation.y = PI / 4;
add(new THREE.Mesh(new THREE.ConeGeometry(14, 16, 4), M(0xc49a5a)), 380, 8, 40).rotation.y = PI / 4;
{
    const o = new THREE.Mesh(new THREE.CircleGeometry(13, 24), new THREE.MeshLambertMaterial({ color: 0x3a9ad0 }));
    o.rotation.x = -PI / 2;
    o.position.set(250, .12, 70);
    S.add(o);
    for (let i = 0; i < 6; i++) {
        const a = i * 1.05, px = 250 + Math.cos(a) * 15, pz = 70 + Math.sin(a) * 15;
        add(new THREE.Mesh(new THREE.CylinderGeometry(.25, .4, 6, 6), M(0x8a6a3a)), px, 3, pz);
        add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 7), M(0x3f8a3a)), px, 6.4, pz);
    }
}
{
    const o = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshLambertMaterial({ color: 0xa8d8f0 }));
    o.rotation.x = -PI / 2;
    o.position.set(60, .12, -260);
    S.add(o);
    for (let i = 0; i < 9; i++)
        add(new THREE.Mesh(new THREE.ConeGeometry(rnd(2, 4), rnd(10, 22), 5), new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: .85 })), -90 + rnd(-25, 25), 7, -330 + rnd(-25, 25));
}
add(new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 24, 10), M(0x5a3a1a)), -30, 12, 330);
add(new THREE.Mesh(new THREE.SphereGeometry(19, 12, 9), M(0xe07a1a)), -30, 32, 330).scale.y = .7;
{
    const P2 = [];
    for (let i = 0; i < 40; i++) {
        const s = rnd(.6, 1.1);
        P2.push({ x: 30 + rnd(-22, 22), y: s * .6, z: 300 + rnd(-22, 22), sx: s, sy: s * .8, sz: s, col: pick([0xe8761a, 0xf08a24, 0xd96a12]) });
    }
    inst(new THREE.SphereGeometry(.8, 8, 6), tuftM, P2);
}
for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.28, px = -300 + Math.cos(a) * 9, pz = 40 + Math.sin(a) * 9, h = rnd(4, 8);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, h, 10), TM(stoneT)), px, h / 2, pz);
}
[[-260, -60, 10], [-340, 120, 14], [-200, 150, 9]].forEach(([x, z, r]) => {
    const o = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshLambertMaterial({ color: 0x2a4a58 }));
    o.rotation.x = -PI / 2;
    o.position.set(x, .12, z);
    S.add(o);
});
// ----- weather (rain, snow, sand, leaves) -----
function mkWx(kind, n, color, size, cols) {
    const g = new THREE.BufferGeometry(), r = kind == 'rain' ? 6 : 3, pos = new Float32Array(n * r);
    for (let i = 0; i < n; i++) {
        const x = rnd(-40, 40), y = rnd(0, 30), z = rnd(-40, 40);
        pos[i * r] = x;
        pos[i * r + 1] = y;
        pos[i * r + 2] = z;
        if (kind == 'rain') {
            pos[i * r + 3] = x + .2;
            pos[i * r + 4] = y + .9;
            pos[i * r + 5] = z;
        }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    let m;
    if (kind == 'rain')
        m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .5 });
    else {
        if (cols) {
            const ca = new Float32Array(n * 3), c = new THREE.Color();
            for (let i = 0; i < n; i++) {
                c.setHex(pick(cols));
                ca[i * 3] = c.r;
                ca[i * 3 + 1] = c.g;
                ca[i * 3 + 2] = c.b;
            }
            g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
        }
        m = new THREE.PointsMaterial({ color: cols ? 0xffffff : color, size, transparent: true, opacity: .9, depthWrite: false, vertexColors: !!cols });
    }
    const o = kind == 'rain' ? new THREE.LineSegments(g, m) : new THREE.Points(g, m);
    o.frustumCulled = false;
    o.visible = false;
    S.add(o);
    return { o, g, pos, n, r, kind };
}
const WX = { rain: mkWx('rain', 900, 0xaecbe8), snow: mkWx('snow', 1100, 0xffffff, .35), sand: mkWx('sand', 500, 0xe6c88a, .18), leaf: mkWx('leaf', 450, 0xd2691e, .5, [0xd2691e, 0xe8a317, 0xb83a1a, 0xc98a1a]) };
const WXC = { rain: { i: 4, fall: 30, dx: -4 }, snow: { i: 1, fall: 3, dx: 1.2 }, sand: { i: 2, fall: -.3, dx: 14 }, leaf: { i: 3, fall: 2.2, dx: 2 } };
function wxTick(dt, t, w) {
    for (const k in WX) {
        const s = WX[k], c = WXC[k], wt = G.on ? 0 : w[c.i];
        s.o.visible = wt > .04;
        if (!s.o.visible)
            continue;
        s.o.material.opacity = Math.min(1, wt * 1.4) * (k == 'rain' ? .55 : .9);
        const p = s.pos, r = s.r, px = P.pos.x, pz = P.pos.z, py = P.pos.y - 1;
        for (let i = 0; i < s.n; i++) {
            const j = i * r;
            let x = p[j], y = p[j + 1], z = p[j + 2];
            y -= c.fall * dt;
            x += (c.dx + (k == 'leaf' || k == 'snow' ? Math.sin(t * 1.5 + i) * 1.5 : 0)) * dt;
            x = px + (((x - px + 40) % 80) + 80) % 80 - 40;
            z = pz + (((z - pz + 40) % 80) + 80) % 80 - 40;
            y = py + (((y - py) % 30) + 30) % 30;
            p[j] = x;
            p[j + 1] = y;
            p[j + 2] = z;
            if (k == 'rain') {
                p[j + 3] = x + .2;
                p[j + 4] = y + .9;
                p[j + 5] = z;
            }
        }
        s.g.attributes.position.needsUpdate = true;
    }
}
// ----- zone tracking, sky/fog/light blending, lightning -----
const SKYC = ZONES.map(z => new THREE.Color(z.sky)), tmpC = new THREE.Color(), flEl = document.createElement('div');
flEl.style.cssText = 'position:fixed;inset:0;background:#dfe8ff;opacity:0;pointer-events:none;z-index:2;transition:opacity .25s';
document.body.appendChild(flEl);
let zoneNow = 0, zoneSeen = new Set([0]), zoneT = 0, flashT = 8;
function zoneTick(dt, t) {
    const w = G.on || DG.on ? [1, 0, 0, 0, 0] : zoneW(P.pos.x, P.pos.z, 16);
    tmpC.setRGB(0, 0, 0);
    let fn = 0, ff = 0, hi = 0, si = 0;
    w.forEach((v, k) => { if (!v)
        return; const c = SKYC[k]; tmpC.r += c.r * v; tmpC.g += c.g * v; tmpC.b += c.b * v; fn += ZONES[k].fn * v; ff += ZONES[k].ff * v; hi += ZONES[k].hi * v; si += ZONES[k].si * v; });
    if (DG.on) {
        tmpC.setHex(0x0b0810);
        fn = 6;
        ff = 70;
        hi = .5;
        si = .2;
    }
    const a = Math.min(1, dt * 1.5);
    S.background.lerp(tmpC, a);
    S.fog.color.copy(S.background);
    S.fog.near += (fn - S.fog.near) * a;
    S.fog.far += (ff - S.fog.far) * a;
    hemi.intensity += (hi - hemi.intensity) * a;
    sun.intensity += (si - sun.intensity) * a;
    wxTick(dt, t, w);
    if (w[4] > .6) {
        flashT -= dt;
        if (flashT <= 0) {
            flashT = rnd(7, 16);
            flEl.style.opacity = .55;
            setTimeout(() => { flEl.style.opacity = 0; }, 90);
            if (Math.random() < .6)
                setTimeout(() => { flEl.style.opacity = .4; setTimeout(() => { flEl.style.opacity = 0; }, 80); }, 220);
        }
    }
    if (G.on || DU || DG.on)
        return;
    const z = zoneAt(P.pos.x, P.pos.z);
    if (z !== zoneNow) {
        zoneT += dt;
        if (zoneT > .8) {
            zoneNow = z;
            zoneT = 0;
            const Zo = ZONES[z];
            bn(Zo.e + ' ' + Zo.n, 2600);
            say('<span style="color:' + Zo.c + '">Entering ' + Zo.n + ' — monsters Lv ' + Zo.lv + '</span>');
            if (!zoneSeen.has(z)) {
                zoneSeen.add(z);
                const xp = 60 * P.lvl + 40;
                addXP(xp);
                say('<b style="color:#ffe066">New zone discovered! +' + xp + ' xp</b>');
            }
        }
    }
    else
        zoneT = 0;
}
const fire = add(new THREE.Mesh(new THREE.ConeGeometry(.6, 1.6, 7), new THREE.MeshBasicMaterial({ color: 0xff8a1f })), -5, .9, 0), fl = new THREE.PointLight(0xff8833, 1.2, 25);
fl.position.set(-5, 2, 0);
S.add(fl);
for (let i = 0; i < 6; i++)
    add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.6, 5), M(0x4a2e14)), -5 + Math.cos(i) * .8, .2, Math.sin(i) * .8).rotation.z = 1.2;
// NPC
const npc = new THREE.Group();
add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 1.8, 10), M(0xe8d070)), 0, .9, 0, npc);
add(new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), M(0xf0c8a0)), 0, 2.1, 0, npc);
const mark = add(new THREE.Mesh(new THREE.OctahedronGeometry(.4), new THREE.MeshBasicMaterial({ color: 0xffdd33 })), 0, 3.4, 0, npc);
npc.position.set(0, 0, 5);
S.add(npc);
// hero
// ===== Rogue: two ornate daggers =====
function mkDagger() {
    const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial(c), B = c => new THREE.MeshBasicMaterial({ color: c });
    const steel = L({ color: 0xe6edf5, emissive: 0x12303a }), dark = L({ color: 0x9aa8b8, emissive: 0x0a1a22 }), gold = L({ color: 0xe8b84a, emissive: 0x3a2a08 }), leather = L({ color: 0x2a1a22 }), gem = B(0xb05aff), glow = B(0x66ffcc);
    const sh = new THREE.Shape();
    sh.moveTo(-.075, 0);
    sh.lineTo(-.085, .5);
    sh.quadraticCurveTo(-.06, .85, 0, 1.0);
    sh.quadraticCurveTo(.06, .85, .085, .5);
    sh.lineTo(.075, 0);
    sh.lineTo(-.075, 0);
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1 }), steel);
    blade.position.set(0, .18, -.015);
    g.add(blade);
    add(new THREE.Mesh(new THREE.BoxGeometry(.022, .62, .05), dark), 0, .55, 0, g);
    add(new THREE.Mesh(new THREE.BoxGeometry(.012, .5, .052), glow), 0, .56, 0, g);
    add(new THREE.Mesh(new THREE.BoxGeometry(.4, .07, .1), gold), 0, .17, 0, g);
    [-1, 1].forEach(s => { add(new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 5), gold), s * .22, .21, 0, g).rotation.z = -s * .6; });
    add(new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), gem), 0, .17, .055, g);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .3, 8), leather), 0, 0, 0, g);
    for (let i = 0; i < 3; i++)
        add(new THREE.Mesh(new THREE.TorusGeometry(.05, .01, 5, 10), gold), 0, -.08 + i * .08, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), gold), 0, -.19, 0, g);
    add(new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), gem), 0, -.19, .05, g);
    return g;
}
function buildDaggers(g, w) {
    w.visible = false;
    if (g.rarm)
        g.rarm.visible = false;
    const skin = new THREE.MeshLambertMaterial({ color: 0x2a1a22 }), armM = M(g.col);
    const mkArm = sd => {
        const piv = new THREE.Group(), inn = new THREE.Group();
        inn.rotation.x = -.9;
        piv.add(inn);
        add(new THREE.Mesh(new THREE.BoxGeometry(.24, .85, .24), armM), 0, -.42, 0, inn);
        add(new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), skin), 0, -.88, 0, inn);
        const d = mkDagger();
        d.scale.setScalar(.85);
        d.position.set(0, -.88, .02);
        d.rotation.x = 1.9;
        d.rotation.z = -sd * .12;
        inn.add(d);
        return piv;
    };
    const ra = mkArm(1);
    ra.position.set(.75, 1.7, 0);
    g.add(ra);
    g.arm.children.forEach(o => { o.visible = false; });
    const la = mkArm(-1);
    g.arm.add(la);
    g.ra = ra;
    // X-slash: both daggers wind up overhead, then cut down and across so the blades cross in an X
    const xm = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0, depthWrite: false, side: 2 }), xf = new THREE.Group();
    xf.position.set(0, 1.55, 1.15);
    [-1, 1].forEach(q => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .09), xm); b.rotation.z = q * PI / 4; xf.add(b); });
    xf.visible = false;
    g.add(xf);
    g.xSlash = sw => {
        if (!(sw > 0)) {
            ra.rotation.set(0, 0, 0);
            la.rotation.set(0, 0, 0);
            ra.position.z = 0;
            la.position.z = 0;
            xf.visible = false;
            return;
        }
        const u = 1 - sw / .3, ez = k => k * k * (3 - 2 * k);
        let rx, rz;
        if (u < .3) {
            const k = ez(u / .3);
            rx = -1.6 * k;
            rz = .55 * k;
        }
        else if (u < .7) {
            const k = ez((u - .3) / .4);
            rx = -1.6 + 2.1 * k;
            rz = .55 - 1.5 * k;
        }
        else {
            const k = ez((u - .7) / .3);
            rx = .5 * (1 - k);
            rz = -.95 * (1 - k);
        }
        g.arm.rotation.x = 0;
        ra.rotation.set(rx + .08, rz, rz * .3);
        la.rotation.set(rx - .08, -rz, -rz * .3);
        ra.position.z = .1 * Math.max(0, -rz);
        la.position.z = -.05 * Math.max(0, -rz);
        // flash a silver X in front when the blades cross
        const f = u > .45 && u < .95 ? Math.sin((u - .45) / .5 * PI) : 0;
        xf.visible = f > .02;
        xm.opacity = f * .85;
        xf.scale.setScalar(.7 + .5 * f);
    };
    g.w = { rotation: { set x(v) { ra.rotation.x = -v * .55; ra.position.z = -v * .08; if (v)
                g.arm.rotation.x = v * -.4; }, get x() { return ra.rotation.x; } } };
}
const SKIN = [0xf0c8a0, 0xe0b088, 0xc48a5a, 0x9a6a44, 0x6a4630, 0xf4d8c0], HAIRC = [0x2a1a10, 0x5a3a1a, 0xa07030, 0xd8b860, 0x1a1a22, 0x8a2a1a, 0xc8c8d0];
const HLOOK = {
    warrior: { kind: 'plate', cloth: 0xb03a2c, trim: 0xe8b84a, metal: 0xaab4c2 },
    paladin: { kind: 'plate', cloth: 0xf2f2f8, trim: 0xe8b84a, metal: 0xe6dcc0 },
    mage: { kind: 'robe', cloth: 0x3b63c9, trim: 0xe8b84a, hair: 0xd0d0d8 },
    priest: { kind: 'robe', cloth: 0xf0f0f4, trim: 0xe8b84a, hair: 0xe8c860 },
    warlock: { kind: 'robe', cloth: 0x2f9a86, trim: 0xf2d27a, hair: 0xf0b8d8 },
    druid: { kind: 'leather', cloth: 0x5a8a3a, trim: 0xd8b860, leather: 0x7a5a32, hair: 0x6a3a1a },
    rogue: { kind: 'leather', cloth: 0x2a2438, trim: 0x8a7ab0, leather: 0x3a2a30, hair: 0x181820 },
    hunter: { kind: 'leather', cloth: 0x3f6a30, trim: 0xb08a50, leather: 0x6a4a2a }
};
function hero(col, cls, seed) {
    const g = new THREE.Group(), sd = seed ? [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) : Math.floor(Math.random() * 1e9);
    const LK = HLOOK[cls] || HLOOK.warrior, kind = LK.kind, hairC = LK.hair != null ? LK.hair : HAIRC[(sd >> 4) % HAIRC.length];
    const L = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 });
    const mt = { skin: L(SKIN[sd % SKIN.length]), cloth: L(LK.cloth), trim: L(LK.trim, 0x2a1c06), metal: L(LK.metal || 0x8a8a96, 0x10141a), leather: L(LK.leather || 0x4a3020), dark: L(0x1c1824), hair: L(hairC), white: L(0xffffff), eye: L(0x1a1410) };
    const cyl = (rt, rb, h, x, y, z, m, p, sx, sz, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), m); o.position.set(x, y, z); if (sx)
        o.scale.set(sx, 1, sz || sx); (p || g).add(o); return o; };
    const bx = (w, h, d, x, y, z, m, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || g).add(o); return o; };
    const sp = (r, x, y, z, m, p, sx, sy, sz) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), m); o.position.set(x, y, z); if (sx)
        o.scale.set(sx, sy, sz); (p || g).add(o); return o; };
    const cone = (r, h, x, y, z, m, p, rz, rx) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), m); o.position.set(x, y, z); o.rotation.set(rx || 0, 0, rz || 0); (p || g).add(o); return o; };
    // ---------- torso (children[0], bobs at y=1.1) ----------
    const T = new THREE.Group();
    T.position.y = 1.1;
    g.add(T);
    const bodyM = kind == 'plate' ? mt.metal : kind == 'leather' ? mt.leather : mt.cloth;
    cyl(.5, .42, .78, 0, .42, 0, bodyM, T, 1, .68, 12);
    cyl(.4, .38, .44, 0, -.08, 0, mt.cloth, T, 1, .7, 12);
    cyl(.44, .44, .12, 0, -.28, 0, mt.leather, T, 1, .72, 12);
    bx(.16, .13, .06, 0, -.28, .3, mt.trim, T);
    cyl(.17, .2, .24, 0, .86, 0, mt.skin, T, 1, 1, 8);
    if (kind == 'plate') {
        bx(.1, .66, .07, 0, .42, .33, mt.trim, T);
        [-1, 1].forEach(s => {
            sp(.3, s * .64, .78, 0, mt.metal, T, 1, .72, 1);
            sp(.22, s * .66, .9, 0, mt.trim, T, 1, .5, 1);
            if (cls == 'warrior')
                cone(.09, .4, s * .7, 1.12, 0, mt.metal, T, -s * .35);
        });
        cyl(.3, .34, .16, 0, .84, 0, mt.metal, T, 1, 1, 10);
        bx(.52, .8, .06, 0, -.7, .3, mt.cloth, T);
        bx(.52, .06, .07, 0, -1.1, .3, mt.trim, T);
        bx(.52, .8, .06, 0, -.7, -.3, mt.cloth, T);
        cyl(.46, .58, .3, 0, -.46, 0, mt.metal, T, 1, .78, 12);
    }
    else if (kind == 'robe') {
        cyl(.5, .8, 1.05, 0, -.62, 0, mt.cloth, T, 1, .85, 14);
        const hem = new THREE.Mesh(new THREE.TorusGeometry(.79, .04, 6, 26), mt.trim);
        hem.scale.set(1, .85, 1);
        hem.rotation.x = Math.PI / 2;
        hem.position.y = -1.12;
        T.add(hem);
        sp(.4, 0, .74, 0, mt.cloth, T, 1.45, .45, 1);
        bx(.14, 1.0, .06, 0, -.62, .4, mt.trim, T);
    }
    else {
        bx(.13, .95, .06, 0, .38, .3, mt.dark, T).rotation.z = .65;
        cyl(.46, .55, .45, 0, -.5, 0, mt.cloth, T, 1, .8, 12);
        [-1, 1].forEach(s => sp(.22, s * .62, .8, 0, mt.leather, T, 1, .7, 1));
    }
    const cape = (c, len) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, len), new THREE.MeshLambertMaterial({ color: c, side: 2 })); m.position.set(0, .85 - len / 2, -.34); m.rotation.x = .08; T.add(m); };
    if (cls == 'warrior')
        cape(0x8a2a22, 1.7);
    else if (cls == 'paladin')
        cape(0xe8e4f4, 1.7);
    else if (cls == 'warlock')
        cape(0x1f6e60, 1.6);
    else if (cls == 'druid')
        cape(0x3a6a2a, 1.3);
    else if (cls == 'rogue')
        cape(0x1c1828, 1.15);
    else if (cls == 'hunter') {
        cape(0x2e4a24, 1.2);
        cyl(.13, .11, .7, .26, .5, -.42, mt.leather, T, 1, 1, 8).rotation.z = .25;
        for (let k = 0; k < 3; k++) {
            cyl(.025, .025, .35, .3 + k * .035, 1.0, -.42, mt.trim, T, 1, 1, 5);
            bx(.05, .1, .02, .3 + k * .035, 1.2, -.42, L(0xc84a3a), T);
        }
    }
    // ---------- head (children[1], bobs at y=2.2) ----------
    const Hd = new THREE.Group();
    Hd.position.y = 2.2;
    g.add(Hd);
    sp(.4, 0, 0, 0, mt.skin, Hd, .92, 1.02, .95);
    [-1, 1].forEach(s => {
        sp(.065, s * .14, .04, .34, mt.white, Hd, 1, 1, .6);
        sp(.036, s * .14, .04, .385, mt.eye, Hd);
        sp(.08, s * .38, 0, 0, mt.skin, Hd, .5, 1, .8);
    });
    bx(.07, .1, .08, 0, -.03, .38, mt.skin, Hd);
    bx(.16, .025, .04, 0, -.15, .36, L(0x7a3a30), Hd);
    const hcap = (r, th, m, y) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 9, 0, Math.PI * 2, 0, Math.PI * th), m); o.position.set(0, y == null ? .04 : y, -.03); Hd.add(o); return o; };
    if (kind == 'plate') {
        hcap(.47, .58, mt.metal);
        bx(.08, .3, .06, 0, -.02, .43, mt.metal, Hd);
        bx(.78, .07, .5, 0, .13, .05, mt.trim, Hd);
        [-1, 1].forEach(s => bx(.07, .36, .26, s * .38, -.1, .06, mt.metal, Hd));
        if (cls == 'warrior')
            bx(.1, .32, .75, 0, .55, -.05, mt.cloth, Hd);
        else {
            [-1, 1].forEach(s => { bx(.5, .1, .04, s * .5, .42, 0, mt.trim, Hd).rotation.z = s * .5; });
            sp(.1, 0, .52, -.05, mt.white, Hd, 1, 1.5, 1);
        }
    }
    else if (cls == 'mage') {
        hcap(.42, .5, mt.hair);
        cyl(.8, .8, .05, 0, .32, 0, mt.cloth, Hd, 1, 1, 18);
        cyl(.44, .5, .12, 0, .38, 0, mt.trim, Hd, 1, 1, 14);
        cone(.42, 1.0, 0, .9, 0, mt.cloth, Hd, .12);
        cone(.2, .55, .17, 1.52, 0, mt.cloth, Hd, .55);
        sp(.07, 0, .42, .46, mt.trim, Hd);
        bx(.7, .6, .25, 0, -.12, -.3, mt.hair, Hd);
    }
    else if (cls == 'priest') {
        hcap(.44, .56, mt.hair);
        bx(.72, .85, .25, 0, -.28, -.3, mt.hair, Hd);
        const cr = new THREE.Mesh(new THREE.TorusGeometry(.4, .035, 6, 24), mt.trim);
        cr.rotation.x = Math.PI / 2;
        cr.position.set(0, .22, 0);
        Hd.add(cr);
        sp(.07, 0, .22, .4, new THREE.MeshBasicMaterial({ color: 0xffee88 }), Hd);
    }
    else if (cls == 'warlock') {
        // Spiritcaller: soft hair with a flower crown
        hcap(.45, .56, mt.hair);
        bx(.72, .8, .25, 0, -.26, -.3, mt.hair, Hd);
        const crown = new THREE.Mesh(new THREE.TorusGeometry(.42, .045, 6, 24), L(0x4a9a3a));
        crown.rotation.x = Math.PI / 2;
        crown.position.set(0, .2, 0);
        Hd.add(crown);
        [0xff8fc8, 0xffffff, 0xffd23a, 0x9adfff, 0xff8fc8, 0xffffff].forEach((c, k) => { const a = k / 6 * Math.PI * 2; sp(.075, Math.cos(a) * .42, .23, Math.sin(a) * .42, new THREE.MeshBasicMaterial({ color: c }), Hd); });
        sp(.05, 0, -.13, .37, L(0xff9a9a), Hd, 1.6, .5, .5);
    }
    else if (cls == 'druid') {
        // Wildheart: leafy headband and little antlers
        hcap(.45, .56, mt.hair);
        bx(.72, .7, .22, 0, -.2, -.3, mt.hair, Hd);
        const band = new THREE.Mesh(new THREE.TorusGeometry(.43, .05, 6, 24), L(0x3a7a2a));
        band.rotation.x = Math.PI / 2;
        band.position.set(0, .14, 0);
        Hd.add(band);
        [-1, 1].forEach(q => {
            cyl(.035, .045, .45, q * .25, .42, 0, L(0x8a6a44), Hd, 1, 1, 5).rotation.z = -q * .35;
            cyl(.03, .035, .22, q * .36, .58, 0, L(0x8a6a44), Hd, 1, 1, 5).rotation.z = -q * 1.1;
            cyl(.03, .035, .2, q * .2, .64, .04, L(0x8a6a44), Hd, 1, 1, 5).rotation.z = q * .3;
        });
        for (let k = 0; k < 5; k++)
            sp(.08, -.3 + k * .15, .18, .36, L(k % 2 ? 0x5aa83a : 0x3a8a2a), Hd, 1, .5, .6);
    }
    else if (cls == 'rogue') {
        hcap(.5, .64, mt.cloth);
        cone(.2, .5, 0, .1, -.5, mt.cloth, Hd, 0, -1.2);
        bx(.58, .24, .22, 0, -.14, .27, mt.cloth, Hd);
    }
    else {
        hcap(.46, .5, mt.leather);
        bx(.62, .06, .5, 0, .14, .12, mt.leather, Hd);
        bx(.06, .5, .04, .3, .5, -.05, L(0xc84a3a), Hd).rotation.z = -.5;
        bx(.7, .6, .2, 0, -.1, -.28, mt.hair, Hd);
    }
    if (kind != 'plate' && cls != 'mage' && cls != 'priest' && cls != 'warlock' && cls != 'druid' && cls != 'rogue')
        hcap(.43, .55, mt.hair);
    // ---------- arms ----------
    const sleeve = kind == 'plate' ? mt.metal : kind == 'leather' ? mt.leather : mt.cloth, fore = kind == 'robe' ? mt.cloth : kind == 'plate' ? mt.metal : mt.leather;
    const mkA = pose => { const a = new THREE.Group(); limb(a, { x: 0, y: 0, z: 0 }, pose.e, sleeve, .26); limb(a, pose.e, pose.h, fore, .23); sp(.13, pose.h.x, pose.h.y, pose.h.z, kind == 'plate' ? mt.metal : mt.skin, a); return a; };
    const la = mkA({ e: { x: 0, y: -.46, z: .08 }, h: { x: 0, y: -.88, z: .3 } });
    la.position.set(-.75, 1.7, 0);
    g.add(la);
    g.arm = la;
    const ra = mkA({ e: { x: .06, y: -.5, z: .2 }, h: { x: .1, y: -.62, z: .62 } });
    ra.position.set(.75, 1.7, 0);
    g.add(ra);
    g.rarm = ra;
    // ---------- legs ----------
    g.legs = [-1, 1].map(s => {
        const l = new THREE.Group(), pants = kind == 'plate' ? mt.dark : kind == 'robe' ? mt.dark : mt.cloth, greave = kind == 'plate' ? mt.metal : mt.leather;
        l.position.set(s * .25, .95, 0);
        bx(.34, .46, .36, 0, -.23, 0, pants, l);
        if (kind == 'plate')
            sp(.16, 0, -.46, .08, mt.metal, l);
        bx(.3, .4, .32, 0, -.66, 0, greave, l);
        bx(.36, .2, .5, 0, -.85, .07, kind == 'robe' ? mt.dark : greave, l);
        bx(.38, .06, .38, 0, -.74, 0, mt.trim, l);
        g.add(l);
        return l;
    });
    // ---------- weapon (held in the right hand) ----------
    const w = new THREE.Group();
    g.add(w);
    w.position.set(.85, 1.08, .62);
    if (cls == 'mage' || cls == 'priest' || cls == 'warlock' || cls == 'druid') {
        cyl(.05, .07, 2.5, 0, .3, 0, L(0x5a3a1a), w, 1, 1, 6);
        g.orb = add(new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshBasicMaterial({ color: { priest: 0xffee88, warlock: 0x7affe0, druid: 0x9dff6a }[cls] || 0xff7722 })), 0, 1.65, 0, w);
        if (cls == 'priest') {
            const rg = new THREE.Mesh(new THREE.TorusGeometry(.36, .04, 6, 20), mt.trim);
            rg.position.set(0, 1.65, -.05);
            w.add(rg);
        }
        else if (cls == 'mage') {
            const cr = new THREE.Mesh(new THREE.TorusGeometry(.3, .05, 6, 16, Math.PI * 1.4), mt.trim);
            cr.rotation.z = Math.PI * .8;
            cr.position.set(0, 1.62, -.02);
            w.add(cr);
        }
        else
            for (let k = 0; k < 3; k++)
                cone(.06, .34, Math.cos(k * 2.09) * .24, 1.58, Math.sin(k * 2.09) * .24, L(cls == 'druid' ? 0x3a8a2a : 0xf2d27a), w, 0, 0);
    }
    else if (cls == 'hunter') {
        const bow = add(new THREE.Mesh(new THREE.TorusGeometry(.85, .05, 6, 16, Math.PI), L(0x6a4a1a)), 0, .1, 0, w);
        bow.rotation.z = -Math.PI / 2;
        bx(.012, 1.7, .012, 0, .1, 0, mt.white, w);
    }
    else {
        bx(.15, 1.3, .04, 0, .72, 0, L(0xd8e0ea, 0x141c28), w);
        cone(.1, .3, 0, 1.52, 0, L(0xd8e0ea, 0x141c28), w, 0, 0);
        bx(.5, .1, .12, 0, .06, 0, mt.trim, w);
        cyl(.045, .05, .5, 0, -.2, 0, mt.leather, w, 1, 1, 6);
        sp(.08, 0, -.48, 0, mt.trim, w);
    }
    if (cls == 'warrior' || cls == 'paladin') {
        const inner = new THREE.Group();
        w.children.slice().forEach(o => inner.add(o));
        inner.rotation.set(.85, 0, .3);
        inner.scale.setScalar(.78);
        w.add(inner);
    }
    g.w = w;
    g.cls = cls;
    g.col = col;
    if (cls == 'rogue')
        buildDaggers(g, w);
    return g;
}
const MOBS = [['Wolf', 0x777777, 1, 1], ['Bandit', 0xa0522d, 1.2, 0], ['Ogre', 0x6b8e23, 1.9, 0], ['Wraith', 0x9b59b6, 1.5, 0],
    ['Frost Wolf', 0xbcd8ee, 1.15, 1], ['Ice Golem', 0x9fd4ff, 2.1, 0], ['Sand Scorpion', 0xc9a45a, 1.2, 1], ['Dune Wraith', 0xe0b060, 1.6, 0],
    ['Thornback Boar', 0x8a4a22, 1.3, 1], ['Pumpkin Brute', 0xe07a1a, 1.9, 0], ['Bog Lurker', 0x3d6a4a, 1.7, 0], ['Storm Spirit', 0x6a7ad8, 1.5, 0]];
function mobMesh(ty) {
    const [, c, s] = MOBS[ty], g = new THREE.Group(), M = c => new THREE.MeshLambertMaterial({ color: c, map: fur });
    add(new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 10), M(c)), 0, .9 * s, 0, g).scale.set(s, s * (MOBS[ty][3] ? .7 : 1.2), s * (MOBS[ty][3] ? 1.4 : 1));
    add(new THREE.Mesh(new THREE.SphereGeometry(.4 * s, 10, 8), M(c)), 0, 1.6 * s, .5 * s, g);
    [-.18, .18].forEach(x => add(new THREE.Mesh(new THREE.SphereGeometry(.07 * s, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 })), x * s, 1.7 * s, .85 * s, g));
    const bg = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, .18), new THREE.MeshBasicMaterial({ color: 0x000000 })), 0, 2.8 * s, 0, g), fg = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, .18), new THREE.MeshBasicMaterial({ color: 0xdd3333 })), 0, 2.8 * s, .01, g);
    g.bar = [bg, fg];
    g.body = g.children[0];
    return g;
}
const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 24), new THREE.MeshBasicMaterial({ color: 0xffee33, side: 2 }));
ring.rotation.x = -Math.PI / 2;
ring.visible = false;
S.add(ring);
// state
const CL = { warrior: { hp: 150, mp: 60, col: 0xc8553d, regen: 7, ab: [
            { n: 'Strike', cost: 5, cd: .7, range: 4, need: 1, f: () => hit(P.t, dmg(1.4)) },
            { n: 'Whirlwind', cost: 20, cd: 5, f: () => mobs.slice().forEach(m => { if (d3(m, P) < 9.5)
                    hit(m, dmg(1)); }) },
            { n: 'Second Wind', cost: 25, cd: 9, f: () => heal(.35) },
            { n: 'Charge', cost: 10, cd: 8, range: 30, need: 1, f: () => { const m = P.t, v = new THREE.Vector3().subVectors(m.pos, P.pos).setLength(Math.max(0, d3(m, P) - 2.5)); P.pos.add(v); hit(m, dmg(1.2)); m.slow = 2; } }
        ] },
    mage: { hp: 95, mp: 120, col: 0x3b63c9, regen: 5, ab: [
            { n: 'Fireball', cost: 10, cd: .9, range: 28, need: 1, f: () => { const b = new THREE.Mesh(new THREE.SphereGeometry(.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff7711 })); b.position.copy(P.pos).y += 2; S.add(b); bolts.push({ b, m: P.t, d: dmg(2.6) }); } },
            { n: 'Frost Nova', cost: 25, cd: 6, f: () => { mobs.slice().forEach(m => { if (d3(m, P) < 12) {
                    hit(m, dmg(1.3));
                    m.slow = 3;
                } }); nova(); } },
            { n: 'Heal', cost: 25, cd: 8, f: () => heal(.4) },
            { n: 'Blink', cost: 15, cd: 10, f: () => { P.pos.add(fwd().multiplyScalar(16)); } }
        ] } };
let P, mobs = [], bolts = [], dying = [], parts = [], fx = [], paused = false, mapOpen = false, logs = [], Q, running = false, yaw = 0, pit = .4, zoom = 14;
const keys = {};
const d3 = (a, b) => Math.hypot((a.pos ? a.pos.x : a.x) - (b.pos ? b.pos.x : b.x), (a.pos ? a.pos.z : a.z) - (b.pos ? b.pos.z : b.z));
const fwd = () => new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
const PVPL = 10, PL = () => (P.pv ? PVPL : P.lvl), PG = () => (P.pv ? 0 : P.gear);
const dmg = k => { let m = 1; if (P.amb) { m = 2; P.amb = 0; } return Math.round((10 + PL() * 3 + PG() * 2) * k * rnd(.85, 1.15) * specD() * m); };
function say(s) { logs.unshift(s); logs.length = Math.min(logs.length, 6); $('log').innerHTML = logs.map((l, i) => `<div style="opacity:${1 - i * .14}">${l}</div>`).join(''); }
function float(pos, s, c) { const el = document.createElement('div'); el.className = 'ft'; el.style.color = c; el.textContent = s; document.body.appendChild(el); fx.push({ el, p: pos.clone().add(new THREE.Vector3(0, 3, 0)), t: 1.1 }); }
function hit(m, d) { if (!(d >= 0)) d = 1; if (m && !(m.hp >= -1e9)) m.hp = m.max || 1; if (!m || m.adm == 'friendly' || G.cd > 0 || (DU && (DU.cd > 0 || (DU.over && DU.b === m))))
    return; m.hp -= d; m.aggro = true; float(m.pos, d, '#ffd24a'); burst(m.pos, 0xffaa33, 5); if (m.hp <= 0)
    kill(m); }
function heal(f) { const h = Math.round(P.max * f * healM()); P.hp = Math.min(P.max, P.hp + h); float(P.pos, '+' + h, '#6f6'); burst(P.pos, 0x66ff88, 12, 1.5); }
function nova() { const r = new THREE.Mesh(new THREE.RingGeometry(.5, 1, 32), new THREE.MeshBasicMaterial({ color: 0x66ccff, side: 2, transparent: true })); r.rotation.x = -Math.PI / 2; r.position.copy(P.pos).y = .3; S.add(r); bolts.push({ ring: r, t: 0 }); }
const ZMOB = [[0, 1, 2], [4, 5], [6, 7], [8, 9], [10, 11]];
function spawn() {
    if (!window.SP)
        return;
    const w = rnd(0, 1), zi = w < .22 ? 0 : 1 + Math.min(3, Math.floor((w - .22) / .195));
    let p = null;
    for (let k = 0; k < 40 && !p; k++) {
        const q = pt(zi, TOWN + 10);
        if (q && Math.hypot(q[0], q[1]) > TOWN + 10)
            p = q;
    }
    if (!p)
        p = [30, 30];
    const x = p[0], z = p[1], d = Math.hypot(x, z), zz = zoneAt(x, z);
    const lvl = zz === 0 ? 1 + Math.floor(d / 35) : Math.min(18, 4 + Math.floor((d - R0) / 32)), list = ZMOB[zz], ty = zz === 0 ? list[Math.min(2, Math.floor(lvl / 2))] : list[Math.min(1, Math.floor((lvl - 4) / 5))], mesh = mobMesh(ty);
    mesh.position.set(x, 0, z);
    S.add(mesh);
    mesh.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
        o.castShadow = true; });
    mobs.push({ mesh, pos: mesh.position, hx: x, hz: z, lvl, ty, hp: 30 + lvl * 22, max: 30 + lvl * 22, cd: 0, slow: 0, aggro: false });
}
function kill(m) {
    if (m.wb) {
        if (DU && DU.b === m) { m.hp = 1; duelEnd(true); return; }
        if (m.pit) {
            const xp = 10 * P.lvl + 20, gd = 5 * P.lvl + 5;
            addXP(xp);
            P.gold += gd;
            say('<span style="color:#ff9a9a">PvP kill: ' + esc(m.name) + '! +' + xp + ' xp, +' + gd + ' gold</span>');
        }
        return wbKill(m);
    }
    if (m.bot)
        return botKill(m);
    dying.push({ m: m.mesh, t: 0 });
    m.mesh.bar.forEach(b => b.visible = false);
    burst(m.pos, 0xcc2222, 14);
    mobs.splice(mobs.indexOf(m), 1);
    if (P.t === m)
        P.t = null;
    const xp = 10 + m.lvl * 8, gold = Math.round(rnd(1, 4) * m.lvl);
    P.gold += gold;
    P.xp += xp;
    say(`Slain ${MOBS[m.ty][0]} (L${m.lvl}): +${xp} xp, +${gold} gold`);
    if (Math.random() < .18) {
        P.gear++;
        say('<span style="color:#c9f">★ Loot: Ember Blade +' + P.gear + ' (more damage!)</span>');
    }
    if (Q.on) {
        Q.have++;
        if (Q.have >= Q.need) {
            Q.on = false;
            Q.done++;
            P.gold += 30 * Q.done;
            P.xp += 60 * Q.done;
            say('<span style="color:#fc6">Quest complete! +' + 30 * Q.done + ' gold</span>');
        }
    }
    while (P.xp >= xpN()) {
        P.xp -= xpN();
        P.lvl++;
        P.max = maxHP(P.lvl);
        P.mmax += 10;
        burst(P.pos, 0xffee55, 40, 2);
        P.hp = P.max;
        P.mp = P.mmax;
        say('<b style="color:#ff6">LEVEL UP! You are level ' + P.lvl + '</b>');
    }
    if (m.dg)
        dgKilled(m);
    else
        setTimeout(spawn, 6000);
}
const xpN = () => Math.round(30 * Math.pow(P.lvl, 1.5));
function shot(col, d, fn, sz, tgt) { const b = new THREE.Mesh(new THREE.SphereGeometry(sz || .35, 8, 8), new THREE.MeshBasicMaterial({ color: col })); b.position.copy(P.pos); b.position.y += 2; S.add(b); bolts.push({ b, m: tgt || P.t, d, fn, c: col }); }
const ICONS = { Strike: ['⚔️', '#b33a2a'], Whirlwind: ['🌪️', '#6a6a8a'], 'Second Wind': ['💪', '#3a8a4a'], Charge: ['🏃', '#a8662a'], Fireball: ['🔥', '#d4541a'], 'Frost Nova': ['❄️', '#2a7ac4'], Heal: ['💚', '#2a9a4a'], Blink: ['🌀', '#6a4ac4'],
    Backstab: ['🗡️', '#5a3a6a'], Shadowstep: ['🌑', '#2a2a55'], Poison: ['🧪', '#4a9a2a'], 'Smoke Bomb': ['💨', '#777'], Smite: ['☀️', '#d4b02a'], 'Holy Nova': ['🌟', '#e0c860'], Renew: ['🌿', '#2a9a6a'], 'Power Shield': ['🛡️', '#4a8ac4'],
    'Arrow Shot': ['🏹', '#8a6a2a'], 'Multi-Shot': ['🎯', '#aa3a3a'], 'Rapid Fire': ['⚡', '#d49a1a'], Disengage: ['🦘', '#4a7a3a'], Crusade: ['🔨', '#c9a02a'], Judgement: ['⚖️', '#e8c84a'], 'Holy Light': ['🙏', '#e8e0a0'], Consecrate: ['✝️', '#c8a030'],
    'Shadow Bolt': ['🟣', '#6a2a9a'], Corruption: ['🦠', '#4a6a2a'], 'Drain Life': ['🩸', '#8a1a2a'], Hellfire: ['🌋', '#c43a1a'] };
Object.assign(CL, {
    rogue: { hp: 110, mp: 100, col: 0x4a3a6a, regen: 10, ab: [
            { n: 'Backstab', cost: 8, cd: .6, range: 4, need: 1, f: () => hit(P.t, dmg(1.7)) },
            { n: 'Shadowstep', cost: 15, cd: 7, range: 30, need: 1, f: () => { const m = P.t, v = new THREE.Vector3(P.pos.x - m.pos.x, 0, P.pos.z - m.pos.z).normalize(); P.pos.set(m.pos.x - v.x * 2, 0, m.pos.z - v.z * 2); hit(m, dmg(1.3)); } },
            { n: 'Poison', cost: 15, cd: 8, range: 20, need: 1, f: () => { P.t.dot = { n: 5, d: dmg(.45) }; P.t.aggro = true; burst(P.t.pos, 0x66dd44, 8); } },
            { n: 'Sprint', cost: 20, cd: 18, f: () => { P.sprint = 6; burst(P.pos, 0x9fd8ff, 14, 1.2); float(P.pos, 'Sprint!', '#9fd8ff'); } }
        ] },
    priest: { hp: 95, mp: 130, col: 0xe8e8f0, regen: 6, ab: [
            { n: 'Smite', cost: 8, cd: .9, range: 28, need: 1, f: () => shot(0xffee99, dmg(1.5)) },
            { n: 'Holy Nova', cost: 25, cd: 6, f: () => { mobs.slice().forEach(m => { if (d3(m, P) < 10)
                    hit(m, dmg(.9)); }); heal(.12); nova(); } },
            { n: 'Renew', cost: 20, cd: 10, f: () => { P.hot = { n: 6, a: 0 }; } },
            { n: 'Power Shield', cost: 30, cd: 15, f: () => { P.shield = 60 + PL() * 15; } }
        ] },
    hunter: { hp: 120, mp: 100, col: 0x4f7a3a, regen: 8, ab: [
            { n: 'Arrow Shot', cost: 6, cd: .7, range: 32, need: 1, f: () => shot(0xddddaa, dmg(1.5), null, .18) },
            { n: 'Multi-Shot', cost: 20, cd: 5, f: () => { mobs.map(m => [d3(m, P), m]).filter(x => x[0] < 25).sort((a, b) => a[0] - b[0]).slice(0, 4).forEach(x => shot(0xddddaa, dmg(.9), null, .18, x[1])); } },
            { n: 'Rapid Fire', cost: 25, cd: 10, range: 32, need: 1, f: () => { const m = P.t; for (let i = 0; i < 4; i++)
                    setTimeout(() => { if (running && mobs.indexOf(m) >= 0)
                        shot(0xffcc44, dmg(.8), null, .18, m); }, i * 300); } },
            { n: 'Disengage', cost: 10, cd: 8, f: () => { mobs.forEach(m => { if (d3(m, P) < 9)
                    m.slow = 3; }); P.pos.add(new THREE.Vector3(Math.sin(P.mesh.rotation.y), 0, Math.cos(P.mesh.rotation.y)).multiplyScalar(-14)); } }
        ] },
    paladin: { hp: 160, mp: 100, col: 0xe8c84a, regen: 6, ab: [
            { n: 'Crusade', cost: 6, cd: .8, range: 4, need: 1, f: () => hit(P.t, dmg(1.5)) },
            { n: 'Judgement', cost: 15, cd: 6, range: 25, need: 1, f: () => shot(0xffdd55, dmg(1.4), m => { m.slow = 2; }) },
            { n: 'Holy Light', cost: 30, cd: 8, f: () => heal(.45) },
            { n: 'Consecrate', cost: 25, cd: 9, f: () => { mobs.slice().forEach(m => { if (d3(m, P) < 9)
                    hit(m, dmg(1.1)); }); P.shield = (P.shield || 0) + 40 + PL() * 5; nova(); } }
        ] },
    warlock: { hp: 95, mp: 130, col: 0x2f9a86, regen: 5, ab: [
            { n: 'Spirit Bolt', cost: 10, cd: 1, range: 28, need: 1, f: () => shot(0x66e0ff, dmg(1.9)) },
            { n: 'Thorn Hex', cost: 15, cd: 8, range: 28, need: 1, f: () => { P.t.dot = { n: 6, d: dmg(.5), c: 0x7be04a }; P.t.aggro = true; burst(P.t.pos, 0x7be04a, 8); } },
            { n: 'Life Bloom', cost: 20, cd: 7, range: 25, need: 1, f: () => { hit(P.t, dmg(1.2)); heal(.15); burst(P.pos, 0xff8fc8, 10, 1.2); } },
            { n: 'Starburst', cost: 30, cd: 8, f: () => { mobs.slice().forEach(m => { if (d3(m, P) < 9)
                    hit(m, dmg(1.5)); }); burst(P.pos, 0x9affea, 24, 1.6); burst(P.pos, 0xffe48a, 14, 1.4); nova(); } }
        ] }
});
const MOUNTS = [{ n: 'Brown Horse', e: '🐴', lvl: 0, sp: 1.7, col: 0x8a5a2a, fly: 0 }, { n: 'Dire Wolf', e: '🐺', lvl: 0, sp: 2, col: 0x6a6a74, fly: 0 }, { n: 'Gryphon', e: '🦅', lvl: 0, sp: 2.1, col: 0xc8a050, fly: 1, wing: 0xe8e0c8 }, { n: 'Ember Drake', e: '🐉', lvl: 0, sp: 2.6, col: 0x2a8a4a, fly: 1, wing: 0x1a5a30, drake: 1 }];
// ===== Wildheart (druid): nature magic in elf form, turns into a lion =====
CL.druid = { hp: 120, mp: 110, col: 0x5a8a3a, regen: 7, ab: [
        { n: 'Thorn Lash', cost: 8, cd: .9, range: 28, need: 1, f: () => shot(0x7be04a, dmg(1.6), null, .25) },
        { n: 'Entangle', cost: 15, cd: 8, range: 26, need: 1, f: () => { const m = P.t; hit(m, dmg(.8)); m.slow = 4; m.stun = Math.max(m.stun || 0, 1.5); burst(m.pos, 0x3a8a2a, 14, .6, .2); burst(m.pos, 0x7be04a, 8, 1); } },
        { n: 'Rejuvenate', cost: 20, cd: 10, f: () => { P.hot = { n: 6, a: 0 }; heal(.1); burst(P.pos, 0x9dff6a, 14, 1.3); } },
        { n: 'Lion Form', cost: 10, cd: 1.5, f: () => lionToggle() }
    ] };
CL.druid.abL = [
    { n: 'Claw', cost: 5, cd: .6, range: 4.5, need: 1, f: () => { hit(P.t, dmg(1.8)); burst(P.t.pos, 0xffd27a, 6, 1); } },
    { n: 'Pounce', cost: 15, cd: 7, range: 26, need: 1, f: () => { const m = P.t, v = new THREE.Vector3(P.pos.x - m.pos.x, 0, P.pos.z - m.pos.z).normalize(); burst(P.pos, 0xd9a54a, 10, 1); P.pos.set(m.pos.x + v.x * 2.2, 0, m.pos.z + v.z * 2.2); P.gl = undefined; P.onP = null; hit(m, dmg(1.4)); m.stun = Math.max(m.stun || 0, 1.2); } },
    { n: 'Roar', cost: 20, cd: 9, f: () => { mobs.slice().forEach(m => { if (d3(m, P) < 9) {
            hit(m, dmg(1.1));
            m.slow = 3;
        } }); burst(P.pos, 0xffd27a, 20, 1.4); nova(); float(P.pos, 'ROAR!', '#ffd27a'); } },
    { n: 'Human Form', cost: 0, cd: 1.5, f: () => lionToggle() }
];
Object.assign(ICONS, { 'Thorn Lash': ['🌱', '#3a8a2a'], Entangle: ['🍃', '#2a6a2a'], Rejuvenate: ['🍀', '#3a9a5a'], 'Lion Form': ['🦁', '#c08a2a'], Claw: ['🐾', '#a0702a'], Pounce: ['💥', '#c0602a'], Roar: ['🗯️', '#c9a02a'], 'Human Form': ['🧝', '#3a7a3a'] });
const CM = { warrior: { n: 'Iron Boar', e: '🐗', sp: 2.2, col: 0x5a5a64, fly: 0, cls: 1 }, mage: { n: 'Arcane Unicorn', e: '🦄', sp: 2.3, col: 0x7a5ad8, fly: 1, cls: 1, wing: 0xc0a0ff }, rogue: { n: 'Shadow Panther', e: '🐆', sp: 2.4, col: 0x2a2a3a, fly: 0, cls: 1 }, priest: { n: 'Radiant Swan', e: '🦢', sp: 2.2, col: 0xf0f0ff, fly: 1, cls: 1, wing: 0xffffff }, hunter: { n: 'Great Bear', e: '🐻', sp: 2.1, col: 0x6a4a2a, fly: 0, cls: 1 }, paladin: { n: 'Golden Charger', e: '🐎', sp: 2.3, col: 0xe8c84a, fly: 0, cls: 1 }, warlock: { n: 'Spirit Steed', e: '🦄', sp: 2.4, col: 0x9adfe8, fly: 0, cls: 1 }, druid: { n: 'Forest Stag', e: '🦌', sp: 2.3, col: 0x9a6a3a, fly: 0, cls: 1 } };
const ML = () => MOUNTS.slice(0, 4).concat([CM[P.cls]], MOUNTS.slice(4));
function mountMeshOld(d) {
    const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: d.col, emissive: d.cls ? d.col : 0, emissiveIntensity: .25 }), L = d.drake ? 3.2 : 2.4, bx = (w, h, l, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); o.position.set(x, y, z); (p || g).add(o); o.castShadow = true; return o; };
    bx(1.1, 1, L, 0, 1.2, 0);
    bx(.5, 1, .5, 0, 1.8, L / 2 - .1).rotation.x = -.4;
    bx(.5, .5, .9, 0, 2.3, L / 2 + .45);
    bx(.2, .2, 1.1, 0, 1.3, -L / 2 - .4).rotation.x = .3;
    g.legs = [[.4, L / 2 - .3], [-.4, L / 2 - .3], [.4, -L / 2 + .3], [-.4, -L / 2 + .3]].map(([x, z]) => { const l = new THREE.Group(); l.position.set(x, .9, z); bx(.28, .9, .28, 0, -.45, 0, l); g.add(l); if (d.fly)
        l.visible = false; return l; });
    if (d.wing) {
        const wm = new THREE.MeshLambertMaterial({ color: d.wing, side: 2 });
        g.wings = [1, -1].map(s => { const w = new THREE.Group(); w.position.set(s * .55, 1.8, 0); const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, .06, d.drake ? 1.8 : 1.3), wm); p.position.x = s * 1.2; w.add(p); g.add(w); return w; });
    }
    if (d.drake) {
        bx(.3, .5, .3, .2, 2.8, L / 2 + .5);
        bx(.3, .5, .3, -.2, 2.8, L / 2 + .5);
    }
    return g;
}
function jump() { if (G.cd > 0 || (DU && DU.cd > 0))
    return; if ((P.jy || 0) < .05) {
    P.vy = (P.mount ? 11 : 10.5) * (P.gum > 0 ? 1.25 : 1) * (P.bal > 0 ? 1.35 : 1);
    P.jy = .06;
} }
const css = c => '#' + c.toString(16).padStart(6, '0'), MT = {};
function mtex(t, c) {
    const k = t + c;
    if (MT[k])
        return MT[k];
    const Lt = 'rgba(255,255,255,.17)', Dk = 'rgba(0,0,0,.24)';
    return MT[k] = tex((g, w) => {
        g.fillStyle = t == 'lava' ? '#2a0c0c' : css(c);
        g.fillRect(0, 0, w, w);
        if (t == 'fur' || t == 'spot' || t == 'sparkle')
            for (let i = 0; i < 3200; i++) {
                g.fillStyle = i % 2 ? Lt : Dk;
                g.fillRect(rnd(0, w), rnd(0, w), 1.6, rnd(3, 9));
            }
        if (t == 'spot')
            for (let i = 0; i < 45; i++) {
                g.fillStyle = 'rgba(0,0,0,.45)';
                g.beginPath();
                g.ellipse(rnd(0, w), rnd(0, w), rnd(5, 11), rnd(4, 8), rnd(0, 3), 0, 6.3);
                g.fill();
            }
        if (t == 'sparkle')
            for (let i = 0; i < 90; i++) {
                g.fillStyle = 'rgba(255,255,255,' + rnd(.4, .95) + ')';
                g.fillRect(rnd(0, w), rnd(0, w), 2, 2);
            }
        if (t == 'feather' || t == 'scale') {
            const h = t == 'scale' ? 14 : 20, r = t == 'scale' ? 16 : 13;
            for (let y = 0, j = 0; y < w + h; y += h, j++)
                for (let x = (j % 2) * r; x < w + r; x += r * 1.7) {
                    g.fillStyle = Lt;
                    g.beginPath();
                    g.arc(x, y, r, 0, Math.PI);
                    g.fill();
                    g.strokeStyle = Dk;
                    g.lineWidth = 2;
                    g.stroke();
                }
        }
        if (t == 'armor') {
            g.strokeStyle = Dk;
            g.lineWidth = 3;
            for (let i = 0; i < w; i += 48)
                g.strokeRect(i, 0, 48, w);
            g.fillStyle = Lt;
            g.fillRect(0, 0, w, w / 2.5);
        }
        if (t == 'lava') {
            g.strokeStyle = '#ff7a1a';
            g.lineWidth = 3;
            for (let i = 0; i < 26; i++) {
                g.beginPath();
                let x = rnd(0, w), y = rnd(0, w);
                g.moveTo(x, y);
                for (let q = 0; q < 5; q++)
                    g.lineTo(x += rnd(-22, 22), y += rnd(-22, 22));
                g.stroke();
            }
        }
    }, 1);
}
const MS = { 'Brown Horse': { t: 'fur', L: 2.4, lg: 1, nk: 1, mane: 0x20120a, ears: 1, tail: 1 }, 'Dire Wolf': { t: 'fur', L: 2, lg: .8, nk: .4, snout: 1, ears: 1, tail: 2, eye: 0xffcc22, w: .9 },
    'Gryphon': { t: 'feather', L: 2.2, lg: .6, nk: .9, beak: 0xf0c020, wing: 1, tail: 2 }, 'Ember Drake': { t: 'scale', L: 3.2, lg: .6, nk: 1.2, horns: 1, wing: 1, tail: 1, spikes: 1, eye: 0xff5522 },
    'Iron Boar': { t: 'fur', L: 1.9, lg: .6, nk: .1, tusk: 1, armor: 1, ears: 1, w: 1.3, tail: 1 }, 'Arcane Unicorn': { t: 'sparkle', L: 2.4, lg: 1, nk: 1, horn: 0xffe8ff, mane: 0xff7aff, tail: 1, wing: 1 },
    'Shadow Panther': { t: 'spot', L: 2.2, lg: .8, nk: .5, ears: 1, tail: 1, eye: 0x66ff88, w: .9, snout: 1 }, 'Radiant Swan': { t: 'feather', L: 1.9, lg: .5, nk: 1.5, beak: 0xff9a2a, wing: 1, tail: 2 },
    'Great Bear': { t: 'fur', L: 2.1, lg: .8, nk: .2, ears: 1, snout: 1, w: 1.4, tail: 2 }, 'Golden Charger': { t: 'armor', L: 2.4, lg: 1, nk: 1, mane: 0xfff2b0, tail: 1, armor: 1, ears: 1 },
    'Hellsteed': { t: 'lava', L: 2.4, lg: 1, nk: 1, mane: 0xff5a1a, tail: 1, horns: 1, eye: 0xffee33, flame: 1 } };
function mountMeshOld(d) {
    const s = MS[d.n] || MS['Brown Horse'], g = new THREE.Group(), w1 = s.w || 1, m = new THREE.MeshLambertMaterial({ map: mtex(s.t, d.col), emissive: d.cls ? d.col : 0, emissiveIntensity: .2 }), C = c => new THREE.MeshLambertMaterial({ color: c }), B = c => new THREE.MeshBasicMaterial({ color: c }), L = s.L, LG = s.lg + .4, by = LG + .45, W = 1.1 * w1, bx = (a, b, c, x, y, z, p, mt) => { const o = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mt || m); o.position.set(x, y, z); (p || g).add(o); o.castShadow = true; return o; }, sp = (r, sx, sy, sz, x, y, z, mt, p) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mt || m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); (p || g).add(o); o.castShadow = true; return o; }, cn = (r, h, x, y, z, rx, rz, mt, p) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mt || m); o.position.set(x, y, z); o.rotation.set(rx || 0, 0, rz || 0); (p || g).add(o); return o; };
    sp(1, W / 2 + .15, .62, L / 2, 0, by, 0);
    sp(1, W / 2, .55, .5, 0, by + .05, L / 2 - .35);
    const hy = by + .4 + s.nk * .75, hz = L / 2 + .2 + s.nk * .3;
    bx(.46 * w1, .3 + s.nk * .8, .5 * w1, 0, by + .3 + s.nk * .35, L / 2 - .1).rotation.x = -.45 * (s.nk > .3 ? 1 : .4);
    sp(.4, .85 * w1, .85, s.snout || s.beak ? 1.1 : 1.55, 0, hy, hz);
    if (s.snout)
        sp(.3, .8, .7, 1.1, 0, hy - .1, hz + .45);
    [-1, 1].forEach(x => { sp(.07, 1, 1, 1, x * .22 * w1, hy + .12, hz + .2, B(s.eye || 0x111111)); if (s.ears)
        cn(.1, .3, x * .2, hy + .42, hz - .12); if (s.tusk)
        cn(.06, .35, x * .2, hy - .2, hz + .5, 0, 0, C(0xf4efe0)); if (s.horns)
        cn(.07, .45, x * .2, hy + .4, hz - .15, -.5); });
    if (s.mane)
        bx(.1, .9, .35, 0, by + .7 + s.nk * .2, L / 2 - .35, g, s.flame ? B(s.mane) : C(s.mane)).rotation.x = -.45;
    if (s.horn)
        cn(.07, .8, 0, hy + .55, hz + .3, .9, 0, B(s.horn));
    if (s.beak)
        cn(.14, .55, 0, hy - .05, hz + .5, 1.5, 0, C(s.beak));
    const tg = new THREE.Group();
    tg.position.set(0, by + .15, -L / 2);
    g.add(tg);
    g.tl = tg;
    if (s.tail == 2)
        sp(.35, 1, .8, 1.8, 0, 0, -.5, m, tg);
    else
        cn(.16, 1.4, 0, -.25, -.7, -1.9, 0, s.mane ? C(s.mane) : m, tg);
    g.legs = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * (W / 2 - .05), LG, sz * (L / 2 - .5)); bx(.3 * w1, LG, .3 * w1, 0, -LG / 2, 0, l); bx(.34 * w1, .14, .34 * w1, 0, -LG + .07, 0, l, C(0x1a1a1a)); g.add(l); return l; });
    if (s.armor) {
        bx(W + .2, .18, L * .55, 0, by + .55, .05, g, C(d.n == 'Golden Charger' ? 0xffd24a : 0x8a8a96));
        sp(.5, 1.2, 1, .7, 0, by + .1, L / 2 - .1, C(d.n == 'Golden Charger' ? 0xffd24a : 0x8a8a96));
    }
    bx(.8, .14, .8, 0, by + .62, -.1, g, C(0x5a2a1a));
    if (s.spikes)
        for (let i = 0; i < 5; i++)
            cn(.1, .35, 0, by + .78, -L / 2 + .5 + i * .55, 0, 0, C(0x1a4a22));
    if (s.flame)
        for (let i = 0; i < 4; i++)
            cn(.1, .5, 0, by + .75, L / 2 - .3 - i * .3, 0, 0, B(0xff7a1a));
    if (s.wing) {
        const wm = new THREE.MeshLambertMaterial({ map: mtex(s.t == 'scale' ? 'scale' : 'feather', d.wing || d.col), side: 2 });
        g.wings = [1, -1].map(q => { const w = new THREE.Group(); w.position.set(q * .5, by + .5, 0); const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, .06, d.drake ? 2 : 1.5), wm); p.position.x = q * 1.3; w.add(p); g.add(w); return w; });
    }
    g.ride = by + .55;
    return g;
}
const G = { on: false, diff: 1, cd: 0 }, PTS = [], PV = { duel: { x: 600, z: 0, r: 22 }, arena: { x: 600, z: 100, r: 34 }, bg: { x: 600, z: 300, r: 90 } };
let bots = [], pvBuilt = false, bnT, bgCastles = [], bgGates = [], camBlock = [], camRay = new THREE.Raycaster();
const BG_GATE_OFFSET = 14, BG_CASTLE_HALF = 14, BG_CASTLE_DEPTH = 16;
const shf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
function bn(s, ms) { const e = $('bn'); e.textContent = s; e.style.display = 'block'; clearTimeout(bnT); if (ms)
    bnT = setTimeout(() => e.style.display = 'none', ms); }
function addXP(x) { P.xp += x; while (P.xp >= xpN()) {
    P.xp -= xpN();
    P.lvl++;
    P.max = maxHP(P.lvl);
    P.mmax += 10;
    P.hp = P.max;
    P.mp = P.mmax;
    burst(P.pos, 0xffee55, 40, 2);
    say('<b style="color:#ff6">LEVEL UP! You are level ' + P.lvl + '</b>');
} }
function buildPvP() {
    if (pvBuilt)
        return;
    pvBuilt = true;
    const stoneM = new THREE.MeshLambertMaterial({ map: stoneT, side: 2 }), flo = (c, r, mt) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mt); m.rotation.x = -Math.PI / 2; m.position.set(c.x, .05, c.z); m.receiveShadow = true; S.add(m); }, wall = (c, r, h) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r + 1, r + 1, h, 48, 1, true), stoneM); w.position.set(c.x, h / 2, c.z); S.add(w); }, pil = (x, z, h) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, h, 10), TM(stoneT)); p.position.set(x, h / 2, z); p.castShadow = true; S.add(p); };
    const D = PV.duel, A = PV.arena, Bg = PV.bg;
    flo(D, D.r, TM(stoneT));
    wall(D, D.r, 8);
    flo(A, A.r, TM(stoneT));
    wall(A, A.r, 10);
    for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + .5;
        pil(A.x + Math.cos(a) * 14, A.z + Math.sin(a) * 14, 5);
    }
    flo(Bg, Bg.r, TM(grassT));
    wall(Bg, Bg.r, 3);
    [[-1, 0x3a8a4a], [1, 0xa83a3a]].forEach(([s, col]) => { const pad = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: col })); pad.rotation.x = -Math.PI / 2; pad.position.set(Bg.x + s * 80, .1, Bg.z); S.add(pad); });
    // Battleground castles: each team starts behind a visible, locked gate.
    bgCastles = [];
    bgGates = [];
    const makeBlock = (w, h, d, x, y, z, mat, parent) => {
        const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        o.position.set(x, y, z);
        o.castShadow = true;
        o.receiveShadow = true;
        parent.add(o);
        return o;
    };
    [[-1, 0x3a8a4a], [1, 0xa83a3a]].forEach(([side, teamColor]) => {
        const cx = Bg.x + side * 80, cz = Bg.z;
        const castle = new THREE.Group();
        const stone = new THREE.MeshLambertMaterial({ map: stoneT, color: teamColor });
        const trim = new THREE.MeshLambertMaterial({ color: teamColor });
        // Back and side walls.
        makeBlock(2, 7, 32, cx - side * 13, 3.5, cz, stone, castle);
        makeBlock(28, 7, 2, cx, 3.5, cz - 15, stone, castle);
        makeBlock(28, 7, 2, cx, 3.5, cz + 15, stone, castle);
        // The inward-facing front wall is split around the gate opening.
        // Keep its sections in a separate group so they can disappear at zero.
        const inwardX = cx - side * 13;
        const frontWall = new THREE.Group();
        makeBlock(2, 7, 11, inwardX, 3.5, cz - 10.5, stone, frontWall);
        makeBlock(2, 7, 11, inwardX, 3.5, cz + 10.5, stone, frontWall);
        castle.add(frontWall);
        // Corner towers make the castle easy to recognize from a distance.
        for (const dx of [-13, 13]) for (const dz of [-15, 15]) {
            makeBlock(5, 10, 5, cx + dx, 5, cz + dz, trim, castle);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 4, 4), new THREE.MeshLambertMaterial({ color: side < 0 ? 0x2855a0 : 0x8d2424 }));
            roof.position.set(cx + dx, 12, cz + dz);
            roof.rotation.y = Math.PI / 4;
            castle.add(roof);
        }
        S.add(castle);
        bgCastles.push(castle);
        // Portcullis bars across the doorway; hidden when the countdown ends.
        const gate = new THREE.Group();
        const gateMat = new THREE.MeshLambertMaterial({ color: 0x4a3420, metalness: .25, roughness: .7 });
        makeBlock(.7, 6.2, 7.5, inwardX, 3.1, cz, gateMat, gate);
        for (let z = -3.2; z <= 3.21; z += 1.05) makeBlock(1, 6.8, .18, inwardX, 3.4, cz + z, gateMat, gate);
        for (let y = .7; y <= 6.1; y += 1.3) makeBlock(1, .22, 8.1, inwardX, y, cz, gateMat, gate);
        gate.position.y = 0;
        S.add(gate);
        bgGates.push({ mesh: gate, frontWall, side, gateX: inwardX, centerX: cx, centerZ: cz });
    });
    [[0, 0], [0, -45], [0, 45]].forEach(([dx, dz]) => {
        const x = Bg.x + dx, z = Bg.z + dz, pole = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 7, 6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a })), fm = new THREE.MeshBasicMaterial({ color: 0xdddddd }), flag = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, .1), fm), rm = new THREE.MeshBasicMaterial({ color: 0xdddddd, side: 2, transparent: true, opacity: .7 }), ring = new THREE.Mesh(new THREE.RingGeometry(6, 7, 32), rm);
        pole.position.set(x, 3.5, z);
        flag.position.set(x + 1, 6.2, z);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, .15, z);
        S.add(pole, flag, ring);
        PTS.push({ x, z, prog: 0, own: -1, fm, rm });
    });
    for (let i = 0; i < 14; i++) {
        const a = rnd(0, 6.28), d = rnd(15, 70), r = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(1, 2.2)), TM(rockT));
        r.position.set(Bg.x + Math.cos(a) * d, .8, Bg.z + Math.sin(a) * d);
        r.castShadow = true;
        S.add(r);
    }
    // Things the camera must not pass through: arena walls, pillars, castle blocks and gates.
    camBlock = [];
    S.children.forEach(o => { if (o.isMesh && o.geometry && o.geometry.type == 'CylinderGeometry' && o.geometry.parameters && (o.geometry.parameters.openEnded || o.geometry.parameters.radiusTop > .5))
        camBlock.push(o); });
    const addBoxes = g => g.traverse(o => { if (o.isMesh && o.geometry.type == 'BoxGeometry')
        camBlock.push(o); });
    bgCastles.forEach(addBoxes);
    bgGates.forEach(g => addBoxes(g.mesh));
}
function mkBot(cls, team, x, z, idx) {
    const k = CL[cls], mesh = hero(k.col, cls), spc = (cls == 'warrior' || cls == 'paladin') ? applySpec(mesh, Math.random() < .5 ? 'melee' : 'tank') : 0;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = team ? -Math.PI / 2 : Math.PI / 2;
    S.add(mesh);
    mesh.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
        o.castShadow = true; });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.95, 20), new THREE.MeshBasicMaterial({ color: team ? 0xff3333 : 0x33ff66, transparent: true, opacity: .65 }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = .08;
    mesh.add(disc);
    const grp = new THREE.Group(), fg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .2), new THREE.MeshBasicMaterial({ color: team ? 0xdd3333 : 0x33cc55 }));
    grp.add(new THREE.Mesh(new THREE.PlaneGeometry(1.9, .26), new THREE.MeshBasicMaterial({ color: 0 }), fg));
    grp.add(fg);
    fg.position.z = .01;
    S.add(grp);
    const mx = k.hp + 20 * (PVPL - 1);
    return { bot: 1, ally: !team, team, cls, mesh, pos: mesh.position, hp: mx, max: mx, lvl: PVPL, name: CNAME(cls) + (team ? ' (Enemy)' : ' (Ally)'), cd: rnd(0, 1), sw: 0, slow: 0, aggro: false, mv: 0, rng: ['mage', 'hunter', 'warlock', 'priest', 'druid'].includes(cls), k: WB_K[cls] || 1.5, bgp: grp, fg, id: idx, dead: false, rs: 0 };
}
function foeHit(t, d, src) { if (G.cd > 0 || t.dead)
    return; if (!(d >= 0)) d = 1; if (!(t.hp >= -1e9)) t.hp = t.max || 1; if (t === P && P.stealth)
    stealthOff(); if (t === P && ADM.ignore && !G.on && !DU && !(src && (src.bot || src.wb)))
    return; if (t === P) {
    d = Math.max(1, Math.round(d * specT()));
    if (P.shield > 0) {
        const a = Math.min(P.shield, d);
        P.shield -= a;
        d -= a;
    }
    if (ADM.thorns && src)
        thornsQ.push(src);
    P.hp -= d;
    float(P.pos, d ? '-' + d : 'absorbed', d ? '#f55' : '#8cf');
    if (d > 0) {
        P.cast = null;
        if (P.mount)
            dismount();
    }
}
else if (t.mn)
    mnHurt(t, d);
else if (t.wb)
    wbPitHurt(t, d, src);
else {
    t.hp -= d;
    float(t.pos, '-' + d, '#f77');
    if (t.hp <= 0)
        botKill(t);
} }
function botKill(b) { if (b.dead)
    return; const i = mobs.indexOf(b); if (i >= 0)
    mobs.splice(i, 1); b.dead = true; b.rs = 8; if (P.t === b)
    P.t = null; dying.push({ m: b.mesh, t: 0, y0: b.pos.y }); b.bgp.visible = false; burst(b.pos, 0xcc2222, 14); if (G.mode == 'bg' && !G.over)
    G.sc[1 - b.team] += 5; say(b.name + ' was defeated!'); }
function respawnBot(b) { const c = G.c; b.hp = b.max; b.dead = false; b.pos.set(c.x + (b.team ? 80 : -80), 0, c.z + (b.id - 2) * 4); b.mesh.scale.setScalar(1); b.mesh.rotation.set(0, b.team ? -Math.PI / 2 : Math.PI / 2, 0); S.add(b.mesh); if (!b.ally)
    mobs.push(b); b.bgp.visible = true; b.cd = 1; }
function botAI(b, dt, t) {
    if (!(b.hp >= -1e9))
        b.hp = b.max;
    b.bgp.visible = !b.dead;
    b.bgp.position.set(b.pos.x, 3.6, b.pos.z);
    b.bgp.quaternion.copy(cam.quaternion);
    b.fg.scale.x = Math.max(.001, b.hp / b.max);
    if (b.dead || G.cd > 0 || G.over)
        return;
    if (b.stun > 0) {
        b.stun -= dt;
        b.mv = 0;
        return;
    }
    b.slow = Math.max(0, b.slow - dt);
    b.cd -= dt;
    b.mv = 0;
    const mates = b.ally ? bots.filter(a => a.ally && !a.dead).concat(P.dead ? [] : [P]) : mobs.filter(m => m.bot), foes = b.ally ? mobs.filter(m => m.bot) : bots.filter(a => a.ally && !a.dead).concat(P.dead ? [] : [P]).concat(mins.filter(m => !m.dead));
    let tg = null, bd = 1e9;
    foes.forEach(f => { const d = d3(f, b); if (d < bd) {
        bd = d;
        tg = f;
    } });
    const goal = G.mode == 'bg' && (!tg || bd > 20) ? PTS[b.id % 3] : null, sp = (5.4 + b.lvl * .15) * (b.slow > 0 ? .45 : 1), go = (x, z, s) => { const dx = x - b.pos.x, dz = z - b.pos.z, l = Math.hypot(dx, dz) || 1; b.pos.x += dx / l * s * dt; b.pos.z += dz / l * s * dt; b.mesh.rotation.y = Math.atan2(dx, dz); b.mv = 1; };
    if (goal) {
        if (Math.hypot(goal.x - b.pos.x, goal.z - b.pos.z) > 3)
            go(goal.x, goal.z, sp);
    }
    else if (tg) {
        const R = b.rng ? 15 : 3;
        if (bd > R)
            go(tg.pos.x, tg.pos.z, sp);
        else {
            if (b.rng && bd < 6)
                go(2 * b.pos.x - tg.pos.x, 2 * b.pos.z - tg.pos.z, sp * .8);
            else
                b.mesh.rotation.y = Math.atan2(tg.pos.x - b.pos.x, tg.pos.z - b.pos.z);
            if (b.cd <= 0) {
                const dm = Math.round((10 + PVPL * 3) * b.k * rnd(.85, 1.15) * (b.ally ? 1 : G.diff));
                b.sw = .3;
                const low = mates.filter(m => m.hp / m.max < .55).sort((p, q) => p.hp / p.max - q.hp / q.max)[0];
                if (b.cls == 'priest' && low) {
                    low.hp = Math.min(low.max, low.hp + Math.round(low.max * .28));
                    float(low.pos, '+heal', '#6f6');
                    burst(low.pos, 0x66ff88, 8, 1.2);
                    b.cd = 2.5;
                }
                else {
                    b.cd = b.rng ? 1.5 : 1;
                    if (b.rng) {
                        const col = { mage: 0xff7711, warlock: 0x66e0ff, druid: 0x9dff6a, hunter: 0xddddaa, priest: 0xffee99 }[b.cls], o = new THREE.Mesh(new THREE.SphereGeometry(b.cls == 'hunter' ? .18 : .33, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
                        o.position.copy(b.pos);
                        o.position.y += 2;
                        S.add(o);
                        bolts.push({ b: o, m: tg, d: dm, c: col, src: b });
                    }
                    else
                        foeHit(tg, dm, b);
                }
            }
        }
    }
    if (G.on) {
        const dx = b.pos.x - G.c.x, dz = b.pos.z - G.c.z, l = Math.hypot(dx, dz);
        if (l > G.r - 1.5) {
            b.pos.x = G.c.x + dx / l * (G.r - 1.5);
            b.pos.z = G.c.z + dz / l * (G.r - 1.5);
        }
    }
    const sw = b.mv ? Math.sin(t * 12 + b.id) * .8 : 0;
    b.mesh.legs[0].rotation.x = sw;
    b.mesh.legs[1].rotation.x = -sw;
    b.mesh.arm.rotation.x = -sw * .8;
    b.sw = Math.max(0, b.sw - dt);
    heroSwing(b.mesh, b.sw);
}
function pvpPlayerDown() { if (P.dead)
    return; P.dead = true; P.rs = 8; P.hp = 0; P.t = null; dismount(); P.cast = null; P.mesh.visible = false; burst(P.pos, 0xcc2222, 16); if (G.mode == 'bg' && !G.over)
    G.sc[1] += 5; bn(G.mode == 'bg' ? 'You died — respawning in 8s' : 'You were eliminated!', 2500); }
function startMatch(mode) {
    if (DG.on)
        return say('Leave the dungeon first.');
    cancelDuel(true);
    dismissMinions();
    cancelGround(true);
    if (G.on)
        return say('Leave your current match first.');
    if (!running)
        return;
    $('pv').style.display = 'none';
    dismount();
    P.cast = null;
    buildPvP();
    const c = PV[mode], n = { duel: [0, 1], arena: [2, 3], bg: [4, 5] }[mode], bxx = mode == 'bg' ? 80 : mode == 'arena' ? 24 : 10, cls = Object.keys(CL);
    Object.assign(G, { on: true, mode, c, r: c.r, over: false, cd: mode == 'bg' ? 20 : 3, sc: [0, 0], tk: 0 });
    PTS.forEach(p => { p.prog = 0; p.own = -1; });
    pvpStats(true);
    bots = [];
    P.t = null;
    P.hp = P.max;
    P.mp = P.mmax;
    P.cds = [0, 0, 0, 0];
    P.dead = false;
    P.shield = 0;
    P.mesh.visible = true;
    P.pos.set(c.x - bxx, 0, c.z);
    if (mode == 'bg') { P.pos.x = c.x - 80; P.pos.z = c.z; bgGates.forEach(g => { g.mesh.visible = true; g.frontWall.visible = true; }); }
    P.by = 0;
    P.jy = 0;
    P.vy = 0;
    yaw = -Math.PI / 2;
    P.mesh.rotation.y = Math.PI / 2;
    shf(cls).slice(0, n[0]).forEach((k, i) => bots.push(mkBot(k, 0, c.x - bxx, c.z + (i % 2 ? 1 : -1) * (Math.floor(i / 2) + 1) * 4, i)));
    shf(cls).slice(0, n[1]).forEach((k, j) => { const b = mkBot(k, 1, c.x + bxx, c.z + (j - (n[1] - 1) / 2) * 4, j); bots.push(b); mobs.push(b); });
    say({ duel: 'Duel started!', arena: 'Arena: 3v3 — wipe the enemy team!', bg: 'Battleground: hold the flags, first to 300!' }[mode]);
    bn(mode == 'bg' ? 'BATTLE STARTS IN 20' : '3', 0);
}
function leaveMatch(f) { if (!G.on)
    return; pvpStats(false); dismissMinions(); bots.forEach(b => { S.remove(b.mesh); S.remove(b.bgp); const i = mobs.indexOf(b); if (i >= 0)
    mobs.splice(i, 1); }); bots = []; G.on = false; G.cd = 0; P.dead = false; P.mesh.visible = true; P.t = null; P.hp = P.max; P.mp = P.mmax; P.by = 0; P.jy = 0; P.pos.set(0, 0, -3); $('bn').style.display = 'none'; $('pvh').style.display = 'none'; if (!f)
    say('You left the match.'); }
function endMatch(win) { if (G.over)
    return; G.over = true; const r = { duel: 1, arena: 2, bg: 4 }[G.mode], xp = win ? P.lvl * 20 * r : P.lvl * 6 * r, g = win ? 10 * r * P.lvl : 2 * r; addXP(xp); P.gold += g; bn(win ? '🏆 VICTORY!' : '💀 DEFEAT', 4000); say((win ? 'Victory' : 'Defeat') + '! +' + xp + ' xp, +' + g + ' gold'); setTimeout(() => { if (G.on && G.over)
    leaveMatch(1); }, 4500); }
function pvpTick(dt, t) {
    if (!G.on)
        return;
    if (G.cd > 0) {
        G.cd -= dt;
        if (G.cd <= 0) {
            G.cd = 0;
            if (G.mode == 'bg') bgGates.forEach(g => { g.mesh.visible = false; g.frontWall.visible = false; });
            bn('⚔️ FIGHT!', 1200);
            if (G.mode == 'bg') say('The castle gates are open! Capture the flags!');
        }
        else if (G.mode == 'bg') bn('BATTLE STARTS IN ' + Math.ceil(G.cd), 0);
        else bn(String(Math.ceil(G.cd)), 0);
    }
    bots.forEach(b => { if (b.ally)
        botAI(b, dt, t); if (b.dead && G.mode == 'bg' && !G.over) {
        b.rs -= dt;
        if (b.rs <= 0)
            respawnBot(b);
    } });
    const e = mobs.filter(m => m.bot).length, a = bots.filter(b => b.ally && !b.dead).length + (P.dead ? 0 : 1);
    if (G.mode == 'bg' && !G.over && G.cd <= 0) {
        PTS.forEach(p => {
            let na = 0, ne = 0;
            bots.forEach(b => { if (!b.dead && Math.hypot(b.pos.x - p.x, b.pos.z - p.z) < 7)
                b.team ? ne++ : na++; });
            if (!P.dead && Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < 7)
                na++;
            if (!(na && ne))
                p.prog = Math.max(-100, Math.min(100, p.prog + (na - ne) * 14 * dt));
            if (p.prog >= 100)
                p.own = 0;
            else if (p.prog <= -100)
                p.own = 1;
            else if ((p.own == 0 && p.prog <= 0) || (p.own == 1 && p.prog >= 0))
                p.own = -1;
            const c = p.own == 0 ? 0x33ff66 : p.own == 1 ? 0xff3333 : p.prog > 0 ? 0x99ddaa : p.prog < 0 ? 0xddaaaa : 0xdddddd;
            p.fm.color.setHex(c);
            p.rm.color.setHex(c);
        });
        G.tk += dt;
        if (G.tk >= 1) {
            G.tk = 0;
            PTS.forEach(p => { if (p.own >= 0)
                G.sc[p.own] += 2; });
        }
        if (G.sc[0] >= 300)
            endMatch(1);
        else if (G.sc[1] >= 300)
            endMatch(0);
        if (P.dead) {
            P.rs -= dt;
            if (P.rs <= 0) {
                P.dead = false;
                P.hp = P.max;
                P.mp = P.mmax;
                P.mesh.visible = true;
                P.pos.set(G.c.x - 80, 0, G.c.z);
                say('You respawned.');
            }
        }
    }
    if (G.mode != 'bg' && !G.over && G.cd <= 0) {
        if (e === 0)
            endMatch(1);
        else if (a === 0)
            endMatch(0);
    }
    const h = $('pvh'), s = (G.mode == 'bg' ? '🚩 Battleground<br><span style="color:#6f6">Allies ' + G.sc[0] + '</span> / 300 · <span style="color:#f66">Enemies ' + G.sc[1] + '</span> / 300<br>Flags: ' + PTS.map(p => p.own == 0 ? '🟢' : p.own == 1 ? '🔴' : '⚪').join(' ') : (G.mode == 'duel' ? '🤺 Duel' : '🏟️ Arena') + '<br><span style="color:#6f6">Allies ' + a + '</span> vs <span style="color:#f66">Enemies ' + e + '</span>') + '<br><button onclick="leaveMatch()" style="padding:2px 10px;font-size:12px;margin:4px 0 0">🚪 Leave</button>';
    h.style.display = 'block';
    if (h.dataset.s !== s) {
        h.dataset.s = s;
        h.innerHTML = s;
    }
}
function togglePvP() { if (!running)
    return; const p = $('pv'); p.style.display = p.style.display == 'flex' ? 'none' : 'flex'; renderPvP(); }
function renderPvP() { const D = [['Easy', .6], ['Normal', 1], ['Hard', 1.4]]; $('pv').innerHTML = `<div class="mp" style="min-width:min(560px,92vw);text-align:center"><b style="color:var(--gold)">⚔️ PvP — Fight the Bots</b><span onclick="togglePvP()" style="float:right;cursor:pointer">✕</span><div style="margin:8px 0;font-size:12px;opacity:.8">AI champions of every class. Win for XP and gold. Levels and gear don't count in PvP — everyone fights at equal power. O or Esc to close.</div><div style="margin-bottom:10px">Difficulty: ${D.map(([n, v]) => `<button onclick="G.diff=${v};renderPvP()" style="padding:4px 12px;font-size:13px;${G.diff == v ? 'border-color:#fff;background:#5a4318' : ''}">${n}</button>`).join('')}</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${[['duel', '🤺', 'Duel', '1 vs 1 · last one standing'], ['arena', '🏟️', 'Arena', '3 vs 3 · wipe the other team'], ['bg', '🚩', 'Battleground', '5 vs 5 · hold 3 flags, first to 300']].map(([k, e, n, d]) => `<div class="sl" onclick="startMatch('${k}')" style="cursor:pointer;width:150px;height:140px;background:radial-gradient(circle at 50% 35%,#7a3a1a,#050505 85%)"><i class="ic" style="font-size:46px;top:10px">${e}</i><span style="font-size:13px;bottom:48px;background:none">${n}</span><em style="bottom:6px;color:#fff;font-size:11px;white-space:normal;padding:0 4px">${d}</em></div>`).join('')}</div></div>`; }
// ===== World adventurer bots (roam the starting zone, level up, duelable in town) =====
let wbots = [], DU = null, duelRingM = null, selB = null;
const WB_NAMES = ['Aldric', 'Brynn', 'Kael', 'Mira', 'Thorin', 'Lyra', 'Doran', 'Selene', 'Varek', 'Isolde', 'Fenn', 'Orla', 'Gareth', 'Nyx', 'Rurik', 'Tamsin'];
const WB_K = { warrior: 1.3, rogue: 1.7, paladin: 1.4, mage: 1.8, warlock: 1.7, hunter: 1.5, priest: 1.2, druid: 1.5 };
const WB_HOME = [[-7, -3], [6, 0], [0, 11]];
function wbLabelDraw(b) {
    const g = b.lc.getContext('2d'), pct = Math.max(0, b.hp / b.max);
    g.clearRect(0, 0, 256, 64);
    g.font = 'bold 24px Georgia';
    g.textAlign = 'center';
    g.lineWidth = 5;
    g.strokeStyle = '#000';
    const s = b.name + '  Lv ' + b.lvl + (b.role == 'town' || b.pit ? '  ⚔' : '');
    g.strokeText(s, 128, 26);
    g.fillStyle = b.pit ? '#ff7777' : b.role == 'town' ? '#ffe48a' : '#9fd8ff';
    g.fillText(s, 128, 26);
    g.fillStyle = 'rgba(0,0,0,.75)';
    g.fillRect(48, 36, 160, 12);
    g.fillStyle = pct > .5 ? '#3c3' : pct > .25 ? '#ec3' : '#e33';
    g.fillRect(49, 37, 158 * pct, 10);
    b.lt.needsUpdate = true;
    b.lk = b.lvl + ':' + Math.round(pct * 20) + (b.pit ? 'p' : '');
}
function mkWB(cls, role, x, z, name, lvl) {
    const k = CL[cls], mesh = hero(k.col, cls), spc = (cls == 'warrior' || cls == 'paladin') ? applySpec(mesh, Math.random() < .5 ? 'melee' : 'tank') : 0;
    mesh.position.set(x, 0, z);
    S.add(mesh);
    mesh.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
        o.castShadow = true; });
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const lt = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true }));
    sp.scale.set(4.4, 1.1, 1);
    S.add(sp);
    const mx = k.hp + 20 * (lvl - 1);
    const b = { wb: 1, name, cls, role, mesh, pos: mesh.position, lvl, xp: 0, hp: mx, max: mx, cd: rnd(0, 1), sw: 0, slow: 0, mv: 0, aggro: false, dead: false, rs: 0, rng: ['mage', 'hunter', 'warlock', 'priest', 'druid'].includes(cls), k: WB_K[cls], lc: c, lt, label: sp, tgt: null, wp: null, home: { x, z }, idle: rnd(1, 4), tr: 0, id: wbots.length, hc: 0, lk: '' };
    wbLabelDraw(b);
    wbots.push(b);
    return b;
}
function wbInit() {
    wbClear();
    const cls = shf(Object.keys(CL)), nm = shf(WB_NAMES);
    WB_HOME.forEach(([x, z], i) => { const b = mkWB(cls[i], 'town', x, z, nm[i], 1 + (i % 2)); b.mesh.rotation.y = Math.atan2(-x, -z); });
    for (let i = 0; i < 5; i++) {
        const a = rnd(0, 6.28), d = TOWN + rnd(4, 20);
        mkWB(cls[(i + 3) % 7], 'hunter', Math.cos(a) * d, Math.sin(a) * d, nm[3 + i], 1);
    }
}
function wbClear() {
    cancelDuel(true);
    wbots.forEach(b => { S.remove(b.mesh); S.remove(b.label); const i = mobs.indexOf(b); if (i >= 0)
        mobs.splice(i, 1); });
    wbots = [];
    selB = null;
    if ($('bp'))
        $('bp').style.display = 'none';
}
function wbXP(b, x) {
    b.xp += x;
    while (b.xp >= Math.round(30 * Math.pow(b.lvl, 1.5))) {
        b.xp -= Math.round(30 * Math.pow(b.lvl, 1.5));
        b.lvl++;
        b.max = CL[b.cls].hp + 20 * ((b.pit ? PVPL : b.lvl) - 1);
        b.hp = b.max;
        burst(b.pos, 0xffee55, 24, 2);
        float(b.pos, '⬆ Lv ' + b.lvl, '#ffe066');
        if (d3(b, P) < 60)
            say('<span style="color:#9fd8ff">' + b.name + ' reached level ' + b.lvl + '!</span>');
    }
}
function wbHurt(b, d) { if (b.dead)
    return; b.hp -= d; float(b.pos, '-' + d, '#f99'); if (b.hp <= 0)
    wbKill(b); }
function wbKill(b) {
    if (b.dead)
        return;
    if (b.pit)
        pitFlag(b, false);
    b.pitMode = null;
    b.dead = true;
    b.rs = 12;
    b.tgt = null;
    dying.push({ m: b.mesh, t: 0, y0: b.pos.y });
    b.label.visible = false;
    burst(b.pos, 0xcc2222, 12);
    const i = mobs.indexOf(b);
    if (i >= 0)
        mobs.splice(i, 1);
    if (P.t === b)
        P.t = null;
    if (selB === b)
        closeBP();
    if (d3(b, P) < 60)
        say(b.name + ' fell in battle...');
}
function wbRespawn(b) {
    const a = rnd(0, 6.28), home = b.role == 'town';
    b.hp = b.max;
    b.dead = false;
    b.pos.set(home ? b.home.x : Math.cos(a) * (TOWN - 3), 0, home ? b.home.z : Math.sin(a) * (TOWN - 3));
    b.mesh.scale.setScalar(1);
    b.mesh.rotation.set(0, 0, 0);
    S.add(b.mesh);
    b.label.visible = true;
    b.tgt = null;
}
function wbHitMob(m, d, b) {
    if (mobs.indexOf(m) < 0 || m.bot || m.wb)
        return;
    m.hp -= d;
    m.bt = b;
    float(m.pos, d, '#9fd8ff');
    burst(m.pos, 0xffaa33, 3);
    if (m.hp <= 0) {
        dying.push({ m: m.mesh, t: 0 });
        m.mesh.bar.forEach(x => x.visible = false);
        burst(m.pos, 0xcc2222, 10);
        mobs.splice(mobs.indexOf(m), 1);
        if (P.t === m)
            P.t = null;
        if (b) {
            b.tgt = null;
            wbXP(b, 10 + m.lvl * 8);
        }
        setTimeout(spawn, 6000);
    }
}
function wbSwing(b, tg, dm, byMob) {
    b.sw = .3;
    b.cd = b.rng ? 1.5 : 1;
    if (b.rng) {
        const col = { mage: 0xff7711, warlock: 0x66e0ff, druid: 0x9dff6a, hunter: 0xddddaa, priest: 0xffee99 }[b.cls], o = new THREE.Mesh(new THREE.SphereGeometry(b.cls == 'hunter' ? .18 : .33, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
        o.position.copy(b.pos);
        o.position.y += 2;
        S.add(o);
        bolts.push({ b: o, m: tg, d: dm, c: col, wbBy: byMob ? b : null, src: b });
    }
    else if (byMob)
        wbHitMob(tg, dm, b);
    else
        foeHit(tg, dm, b);
}
function wbAI(b, dt, t) {
    b.slow = Math.max(0, b.slow - dt);
    b.cd -= dt;
    b.hc -= dt;
    b.mv = 0;
    b.sw = Math.max(0, b.sw - dt);
    if (b.stun > 0) {
        b.stun -= dt;
        return;
    }
    const go = (x, z, s) => { const dx = x - b.pos.x, dz = z - b.pos.z, l = Math.hypot(dx, dz) || 1; if (l < .3)
        return; b.pos.x += dx / l * s * dt; b.pos.z += dz / l * s * dt; b.mesh.rotation.y = Math.atan2(dx, dz); b.mv = 1; };
    const face = o => { b.mesh.rotation.y = Math.atan2(o.pos.x - b.pos.x, o.pos.z - b.pos.z); };
    const sp = (5 + b.lvl * .2) * (b.slow > 0 ? .45 : 1), inTown = Math.hypot(b.pos.x, b.pos.z) < TOWN;
    // --- duel with the player ---
    if (DU && DU.b === b) {
        if (DU.cd > 0 || DU.over) {
            face(P);
            return;
        }
        let T = P;
        {
            let best = P.dead ? 1e9 : d3(b, P);
            mins.forEach(m => { if (!m.dead) {
                const d = d3(b, m);
                if (d < best - 1.5) {
                    best = d;
                    T = m;
                }
            } });
        }
        const bd = d3(b, T), R = b.rng ? 15 : 3;
        if (bd > R)
            go(T.pos.x, T.pos.z, sp);
        else {
            if (b.rng && bd < 6)
                go(2 * b.pos.x - T.pos.x, 2 * b.pos.z - T.pos.z, sp * .8);
            else
                face(T);
            if (b.cd <= 0) {
                if (b.cls == 'priest' && b.hp < b.max * .45 && b.hc <= 0) {
                    b.hp = Math.min(b.max, b.hp + Math.round(b.max * .25));
                    b.hc = 8;
                    b.cd = 2;
                    float(b.pos, '+heal', '#6f6');
                    burst(b.pos, 0x66ff88, 8, 1.2);
                }
                else
                    wbSwing(b, T, Math.round((10 + PVPL * 3) * b.k * rnd(.85, 1.15) * G.diff), false);
            }
        }
        return;
    }
    b.hp = Math.min(b.max, b.hp + b.max * (inTown ? .1 : .01) * dt);
    // --- townsfolk: stand around, train, wait for a duel ---
    if (b.role == 'town') {
        b.tr += dt;
        if (b.tr > 14) {
            b.tr = 0;
            wbXP(b, 4 + b.lvl * 2);
        }
        b.idle -= dt;
        if (b.wp) {
            go(b.wp.x, b.wp.z, 2.2);
            if (Math.hypot(b.wp.x - b.pos.x, b.wp.z - b.pos.z) < .5)
                b.wp = null;
        }
        else if (b.idle <= 0) {
            b.idle = rnd(5, 11);
            b.wp = { x: b.home.x + rnd(-3, 3), z: b.home.z + rnd(-3, 3) };
        }
        else if (d3(P, b) < 8)
            face(P);
        return;
    }
    // --- the Pit: sometimes dive in and brawl ---
    if (b.pitMode) {
        pitAI(b, dt, go, face, sp);
        return;
    }
    b.pitCd = (b.pitCd === undefined ? rnd(20, 60) : b.pitCd) - dt;
    if (b.pitCd <= 0 && !b.tgt && b.hp > b.max * .7) {
        b.pitCd = rnd(45, 110);
        if (Math.random() < .6) {
            b.pitMode = 'go';
            b.pitT = rnd(25, 45);
            b.pitIdle = 0;
        }
    }
    // --- adventurers: hunt monsters in the starting zone and level up ---
    if (b.hp < b.max * .35 && !inTown) {
        b.tgt = null;
        go(0, 0, sp * 1.1);
        return;
    }
    if (inTown && b.hp < b.max * .9)
        return;
    if (b.tgt && mobs.indexOf(b.tgt) < 0)
        b.tgt = null;
    if (!b.tgt) {
        let best = null, bdm = 45;
        mobs.forEach(m => { if (m.bot || m.wb)
            return; const d = d3(m, b); if (d < bdm && m.lvl <= b.lvl + 1) {
            bdm = d;
            best = m;
        } });
        b.tgt = best;
    }
    if (b.tgt) {
        const m = b.tgt, bd = d3(m, b), R = b.rng ? 14 : 2.8;
        if (b.rng && bd < 5)
            go(2 * b.pos.x - m.pos.x, 2 * b.pos.z - m.pos.z, sp * .7);
        else if (bd > R)
            go(m.pos.x, m.pos.z, sp);
        else {
            face(m);
            if (b.cd <= 0)
                wbSwing(b, m, Math.round((10 + b.lvl * 3) * b.k * rnd(.85, 1.15)), true);
        }
    }
    else {
        if (!b.wp || Math.hypot(b.wp.x - b.pos.x, b.wp.z - b.pos.z) < 2) {
            const R = Math.min(b.lvl >= 5 ? WORLD - 12 : R0 - 8, (b.lvl + 1) * 24), a = rnd(0, 6.28), d = rnd(TOWN + 6, Math.max(TOWN + 12, R));
            b.wp = { x: Math.cos(a) * d, z: Math.sin(a) * d };
        }
        go(b.wp.x, b.wp.z, sp * .8);
    }
}
function wbTick(dt, t) {
    if (!wbots.length)
        return;
    wbots.forEach(b => {
        if (b.dead) {
            b.rs -= dt;
            if (b.rs <= 0)
                wbRespawn(b);
            return;
        }
        wbAI(b, dt, t);
        b.pos.x = Math.max(-WORLD + 3, Math.min(WORLD - 3, b.pos.x));
        b.pos.z = Math.max(-WORLD + 3, Math.min(WORLD - 3, b.pos.z));
        b.pos.y = groundH(b.pos.x, b.pos.z);
        const sw = b.mv ? Math.sin(t * 12 + b.id) * .8 : 0;
        b.mesh.legs[0].rotation.x = sw;
        b.mesh.legs[1].rotation.x = -sw;
        b.mesh.arm.rotation.x = -sw * .8;
        heroSwing(b.mesh, b.sw);
        b.label.position.set(b.pos.x, 3.7, b.pos.z);
        b.label.visible = d3(b, P) < 70;
        if (b.lk !== b.lvl + ':' + Math.round(Math.max(0, b.hp / b.max) * 20) + (b.pit ? 'p' : ''))
            wbLabelDraw(b);
    });
    if (DU && !DU.over) {
        if (G.on || P.dead || DU.b.dead || d3(DU.b, P) > 40)
            cancelDuel();
        else if (DU.cd > 0) {
            DU.cd -= dt;
            if (DU.cd <= 0) {
                DU.cd = 0;
                bn('⚔️ FIGHT!', 1000);
            }
            else
                bn(String(Math.ceil(DU.cd)), 0);
        }
    }
    if (selB) {
        if (selB.dead || d3(selB, P) > 30)
            closeBP();
        else
            renderBP();
    }
}
// ----- Duel -----
function startDuel(b) {
    if (!b || DU || G.on || P.dead || DG.on)
        return;
    if (Math.hypot(P.pos.x, P.pos.z) > TOWN + 6 || Math.hypot(b.pos.x, b.pos.z) > TOWN + 6)
        return say('Duels are fought in town.');
    if (b.dead || b.tgt || b.pitMode)
        return say(b.name + ' is busy.');
    dismount();
    P.cast = null;
    closeBP();
    dismissMinions();
    cancelGround(true);
    pvpStats(true);
    P.hp = P.max;
    P.mp = P.mmax;
    P.cds = [0, 0, 0, 0];
    P.shield = 0;
    b.max = CL[b.cls].hp + 20 * (PVPL - 1);
    b.hp = b.max;
    b.hc = 0;
    b.wp = null;
    DU = { b, cd: 3, over: false };
    b.aggro = false;
    mobs.push(b);
    P.t = b;
    duelRingM = new THREE.Mesh(new THREE.RingGeometry(13, 14, 48), new THREE.MeshBasicMaterial({ color: 0xffcc44, side: 2, transparent: true, opacity: .7 }));
    duelRingM.rotation.x = -Math.PI / 2;
    duelRingM.position.set((P.pos.x + b.pos.x) / 2, .3, (P.pos.z + b.pos.z) / 2);
    S.add(duelRingM);
    say('Duel with ' + b.name + ' (Lv ' + b.lvl + ') — first to fall loses!');
    bn('3', 0);
}
function cancelDuel(silent) {
    if (!DU)
        return;
    const b = DU.b;
    if (duelRingM) {
        S.remove(duelRingM);
        duelRingM = null;
    }
    const i = mobs.indexOf(b);
    if (i >= 0)
        mobs.splice(i, 1);
    b.aggro = false;
    b.dot = null;
    b.slow = 0;
    b.max = CL[b.cls].hp + 20 * (b.lvl - 1);
    b.hp = b.max;
    dismissMinions();
    pvpStats(false);
    if (P.t === b)
        P.t = null;
    DU = null;
    if (!silent)
        bn('Duel cancelled', 1500);
}
function duelEnd(win) {
    if (!DU || DU.over)
        return;
    DU.over = true;
    const b = DU.b;
    if (win) {
        const xp = 10 * P.lvl + 20, g = 5 * P.lvl + 5;
        addXP(xp);
        P.gold += g;
        wbXP(b, 5 * P.lvl);
        bn('🏆 You won the duel!', 3000);
        say('You defeated ' + b.name + '! +' + xp + ' xp, +' + g + ' gold');
    }
    else {
        wbXP(b, 15 * P.lvl + 10);
        bn('💀 You lost the duel', 3000);
        say(b.name + ' wins the duel.');
    }
    setTimeout(() => { if (DU && DU.b === b) {
        P.hp = Math.max(P.hp, Math.round(P.max * .5));
        cancelDuel(true);
    } }, 2500);
}
// ----- Hero panel -----
function selBot(b) { selB = b; $('bp').dataset.s = ''; renderBP(); $('bp').style.display = 'block'; if (mobs.indexOf(b) >= 0)
    P.t = b; }
function closeBP() { selB = null; $('bp').style.display = 'none'; }
function nearBot() {
    let best = null, bd = 16;
    wbots.forEach(b => { const d = d3(b, P); if (!b.dead && d < bd) {
        bd = d;
        best = b;
    } });
    if (best)
        selBot(best);
    else
        say('No hero nearby.');
}
function renderBP() {
    const b = selB, p = $('bp');
    if (!b)
        return;
    const inT = Math.hypot(P.pos.x, P.pos.z) <= TOWN + 6 && Math.hypot(b.pos.x, b.pos.z) <= TOWN + 6, can = !DU && !G.on && !b.tgt && !b.dead;
    const st = DU && DU.b === b ? 'Dueling you' : b.pit ? 'Fighting in the Pit (PvP)' : b.tgt ? 'Fighting monsters' : b.role == 'town' ? 'Resting in town' : 'Adventuring';
    const hint = DU ? '' : !inT ? 'Duels are fought in town' : !can ? 'Busy right now' : '';
    const s = `<b style="color:var(--gold)">${b.name}</b> · Lv ${b.lvl} ${CNAME(b.cls)}<br><small>${st}</small><div class="bar"><i style="background:#c33;width:${Math.round(Math.max(0, b.hp / b.max) * 20) * 5}%"></i></div><div style="margin-top:6px">` + (can && inT ? `<button onclick="startDuel(selB)" style="padding:4px 12px;font-size:13px;margin:0 4px">⚔️ Duel</button><br><small style="opacity:.7">Levels don't count in duels</small>` : `<small style="opacity:.8">${hint}</small>`) + `<button onclick="closeBP()" style="padding:4px 10px;font-size:13px;margin:0 4px">✕</button></div>`;
    if (p.dataset.s !== s) {
        p.dataset.s = s;
        p.innerHTML = s;
    }
}

// ===== Admin panel (R) =====
const ADM = { regen: false, thorns: false, speed: false, ignore: false, tp: false, hacc: 0 }, thornsQ = [];
const ADM_B = [
    ['regen', '❤️', 'Regeneration', '+40% HP every second', '#9a2a3a'],
    ['thorns', '🌹', 'Thorns', 'Attackers lose 40% of their HP', '#3a8a2a'],
    ['speed', '⚡', 'Super Speed', '×2.5 movement speed', '#2a6fd6'],
    ['ignore', '👻', 'Mobs Ignore Me', 'Monsters never attack you', '#5a3a8a'],
    ['tp', '🌀', 'Map Teleport', 'Click map or minimap to go there', '#1a7a8a']
];
function toggleAdm() { if (!running)
    return; const p = $('adm'); p.style.display = p.style.display == 'flex' ? 'none' : 'flex'; renderAdm(); }
function admToggle(k) { ADM[k] = !ADM[k]; renderAdm(); const b = ADM_B.find(x => x[0] == k); say('<span style="color:#4fc3ff">[R] ' + b[2] + (ADM[k] ? ' enabled' : ' disabled') + '</span>'); }
function admLvl(n) {
    if (!running || P.dead)
        return;
    P.lvl += n;
    P.xp = 0;
    P.max = maxHP(P.lvl);
    P.mmax += 10 * n;
    P.hp = P.max;
    P.mp = P.mmax;
    burst(P.pos, 0xffee55, 40, 2);
    say('<b style="color:#ff6">[R] LEVEL UP! +' + n + ' — you are now level ' + P.lvl + '</b>');
    saveHero();
    renderAdm();
}
function admOff() { ADM.regen = ADM.thorns = ADM.speed = ADM.ignore = ADM.tp = false; renderAdm(); say('<span style="color:#4fc3ff">[R] All buffs disabled</span>'); }
function renderAdm() {
    $('adm').innerHTML = `<div class="mp" style="min-width:min(560px,92vw);text-align:center"><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a9cff,#0b2a66);border:2px solid #e8b84a;color:#fff;font-weight:bold;font-size:17px;vertical-align:middle;margin-right:8px">R</span><b style="color:var(--gold);vertical-align:middle">Admin Panel — Buffs</b><span onclick="toggleAdm()" style="float:right;cursor:pointer">✕</span><div style="margin:10px 0;font-size:12px;opacity:.8">Click a buff to switch it on or off. R or Esc to close.</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${ADM_B.map(([k, e, n, d, c]) => `<div class="sl" onclick="admToggle('${k}')" style="cursor:pointer;width:150px;height:140px;background:radial-gradient(circle at 50% 35%,${c},#050505 85%);border-color:${ADM[k] ? '#fff' : '#7a5a22'};box-shadow:${ADM[k] ? '0 0 14px #4fc3ff' : 'none'}"><i class="ic" style="font-size:46px;top:10px">${e}</i><span style="font-size:13px;bottom:62px;background:none">${n}</span><em style="bottom:30px;color:#fff;font-size:11px">${d}</em><em style="bottom:6px;color:${ADM[k] ? '#6f6' : '#aaa'};font-size:12px">${ADM[k] ? '● ON' : '○ OFF'}</em></div>`).join('')}</div><div style="margin-top:14px;padding-top:10px;border-top:1px solid #7a5a22"><b style="color:var(--gold)">⭐ Level Up</b> <small style="opacity:.8">(you are level ${P.lvl})</small><div style="margin-top:6px">${[1, 5, 10].map(n => `<button onclick="admLvl(${n})" style="padding:6px 16px;font-size:14px">+${n} level${n > 1 ? 's' : ''}</button>`).join('')}</div></div>${admConsoleHTML()}<div style="margin-top:12px"><button onclick="admMapTP()" style="padding:4px 14px;font-size:13px">🗺️ Open map to teleport</button><button onclick="admOff()" style="padding:4px 14px;font-size:13px">Disable all</button></div></div>`;
}
function admTick(dt, t) {
    if (!(P.hp >= -1e9))
        P.hp = P.max;
    if (!(P.shield >= 0))
        P.shield = 0;
    while (thornsQ.length) {
        const m = thornsQ.pop();
        if (mobs.indexOf(m) >= 0) {
            burst(m.pos, 0x55cc33, 6);
            hit(m, Math.max(1, Math.round((m.max || m.hp || 50) * .4)));
        }
    }
    if (ADM.regen && !P.dead && P.hp > 0 && P.hp < P.max) {
        ADM.hacc += dt;
        if (ADM.hacc >= 1) {
            ADM.hacc -= 1;
            const hh = Math.round(P.max * .4);
            P.hp = Math.min(P.max, P.hp + hh);
            float(P.pos, '+' + hh, '#6f6');
        }
    }
    const s = ADM_B.filter(b => ADM[b[0]]).map(b => b[1]).join(' '), bf = $('abf');
    if (bf.dataset.s !== s) {
        bf.dataset.s = s;
        bf.style.display = s ? 'block' : 'none';
        bf.innerHTML = '<b style="color:#4fc3ff">R</b> ' + s;
    }
}
// ===== Heroes (up to 10) + character select screen =====
const KEY2 = 'ember_heroes_v2', KEY1 = 'ember_save_v1', MAXH = 10, STG = { x: -2000, z: 0 }, CSP = 2.4;
let HEROES = [], CUR = null, saveT = 0, SH = [], SELI = 0, DELMODE = false, DELSET = new Set(), csOn = false, stage = null;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
try {
    HEROES = JSON.parse(localStorage.getItem(KEY2) || 'null') || [];
}
catch (e) {
    HEROES = [];
}
if (!Array.isArray(HEROES))
    HEROES = [];
if (!HEROES.length) { // migrate the old one-hero-per-class saves
    try {
        const old = JSON.parse(localStorage.getItem(KEY1) || '{}') || {};
        Object.keys(old).forEach((c, i) => { if (CL[c])
            HEROES.push(Object.assign({ id: 'm' + i + Date.now().toString(36), name: WB_NAMES[i % WB_NAMES.length], cls: c, t: 1 }, old[c])); });
    }
    catch (e) { }
}
HEROES = HEROES.filter(h => h && CL[h.cls]).slice(0, MAXH);
function persist() { try {
    localStorage.setItem(KEY2, JSON.stringify(HEROES));
}
catch (e) { } }
if (HEROES.length)
    persist();
function saveHero() {
    if (!P || !running || !CUR)
        return;
    Object.assign(CUR, { lvl: P.lvl, xp: P.xp, gold: P.gold, gear: P.gear, qd: Q.done, sel: P.sel === undefined ? null : P.sel, z: [...zoneSeen], sp: P.spec || null, pet: PET ? PET.i : null, t: Date.now() });
    persist();
}
function loadHero() {
    const sv = CUR;
    if (!sv)
        return;
    const k = CL[P.cls];
    P.name = sv.name;
    P.lvl = Math.max(1, (sv.lvl | 0) || 1);
    P.xp = sv.xp || 0;
    P.gold = sv.gold || 0;
    P.gear = sv.gear || 0;
    P.max = maxHP(P.lvl);
    P.mmax = k.mp + 10 * (P.lvl - 1);
    P.hp = P.max;
    P.mp = P.mmax;
    Q.done = sv.qd || 0;
    if (sv.sel !== null && sv.sel !== undefined)
        P.sel = sv.sel;
    zoneSeen = new Set(sv.z && sv.z.length ? sv.z : [0]);
    zoneSeen.add(0);
    say(sv.t ? 'Welcome back, ' + esc(sv.name) + '! Level ' + P.lvl + ' ' + CNAME(P.cls) + ' restored.' : 'Welcome, ' + esc(sv.name) + '!');
}
function saveTick(dt) { saveT += dt; if (saveT > 5) {
    saveT = 0;
    saveHero();
} }
function refreshMenu() {
    for (const c in CL) {
        const e = $('lv_' + c), n = HEROES.filter(h => h.cls == c).length;
        if (e)
            e.textContent = n ? '× ' + n : '';
    }
    const t = $('mt');
    if (t)
        t.textContent = 'Heroes: ' + HEROES.length + '/' + MAXH + '.';
}
addEventListener('pagehide', saveHero);
document.addEventListener('visibilitychange', () => { if (document.hidden)
    saveHero(); });
function setMenuMode(on) { document.body.className = on ? 'menuMode' : ''; }
function randName() { const used = new Set(HEROES.map(h => h.name)), pool = WB_NAMES.filter(n => !used.has(n)); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'Hero' + (HEROES.length + 1); }
// ----- dialogs -----
function askOK(msg, yes) {
    const d = $('dlg');
    d.innerHTML = `<div class="mp" style="max-width:min(430px,90vw);text-align:center"><div style="margin-bottom:14px;font-size:15px;line-height:1.5">${msg}</div><button id="dok">OK</button>${yes ? '<button id="dno">Cancel</button>' : ''}</div>`;
    d.style.display = 'flex';
    $('dok').onclick = () => { d.style.display = 'none'; if (yes)
        yes(); };
    if (yes)
        $('dno').onclick = () => { d.style.display = 'none'; };
}
// ----- create a new character -----
function showCreate() {
    csOn = false;
    setMenuMode(true);
    $('cs').style.display = 'none';
    $('spec').style.display = 'none';
    $('menu').style.display = 'flex';
    $('cbk').style.display = HEROES.length ? 'inline-block' : 'none';
    refreshMenu();
}
function chooseClass(c) {
    if (HEROES.length >= MAXH)
        return askOK('You already have ' + MAXH + ' heroes.<br>Delete one to make room.');
    if (SPECS[c])
        pickSpec(c);
    else
        nameHero(c, null);
}
function nameHero(c, sp) {
    const K = CNAME(c), e = $('spec'), spj = sp ? `'${sp}'` : 'null';
    e.innerHTML = `<h1 style="font-size:1.8rem">Name your ${K}</h1><input id="hname" maxlength="14" value="${esc(randName())}" style="font:inherit;font-size:1.3rem;padding:8px 14px;border-radius:6px;border:2px solid var(--gold);background:#1a1206;color:var(--fg);text-align:center" onkeydown="if(event.key=='Enter')createHero('${c}',${spj})"><div><button onclick="createHero('${c}',${spj})">✔ Create hero</button><button onclick="${SPECS[c] ? `pickSpec('${c}')` : `$('spec').style.display='none'`}">← Back</button></div>`;
    e.style.display = 'flex';
    setTimeout(() => { const i = $('hname'); if (i && i.focus) {
        i.focus();
        if (i.select)
            i.select();
    } }, 30);
}
function createHero(c, sp) {
    if (HEROES.length >= MAXH)
        return;
    const name = (($('hname').value || '').replace(/[^\p{L}\p{N} _'-]/gu, '').trim().slice(0, 14)) || randName();
    const h = { id: Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36), name, cls: c, lvl: 1, xp: 0, gold: 0, gear: 0, qd: 0, sel: null, z: [0], sp: sp || null, t: 0 };
    HEROES.push(h);
    persist();
    play(h);
}
function play(h) { CUR = h; start(h.cls, h.sp || undefined); }
// ----- the stage -----
function buildStage() {
    if (stage)
        return;
    stage = new THREE.Group();
    stage.position.set(STG.x, 0, STG.z);
    stage.visible = false;
    S.add(stage);
    const dark = new THREE.MeshLambertMaterial({ map: stoneT, color: 0x6e6e86 }), wallM = new THREE.MeshLambertMaterial({ map: stoneT, color: 0x4a4a62, side: 2 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(34, 48), dark);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = .02;
    floor.receiveShadow = true;
    stage.add(floor);
    const rune = new THREE.Mesh(new THREE.RingGeometry(30.5, 31.5, 64), new THREE.MeshBasicMaterial({ color: 0xe8b84a, side: 2, transparent: true, opacity: .55 }));
    rune.rotation.x = -Math.PI / 2;
    rune.position.y = .05;
    stage.add(rune);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 16, 40, 1, true, Math.PI - 1.15, 2.3), wallM);
    back.position.y = 8;
    stage.add(back);
    const flames = [];
    for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i - 3) * .36, x = Math.sin(a) * 28, z = Math.cos(a) * 28, p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 12, 10), dark);
        p.position.set(x, 6, z);
        stage.add(p);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.6, 7), new THREE.MeshBasicMaterial({ color: 0xff9a2a }));
        fl.position.set(x, 13, z);
        stage.add(fl);
        flames.push(fl);
    }
    stage.userData.flames = flames;
    const sg = new THREE.BufferGeometry(), sp = new Float32Array(900);
    for (let i = 0; i < 300; i++) {
        sp[i * 3] = rnd(-120, 120);
        sp[i * 3 + 1] = rnd(25, 100);
        sp[i * 3 + 2] = rnd(-140, -30);
    }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, fog: false }));
    stars.frustumCulled = false;
    stage.add(stars);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 14), new THREE.MeshBasicMaterial({ color: 0xf4f1e0, fog: false }));
    moon.position.set(32, 62, -115);
    stage.add(moon);
}
function csBuild() {
    buildStage();
    SH.forEach(s => stage.remove(s.grp));
    SH = [];
    const n = HEROES.length, pod = new THREE.MeshLambertMaterial({ map: stoneT, color: 0x9a9ab0 });
    HEROES.forEach((h, i) => {
        const k = CL[h.cls], mesh = hero(k.col, h.cls, h.id);
        if (SPECS[h.cls])
            applySpec(mesh, h.sp || SPECS[h.cls][1][0]);
        const grp = new THREE.Group(), x = (i - (n - 1) / 2) * CSP;
        grp.position.set(x, 0, .03 * x * x);
        const pd = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, .3, 24), pod);
        pd.position.y = .15;
        pd.receiveShadow = true;
        grp.add(pd);
        const glow = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 32), new THREE.MeshBasicMaterial({ color: 0xffcc33, side: 2, transparent: true, opacity: .9 }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = .33;
        grp.add(glow);
        mesh.position.set(0, .3, 0);
        grp.add(mesh);
        mesh.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
            o.castShadow = true; });
        stage.add(grp);
        SH.push({ h, grp, mesh, glow });
    });
    $('csl').innerHTML = HEROES.map((h, i) => `<div class="hl" id="hl_${i}" onclick="csPick(${i})" ondblclick="csEnter()"><b>${esc(h.name)}</b><br><small>Lv ${h.lvl} ${CNAME(h.cls)}${h.sp ? ' · ' + h.sp : ''}</small></div>`).join('');
}
function showSelect() {
    $('menu').style.display = 'none';
    $('spec').style.display = 'none';
    $('dlg').style.display = 'none';
    if (!HEROES.length)
        return showCreate();
    csBuild();
    DELMODE = false;
    DELSET.clear();
    SELI = Math.max(0, Math.min(HEROES.length - 1, HEROES.findIndex(h => CUR && h.id == CUR.id)));
    stage.visible = true;
    csOn = true;
    setMenuMode(true);
    $('cs').style.display = 'block';
    S.background.setHex(0x0e1224);
    S.fog.color.setHex(0x0e1224);
    S.fog.near = 40;
    S.fog.far = 260;
    hemi.intensity = .9;
    sun.intensity = .95;
    sun.position.set(STG.x + 25, 50, STG.z + 30);
    sun.target.position.set(STG.x, 0, STG.z);
    cam.position.set(STG.x, 4, STG.z + 20);
    csUpdateUI();
}
function csUpdateUI() {
    $('csn').textContent = DELMODE ? 'Select the heroes to delete (' + DELSET.size + ' selected)' : 'Choose your hero · ' + HEROES.length + '/' + MAXH;
    $('cs_enter').style.display = DELMODE ? 'none' : 'inline-block';
    $('cs_new').style.display = DELMODE ? 'none' : 'inline-block';
    $('cs_new').style.opacity = HEROES.length >= MAXH ? .45 : 1;
    $('cs_del').textContent = DELMODE && DELSET.size ? '🗑 Delete selected (' + DELSET.size + ')' : '🗑 Delete heroes';
    $('cs_cancel').style.display = DELMODE ? 'inline-block' : 'none';
}
function csPick(i) {
    if (DELMODE) {
        const id = HEROES[i].id;
        if (DELSET.has(id))
            DELSET.delete(id);
        else
            DELSET.add(id);
    }
    else
        SELI = i;
    csUpdateUI();
}
function csEnter() { if (DELMODE || !HEROES.length || !csOn)
    return; play(HEROES[SELI]); }
function csNew() { if (HEROES.length >= MAXH)
    return askOK('You already have ' + MAXH + ' heroes.<br>Delete one to make room.'); showCreate(); }
function csDelToggle() {
    if (!DELMODE) {
        DELMODE = true;
        DELSET.clear();
        csUpdateUI();
    }
    else if (DELSET.size)
        csDelete();
    else {
        DELMODE = false;
        csUpdateUI();
    }
}
function csCancelDel() { DELMODE = false; DELSET.clear(); csUpdateUI(); }
function csDelete() {
    const list = HEROES.filter(h => DELSET.has(h.id));
    if (!list.length)
        return;
    const names = list.map(h => esc(h.name) + ' (Lv ' + h.lvl + ' ' + CNAME(h.cls) + ')').join(', ');
    askOK('Delete ' + (list.length > 1 ? list.length + ' heroes' : 'this hero') + '?<br><b>' + names + '</b>', () => askOK('⚠ Are you absolutely sure?<br>This cannot be undone.', () => {
        HEROES = HEROES.filter(h => !DELSET.has(h.id));
        if (CUR && DELSET.has(CUR.id))
            CUR = null;
        DELMODE = false;
        DELSET.clear();
        persist();
        showSelect();
    }));
}
function csKey(e) {
    if ($('dlg').style.display == 'flex' || (e.target && e.target.tagName == 'INPUT'))
        return false;
    if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
        SELI = Math.max(0, SELI - 1);
        return true;
    }
    if (e.code == 'ArrowRight' || e.code == 'KeyD') {
        SELI = Math.min(HEROES.length - 1, SELI + 1);
        return true;
    }
    if (e.code == 'Enter') {
        csEnter();
        return true;
    }
    return false;
}
function csClick(e) {
    if (!csOn)
        return;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
    const hits = ray.intersectObjects(SH.map(s => s.grp), true);
    if (!hits.length)
        return;
    let o = hits[0].object;
    while (o && !SH.some(s => s.grp === o))
        o = o.parent;
    const i = SH.findIndex(s => s.grp === o);
    if (i >= 0)
        csPick(i);
}
function menuTick(dt, t) {
    parts = parts.filter(p => { p.t -= dt; p.v.y -= 12 * dt; p.m.position.addScaledVector(p.v, dt); p.m.scale.setScalar(Math.max(.01, p.t * 1.5)); if (p.t <= 0) {
        S.remove(p.m);
        return false;
    } return true; });
    if (!csOn)
        return;
    const n = Math.max(1, SH.length), W = (n - 1) / 2 * CSP + 2.6, asp = innerWidth / innerHeight, dist = Math.min(44, Math.max(11, W / (Math.tan(.5236) * asp) * 1.05));
    const sel = SH[SELI], tx = STG.x + (sel ? sel.grp.position.x * .25 : 0), a = Math.min(1, dt * 3);
    cam.position.x += (tx - cam.position.x) * a;
    cam.position.y += (3.2 + dist * .06 - cam.position.y) * a;
    cam.position.z += (STG.z + dist - cam.position.z) * a;
    cam.lookAt(tx, 1.9, STG.z);
    SH.forEach((s, i) => {
        const isSel = i == SELI, del = DELSET.has(s.h.id);
        s.glow.visible = DELMODE ? del : isSel;
        s.glow.material.color.setHex(DELMODE ? 0xff3333 : 0xffcc33);
        s.mesh.scale.setScalar(s.mesh.scale.x + ((isSel && !DELMODE ? 1.12 : 1) - s.mesh.scale.x) * a);
        s.mesh.rotation.y = (isSel ? Math.sin(t * 1.1) * .3 : Math.sin(t * .6 + i) * .08) - s.grp.position.x * .015;
        s.mesh.children[0].position.y = 1.1 + Math.sin(t * 2 + i) * .02;
        const ph = t % 3.2;
        s.mesh.w.rotation.x = isSel && !DELMODE && ph < .45 ? -Math.sin(ph / .45 * 3.14) * 1.2 : 0;
        const p = proj(new THREE.Vector3(STG.x + s.grp.position.x, 3.9, STG.z + s.grp.position.z)), el = $('hl_' + i);
        if (el) {
            el.style.left = p.x + 'px';
            el.style.top = p.y + 'px';
            el.style.display = p.b ? 'none' : 'block';
            el.className = 'hl' + (DELMODE ? (del ? ' del' : '') : (isSel ? ' sel' : ''));
        }
    });
    if (stage && stage.userData.flames)
        stage.userData.flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 14 + i) * .25; });
    if (Math.random() < .4)
        burst(new THREE.Vector3(STG.x + rnd(-22, 22), 0, STG.z + rnd(-10, 6)), 0xffaa44, 1, .6, 0);
}
refreshMenu();
setTimeout(() => { window.LP = 1; requestAnimationFrame(loop); showSelect(); }, 0);
// ===== PvP / duel equal-power mode: levels and gear only matter against monsters =====
function pvpStats(on) {
    if (!P || on === !!P.pv)
        return;
    const k = CL[P.cls], L = on ? PVPL : P.lvl, hr = P.max > 0 ? P.hp / P.max : 1, mr = P.mmax > 0 ? P.mp / P.mmax : 1;
    P.pv = on;
    P.max = maxHP(L);
    P.mmax = k.mp + 10 * (L - 1);
    P.hp = Math.max(1, Math.round(hr * P.max));
    P.mp = Math.round(mr * P.mmax);
    if (on)
        say('<span style="color:#ffe48a">PvP: everyone fights at equal power — levels and gear only count against monsters.</span>');
}
// ===== Warrior / Paladin stances: Melee (two-handed greatsword) or Tank (sword & shield) =====
const maxHP = L => Math.round((CL[P.cls].hp + 20 * (L - 1)) * (P.spec == 'tank' ? 1.4 : 1));
const specD = () => P.spec == 'melee' ? 1.25 : P.spec == 'tank' ? .85 : P.spec == 'damage' ? 1.2 : P.spec == 'heal' ? .9 : P.spec == 'summon' ? .85 : P.spec == 'curse' ? 1.1 : 1, specT = () => (P.spec == 'tank' ? .7 : 1) * (P.lion ? .8 : 1);
function limb(g, a, b, mat, th) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dx, dy, dz) || 1, m = new THREE.Mesh(new THREE.BoxGeometry(th, len, th), mat);
    m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    g.add(m);
    return m;
}
function buildGS(g) {
    const holy = g.cls == 'paladin', L = c => new THREE.MeshLambertMaterial(c), B = c => new THREE.MeshBasicMaterial({ color: c });
    const steel = L({ color: 0xe4ebf3, emissive: holy ? 0x5a4a14 : 0x1c2a44 }), edge = L({ color: 0xffffff, emissive: 0x555555 }), gold = L({ color: 0xe8b84a, emissive: 0x3a2a08 }), leather = L({ color: 0x3a2412 }), glow = B(holy ? 0x66ddff : 0xff7a2a);
    const gs = new THREE.Group(), sw = new THREE.Group(), th = .55, ph = .28, k = .78;
    gs.position.set(0, 1.7, .2);
    g.add(gs);
    sw.position.set(0, -.3, .62);
    sw.rotation.set(th, 0, ph);
    sw.scale.setScalar(k);
    gs.add(sw);
    add(new THREE.Mesh(new THREE.BoxGeometry(.26, 2.6, .07), steel), 0, 1.6, 0, sw);
    add(new THREE.Mesh(new THREE.BoxGeometry(.07, 2.4, .09), edge), 0, 1.55, 0, sw);
    const tg = new THREE.Group(), tip = new THREE.Mesh(new THREE.ConeGeometry(.185, .5, 4), steel);
    tip.rotation.y = Math.PI / 4;
    tg.add(tip);
    tg.scale.z = .27;
    add(tg, 0, 3.15, 0, sw);
    for (let i = 0; i < 5; i++)
        add(new THREE.Mesh(new THREE.BoxGeometry(.045, .13, .1), glow), 0, .8 + i * .42, 0, sw);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.15, .13, .2), gold), 0, .22, 0, sw);
    [-1, 1].forEach(s => { add(new THREE.Mesh(new THREE.ConeGeometry(.1, .3, 4), gold), s * .66, .22, 0, sw).rotation.z = -s * Math.PI / 2; });
    add(new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), glow), 0, .22, .11, sw);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .8, 8), leather), 0, -.2, 0, sw);
    for (let i = 0; i < 4; i++)
        add(new THREE.Mesh(new THREE.TorusGeometry(.07, .015, 5, 10), gold), 0, -.5 + i * .2, 0, sw).rotation.x = Math.PI / 2;
    add(new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), gold), 0, -.66, 0, sw);
    const dir = { x: -Math.sin(ph), y: Math.cos(ph) * Math.cos(th), z: Math.cos(ph) * Math.sin(th) };
    const H = y => ({ x: y * k * dir.x, y: -.3 + y * k * dir.y, z: .62 + y * k * dir.z }), hl = H(-.42), hr = H(-.05), armM = M(g.col);
    [[-1, hl], [1, hr]].forEach(([s, h]) => {
        const sh = { x: s * .62, y: .05, z: -.2 };
        limb(gs, sh, h, armM, .24);
        add(new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), leather), h.x, h.y, h.z, gs);
        add(new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), gold), sh.x, sh.y + .02, sh.z, gs);
    });
    g.gs = gs;
    g.gsw = { rotation: { set x(v) { gs.rotation.x = -v * .9; }, get x() { return gs.rotation.x; } } };
}
function buildShield(g) {
    const L = c => new THREE.MeshLambertMaterial(c), sh = new THREE.Group(), gold = L({ color: 0xe8b84a, emissive: 0x3a2a08 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.58, .58, .12, 28), M(g.col));
    disc.rotation.x = Math.PI / 2;
    sh.add(disc);
    add(new THREE.Mesh(new THREE.TorusGeometry(.58, .06, 8, 28), gold), 0, 0, 0, sh);
    add(new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), gold), 0, 0, .1, sh);
    add(new THREE.Mesh(new THREE.BoxGeometry(.1, .8, .05), gold), 0, 0, .08, sh);
    add(new THREE.Mesh(new THREE.BoxGeometry(.8, .1, .05), gold), 0, 0, .08, sh);
    sh.position.set(-.98, 1.05, .42);
    sh.rotation.y = -.35;
    g.add(sh);
    g.shield = sh;
}
function applySpec(g, spec) {
    if (!g || !spec)
        return;
    if (g.cls == 'priest' || g.cls == 'warlock') {
        if (g.orb) {
            const on = spec == 'damage' || spec == 'summon';
            g.orb.material.color.setHex(g.cls == 'priest' ? (on ? 0xffcc22 : 0x88ffcc) : (on ? 0x9dff9a : 0x7affe0));
            g.orb.scale.setScalar(on ? 1.5 : 1);
        }
        return;
    }
    if (!g.w0) {
        g.w0 = g.w;
        g.children.forEach(o => { if (o.geometry && o.geometry.type == 'BoxGeometry' && o.geometry.parameters.width == .6)
            o.visible = false; });
        buildGS(g);
        buildShield(g);
    }
    const melee = spec == 'melee';
    g.gs.visible = melee;
    g.w0.visible = !melee;
    g.shield.visible = !melee;
    g.arm.visible = !melee;
    if (g.rarm)
        g.rarm.visible = !melee;
    g.w = melee ? g.gsw : g.w0;
}
// ===== Specializations: warrior/paladin (melee|tank), priest (damage|heal) =====
const SPECS = {
    warrior: [['melee', '⚔️', 'Melee', 'Two-handed greatsword<br>+25% damage', '#b8501a'], ['tank', '🛡️', 'Tank', 'Sword &amp; shield<br>+40% health · −30% damage taken · −15% damage', '#2a6fd6']],
    paladin: [['melee', '⚔️', 'Melee', 'Two-handed greatsword<br>+25% damage', '#b8501a'], ['tank', '🛡️', 'Tank', 'Sword &amp; shield<br>+40% health · −30% damage taken · −15% damage', '#2a6fd6']],
    priest: [['damage', '🔆', 'Damage', 'Holy Radiance beam &amp; Holy Sparks<br>+20% damage · −15% healing', '#c9a020'], ['heal', '💚', 'Heal', 'Smite &amp; Holy Nova<br>+30% healing · −10% damage', '#2a9a6a']]
};
const healM = () => P.spec == 'heal' ? 1.3 : P.spec == 'damage' ? .85 : 1;
ICONS['Holy Radiance'] = ['🔆', '#d9a800'];
ICONS['Holy Sparks'] = ['✨', '#f0c830'];
CL.priest.abH = CL.priest.ab.slice();
CL.priest.abD = [
    { n: 'Holy Radiance', cost: 14, cd: 2.6, range: 28, need: 1, still: 1, f: () => { P.chan = { t: 2.4, k: .3, m: P.t }; } },
    { n: 'Holy Sparks', cost: 15, cd: 7, range: 28, need: 1, f: () => { P.t.dot = { n: 6, d: dmg(.55), c: 0xffdd33 }; P.t.aggro = true; burst(P.t.pos, 0xffdd33, 10, 1.4); } },
    CL.priest.ab[2], CL.priest.ab[3]
];
let cfgOf = p => p.cls == 'priest' ? Object.assign({}, CL.priest, { ab: p.spec == 'damage' ? CL.priest.abD : CL.priest.abH }) : CL[p.cls];
function buildHB() {
    $('hb').innerHTML = P.cfg.ab.map((a, i) => { const ic = ICONS[a.n] || ['❓', '#444']; return `<div class="sl" title="${a.n} (${i + 1})" onclick="useAbil(${i})" style="cursor:pointer;background:radial-gradient(circle at 50% 35%,${ic[1]},#050505 85%)"><b>${i + 1}</b><i class="ic">${ic[0]}</i><span>${a.n}</span><em>${a.cost} mp</em><u></u></div>`; }).join('');
}
// ----- Holy Radiance: channelled yellow beam (like Mind Flay) -----
let chBeam = null, chGlow = null;
function endChan() {
    if (P && P.chan)
        P.chan = null;
    if (chBeam) {
        S.remove(chBeam);
        S.remove(chGlow);
        chBeam = chGlow = null;
    }
}
function chanTick(dt, t) {
    const c = P.chan;
    if (!c)
        return;
    const m = c.m;
    if (!m || m.dead || m.hp <= 0 || mobs.indexOf(m) < 0 || d3(m, P) > 32 || P.dead || P.mv) {
        endChan();
        return;
    }
    P.mesh.rotation.y = Math.atan2(m.pos.x - P.pos.x, m.pos.z - P.pos.z);
    const a = { x: P.pos.x, y: P.pos.y + 2.3, z: P.pos.z }, b = { x: m.pos.x, y: m.pos.y + 1.3, z: m.pos.z };
    if (!chBeam) {
        chBeam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: .9 }));
        chGlow = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffc400, transparent: true, opacity: .28 }));
        S.add(chBeam);
        S.add(chGlow);
    }
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dx, dy, dz) || 1;
    [chBeam, chGlow].forEach((o, i) => {
        o.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
        const r = (i ? .2 : .07) * (1 + .35 * Math.sin(t * 40 + i));
        o.scale.set(r, len, r);
    });
    c.t -= dt;
    c.k -= dt;
    if (Math.random() < .5)
        burst(m.pos, 0xffe14a, 1, .8);
    if (c.k <= 0) {
        c.k = .6;
        hit(m, dmg(.75));
        m.slow = .9;
        burst(m.pos, 0xfff0a0, 5, 1.2);
    }
    if (c.t <= 0)
        endChan();
}
function pickSpec(c) {
    const sv = null, K = CNAME(c), e = $('spec');
    const card = ([sp, ic, n, d, col]) => `<div class="sl" onclick="nameHero('${c}','${sp}')" style="cursor:pointer;width:210px;height:180px;background:radial-gradient(circle at 50% 35%,${col},#050505 85%);border-color:${sv == sp ? '#fff' : '#e8b84a'}"><i class="ic" style="font-size:56px;top:12px">${ic}</i><span style="font-size:15px;bottom:84px;background:none">${n}${sv == sp ? ' ✔' : ''}</span><em style="bottom:8px;color:#fff;font-size:11px;white-space:normal;padding:0 8px;line-height:1.35">${d}</em></div>`;
    e.innerHTML = `<h1 style="font-size:1.8rem">${K} — choose your specialization</h1><div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">${SPECS[c].map(card).join('')}</div><button onclick="$('spec').style.display='none'">← Back</button>`;
    e.style.display = 'flex';
}
function showSpecPanel() {
    selB = null;
    const sp = P.spec, p = $('bp'), o = SPECS[P.cls], b = on => `padding:4px 12px;font-size:13px;margin:0 4px;${on ? 'border-color:#fff;background:#5a4318' : ''}`;
    p.dataset.s = '';
    p.innerHTML = `<b style="color:var(--gold)">${CNAME(P.cls)} — Specialization</b><div style="margin-top:6px">${o.map(x => `<button onclick="setSpec('${x[0]}')" style="${b(sp == x[0])}">${x[1]} ${x[2]}</button>`).join('')}<button onclick="closeBP()" style="padding:4px 10px;font-size:13px;margin:0 4px">✕</button></div><small style="opacity:.8">${o.find(x => x[0] == sp)[3].replace('<br>', ' · ')}</small>`;
    p.style.display = 'block';
}
function setSpec(sp) {
    if (G.on || DU)
        return say('You cannot change specialization during PvP.');
    if (sp == P.spec)
        return;
    const r = P.hp / P.max;
    P.spec = sp;
    P.max = maxHP(P.lvl);
    P.hp = Math.max(1, Math.round(r * P.max));
    applySpec(P.mesh, sp);
    endChan();
    dismissMinions();
    cancelGround(true);
    P.cfg = cfgOf(P);
    P.cds = [0, 0, 0, 0];
    buildHB();
    showSpecPanel();
    burst(P.pos, 0xffe48a, 14, 1.2);
    say('<span style="color:#ffe48a">Specialization: ' + SPECS[P.cls].find(x => x[0] == sp)[2] + '</span>');
}
// ===== Warlock Summoner: minions, ground-targeted Volcano stun; Rogue Sprint =====
let GT = null, MX = -1, MY = -1, mins = [], volcs = [], gCur = null;
const gRay = new THREE.Raycaster();
addEventListener('mousemove', e => { MX = e.clientX; MY = e.clientY; });
ICONS['Summon Sprites'] = ['🧚', '#3aa0b0'];
ICONS['Summon Guardians'] = ['🌳', '#3a7a3a'];
ICONS['Spirit Bolt'] = ['💠', '#2a8aaa'];
ICONS['Thorn Hex'] = ['🌿', '#3a8a2a'];
ICONS['Life Bloom'] = ['🌸', '#c05a8a'];
ICONS['Starburst'] = ['🌟', '#c9a02a'];
ICONS['Volcano'] = ['🌋', '#d4541a'];
ICONS['Sprint'] = ['💨', '#3a8ad0'];
const WL = CL.warlock.ab;
CL.warlock.abC = WL.slice();
CL.warlock.abS = [
    { n: 'Summon Sprites', cost: 30, cd: 30, f: () => summonMinions(1, 4) },
    { n: 'Summon Guardians', cost: 50, cd: 45, f: () => summonMinions(2, 4) },
    { n: 'Volcano', cost: 35, cd: 18, range: 36, rad: 9, ground: 1, f: pt => spawnVolcano(pt.x, pt.z, 9) },
    WL[2]
];
SPECS.warlock = [
    ['summon', '🧚', 'Summoner', 'Sprites &amp; Grove Guardians fight for you<br>Volcano stun · Life Bloom<br>Auto-attack spirit bolt<br>−15% own damage', '#2a7a8a'],
    ['curse', '🌸', 'Spirit Magic', 'Spirit Bolt · Thorn Hex<br>Life Bloom · Starburst<br>+10% damage', '#2f9a86']
];
const KITS = { priest: { damage: CL.priest.abD, heal: CL.priest.abH }, warlock: { summon: CL.warlock.abS, curse: CL.warlock.abC } };
cfgOf = p => { const kit = KITS[p.cls]; return kit ? Object.assign({}, CL[p.cls], { ab: kit[p.spec] || CL[p.cls].ab }) : CL[p.cls]; };
// ----- minions -----
function mkMinion(tier, x, z, idx) {
    const big = tier == 2, s = big ? 1.05 : .72, g = new THREE.Group(), L = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 }), B = c => new THREE.MeshBasicMaterial({ color: c });
    const eyes = (y, z, sx, r) => [-1, 1].forEach(sd => { add(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), B(0x1a1a22)), sd * sx, y, z, g); add(new THREE.Mesh(new THREE.SphereGeometry(r * .35, 6, 6), B(0xffffff)), sd * sx - r * .3, y + r * .35, z + r * .7, g); });
    if (!big) {
        // Sprite: a glowing little fairy with butterfly wings
        const bm = L(0x9affea, 0x2a8a7a);
        add(new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), bm), 0, 1.45, 0, g);
        add(new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), bm), 0, .9, 0, g).scale.set(1, 1.2, 1);
        eyes(1.5, .34, .15, .085);
        add(new THREE.Mesh(new THREE.TorusGeometry(.08, .02, 4, 10, Math.PI), B(0x2a5a5a)), 0, 1.32, .38, g).rotation.z = Math.PI;
        [-1, 1].forEach(sd => { add(new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 6), B(0xff9ac8)), sd * .26, 1.36, .3, g); const an = add(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .35, 4), L(0x2a5a5a)), sd * .12, 1.95, 0, g); an.rotation.z = -sd * .3; add(new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 6), B(0xffe48a)), sd * .18, 2.12, 0, g); });
        const wm = new THREE.MeshBasicMaterial({ color: 0xd8f8ff, transparent: true, opacity: .6, side: 2 });
        g.wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.set(sd * .15, 1.15, -.25); add(new THREE.Mesh(new THREE.CircleGeometry(.45, 12), wm), sd * .4, .2, 0, w).rotation.y = PI / 2 - .2; add(new THREE.Mesh(new THREE.CircleGeometry(.3, 10), wm), sd * .3, -.25, 0, w).rotation.y = PI / 2 - .2; g.add(w); return w; });
        g.legs = [-1, 1].map(sd => { const l = new THREE.Group(); l.position.set(sd * .12, .62, 0); add(new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 6), bm), 0, -.06, 0, l); g.add(l); return l; });
    }
    else {
        // Grove Guardian: a round, mossy forest bear with a flower on its head
        const fur = L(0x6a8a3a), bark = L(0x7a5a32), belly = L(0xc8d890);
        const body = add(new THREE.Mesh(new THREE.SphereGeometry(.62, 12, 10), fur), 0, 1.0, 0, g);
        body.scale.set(1, 1.1, .95);
        add(new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8), belly), 0, .95, .28, g).scale.set(1, 1.1, .6);
        add(new THREE.Mesh(new THREE.SphereGeometry(.44, 12, 10), fur), 0, 1.9, .05, g);
        add(new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), belly), 0, 1.8, .4, g).scale.set(1.2, .8, .8);
        add(new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 6), B(0x2a1a10)), 0, 1.86, .54, g);
        eyes(2.0, .38, .17, .07);
        [-1, 1].forEach(sd => {
            add(new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), fur), sd * .32, 2.28, 0, g);
            add(new THREE.Mesh(new THREE.BoxGeometry(.24, .62, .24), bark), sd * .66, 1.05, .1, g).rotation.z = sd * .25;
            add(new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), L(0x4aa83a)), sd * .4, 1.3, -.4, g);
        });
        for (let k = 0; k < 5; k++)
            add(new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 6), B(k == 2 ? 0xffd23a : 0xff8fc8)), k == 2 ? 0 : Math.cos(k * 1.57) * .12, 2.42, k == 2 ? 0 : Math.sin(k * 1.57) * .12, g);
        add(new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 5), L(0x4aa83a)), .15, 2.4, -.1, g).rotation.z = -.6;
        g.legs = [-1, 1].map(sd => { const l = new THREE.Group(); l.position.set(sd * .28, .55, 0); add(new THREE.Mesh(new THREE.BoxGeometry(.26, .5, .26), bark), 0, -.25, 0, l); g.add(l); return l; });
    }
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    S.add(g);
    g.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
        o.castShadow = true; });
    const grp = new THREE.Group(), fg = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .14), B(0x66ee66));
    grp.add(new THREE.Mesh(new THREE.PlaneGeometry(1.28, .2), B(0)));
    grp.add(fg);
    fg.position.z = .01;
    S.add(grp);
    const hp = Math.round((big ? 55 + PL() * 15 : 30 + PL() * 9) * (P.pv ? .6 : 1));
    return { mn: 1, tier, mesh: g, pos: g.position, hp, max: hp, dmg: (big ? 7 + PL() * 2.4 : 4 + PL() * 1.5) * (P.pv ? .4 : 1), lvl: PL(), cd: rnd(0, 1), sw: 0, life: 40, mv: 0, tg: null, idx, dead: false, gone: false, bgp: grp, fg, sp: big ? 8.5 : 8, bh: big ? 3.3 : 2.5 };
}
function summonMinions(tier, n) {
    const alive = mins.filter(m => !m.dead);
    while (alive.length + n > 10 && alive.length)
        mnDie(alive.shift(), true);
    for (let i = 0; i < n; i++) {
        const a = i / n * 6.283 + rnd(0, .5), x = P.pos.x + Math.cos(a) * 3, z = P.pos.z + Math.sin(a) * 3;
        mins.push(mkMinion(tier, x, z, i));
        burst(new THREE.Vector3(x, 0, z), tier == 2 ? 0x66ff66 : 0xff5555, 8, 1.5, .2);
    }
    burst(P.pos, 0x9affea, 16, 1.4);
    say('<span style="color:#9affea">' + (tier == 2 ? '🌳 Grove Guardians' : '🧚 Sprites') + ' come to help you!</span>');
}
function mnDie(b, quiet) {
    if (b.dead)
        return;
    b.dead = true;
    b.gone = true;
    b.bgp.visible = false;
    if (quiet) {
        S.remove(b.mesh);
        S.remove(b.bgp);
    }
    else
        dying.push({ m: b.mesh, t: 0, y0: b.pos.y });
    burst(b.pos, quiet ? 0x9a44ff : 0xcc2222, 8);
}
function mnHurt(b, d) { if (b.dead)
    return; b.hp -= d; float(b.pos, '-' + d, '#f99'); if (b.hp <= 0)
    mnDie(b); }
function dismissMinions() { mins.forEach(m => { if (!m.dead)
    mnDie(m, true); S.remove(m.bgp); }); mins = []; }
function mnHitMob(m, d, mn) {
    if (mobs.indexOf(m) < 0)
        return;
    if (m.bot || m.wb) {
        hit(m, d);
        return;
    }
    m.hp -= d;
    m.bt = mn;
    float(m.pos, Math.round(d), '#d28bff');
    burst(m.pos, 0xb04aff, 3);
    if (m.hp <= 0)
        kill(m);
}
function mnFoes() { return G.on ? mobs.filter(m => m.bot) : DU ? [DU.b] : mobs.filter(m => (!m.bot && !m.wb) || (P.pit && m.wb && m.pit)); }
function mnTick(dt, t) {
    mins = mins.filter(m => { if (m.gone) {
        S.remove(m.bgp);
        return false;
    } return true; });
    const alive = mins.filter(m => !m.dead);
    mins.forEach(m => {
        m.bgp.visible = !m.dead;
        m.bgp.position.set(m.pos.x, m.bh, m.pos.z);
        m.bgp.quaternion.copy(cam.quaternion);
        m.fg.scale.x = Math.max(.001, m.hp / m.max);
        if (m.dead)
            return;
        m.life -= dt;
        if (m.life <= 0) {
            mnDie(m, true);
            return;
        }
        m.cd -= dt;
        m.sw = Math.max(0, m.sw - dt);
        m.mv = 0;
        let tg = m.tg;
        const F = mnFoes(), pvp = G.on || DU;
        if (tg && (F.indexOf(tg) < 0 || tg.hp <= 0 || tg.dead))
            tg = null;
        if (G.cd > 0 || (DU && DU.cd > 0))
            tg = null;
        else {
            const pt = P.t && F.indexOf(P.t) >= 0 && d3(P.t, P) < 40 ? P.t : null;
            if (pt)
                tg = pt;
            else if (!tg) {
                let bd = pvp ? 45 : 16;
                F.forEach(x => { const d = d3(x, m); if (d < bd && (pvp || x.aggro || d3(x, P) < 26)) {
                    bd = d;
                    tg = x;
                } });
            }
        }
        m.tg = tg;
        const go = (x, z, s) => { const dx = x - m.pos.x, dz = z - m.pos.z, l = Math.hypot(dx, dz) || 1; if (l < .3)
            return; m.pos.x += dx / l * s * dt; m.pos.z += dz / l * s * dt; m.mesh.rotation.y = Math.atan2(dx, dz); m.mv = 1; };
        if (tg) {
            const d = d3(tg, m);
            if (d > 2.2)
                go(tg.pos.x, tg.pos.z, m.sp);
            else {
                m.mesh.rotation.y = Math.atan2(tg.pos.x - m.pos.x, tg.pos.z - m.pos.z);
                if (m.cd <= 0) {
                    m.cd = 1.2;
                    m.sw = .3;
                    mnHitMob(tg, Math.round(m.dmg * rnd(.85, 1.15)), m);
                }
            }
        }
        else {
            const i = alive.indexOf(m), a = i / Math.max(1, alive.length) * 6.283 + t * .25, tx = P.pos.x + Math.cos(a) * 3.8, tz = P.pos.z + Math.sin(a) * 3.8, d = Math.hypot(tx - m.pos.x, tz - m.pos.z);
            if (d > 45) {
                m.pos.x = tx;
                m.pos.z = tz;
            }
            else if (d > 1)
                go(tx, tz, m.sp * Math.min(1.6, .6 + d * .15));
        }
        const sw = m.mv ? Math.sin(t * 14 + m.idx) * .8 : 0;
        m.mesh.legs[0].rotation.x = sw;
        m.mesh.legs[1].rotation.x = -sw;
        if (m.mesh.wings)
            m.mesh.wings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * Math.sin(t * 16 + m.idx) * .6; });
        m.pos.y = groundH(m.pos.x, m.pos.z) + (m.mesh.wings ? .25 + Math.sin(t * 6 + m.idx) * .12 : (m.mv ? Math.abs(Math.sin(t * 14 + m.idx)) * .12 : 0));
    });
}
// ----- ground targeting + Volcano -----
function groundPoint() {
    if (MX < 0)
        return null;
    gRay.setFromCamera(new THREE.Vector2(MX / innerWidth * 2 - 1, -(MY / innerHeight) * 2 + 1), cam);
    const o = gRay.ray.origin, d = gRay.ray.direction;
    if (d.y >= -.01)
        return null;
    const k = -o.y / d.y;
    return { x: o.x + d.x * k, z: o.z + d.z * k };
}
function beginGround(i) {
    cancelGround(true);
    const a = P.cfg.ab[i];
    GT = { i, pt: null };
    gCur = new THREE.Mesh(new THREE.RingGeometry(a.rad - .5, a.rad, 40), new THREE.MeshBasicMaterial({ color: 0xffcc33, side: 2, transparent: true, opacity: .85 }));
    gCur.rotation.x = -Math.PI / 2;
    gCur.visible = false;
    S.add(gCur);
    say('<span style="color:#ffcc66">Click the ground to cast ' + a.n + ' (Esc to cancel)</span>');
}
function cancelGround(quiet) {
    if (gCur) {
        S.remove(gCur);
        gCur = null;
    }
    if (GT && !quiet)
        say('Cast cancelled.');
    GT = null;
}
function confirmGround() {
    if (!GT || !GT.pt)
        return;
    const i = GT.i, a = P.cfg.ab[i], pt = GT.pt;
    if (P.cds[i] > 0 || P.mp < a.cost) {
        cancelGround();
        return;
    }
    P.mp -= a.cost;
    P.cds[i] = a.cd;
    P.sw = .3;
    endChan();
    P.mesh.rotation.y = Math.atan2(pt.x - P.pos.x, pt.z - P.pos.z);
    cancelGround(true);
    a.f(pt);
}
function spawnVolcano(x, z, R) {
    const g = new THREE.Group(), rock = new THREE.MeshLambertMaterial({ map: mtex('lava', 0x8a1a1a), emissive: 0x551a05 });
    g.position.set(x, 0, z);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 4.6, 6, 14), rock);
    cone.position.y = 3;
    g.add(cone);
    const lava = new THREE.Mesh(new THREE.CircleGeometry(1.55, 16), new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = 6.02;
    g.add(lava);
    const light = new THREE.PointLight(0xff7a2a, 2.2, 40);
    light.position.set(0, 7, 0);
    g.add(light);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xff8a2a, side: 2, transparent: true, opacity: .8 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, .25, z);
    S.add(ring);
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(R * .8, 32), new THREE.MeshBasicMaterial({ color: 0x2a0e06, transparent: true, opacity: .55 }));
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(x, .12, z);
    S.add(scorch);
    g.scale.y = .02;
    S.add(g);
    volcs.push({ g, light, ring, scorch, x, z, R, t: 0, burn: 0 });
    mobs.slice().forEach(m => { if (Math.hypot(m.pos.x - x, m.pos.z - z) < R) {
        hit(m, dmg(.9));
        m.stun = 4;
    } });
    burst(new THREE.Vector3(x, 0, z), 0xff6a1a, 30, 2.2, .3);
    say('<span style="color:#ff9a4a">The ground erupts! Enemies are stunned.</span>');
}
function warTick(dt, t) {
    if (P.sprint > 0) {
        P.sprint -= dt;
        if (Math.random() < .6)
            burst(P.pos, 0x9fd8ff, 1, .3, .2);
    }
    if (GT) {
        const a = P.cfg.ab[GT.i], p = groundPoint();
        if (p && gCur) {
            let dx = p.x - P.pos.x, dz = p.z - P.pos.z;
            const d = Math.hypot(dx, dz), far = d > a.range;
            if (far) {
                dx *= a.range / d;
                dz *= a.range / d;
            }
            GT.pt = { x: P.pos.x + dx, z: P.pos.z + dz };
            gCur.visible = true;
            gCur.position.set(GT.pt.x, .3, GT.pt.z);
            gCur.material.color.setHex(far ? 0xff5533 : 0xffcc33);
            gCur.scale.setScalar(1 + Math.sin(t * 8) * .03);
        }
    }
    mobs.forEach(m => { if (m.stun > 0 && Math.random() < .12)
        burst(m.pos, 0xffee66, 1, .5, 2.8); });
    volcs = volcs.filter(v => {
        v.t += dt;
        const k = Math.min(1, v.t / .5), sink = v.t > 4.4 ? Math.max(.02, 1 - (v.t - 4.4) * 1.6) : 1;
        v.g.scale.y = (.02 + .98 * (1 - (1 - k) * (1 - k))) * sink;
        v.light.intensity = 2.2 + Math.sin(t * 30) * .6;
        const rk = Math.min(1, v.t / .6);
        v.ring.scale.setScalar(.5 + rk * v.R);
        v.ring.material.opacity = (1 - rk) * .8;
        v.scorch.material.opacity = v.t > 4 ? Math.max(0, .55 - (v.t - 4) * .5) : .55;
        if (v.t < 3.4 && v.t > .3) {
            const top = new THREE.Vector3(v.x, 6.1, v.z);
            if (Math.random() < .9)
                burst(top, 0xff6a1a, 2, 2.6, 0);
            if (Math.random() < .5)
                burst(top, 0xffd34a, 1, 3.2, 0);
            if (Math.random() < .25)
                burst(top, 0x555555, 1, 1.6, 0);
        }
        v.burn += dt;
        if (v.burn >= 1 && v.t < 3.5) {
            v.burn = 0;
            mobs.slice().forEach(m => { if (Math.hypot(m.pos.x - v.x, m.pos.z - v.z) < v.R * .6)
                hit(m, dmg(.25)); });
        }
        if (v.t > 5.2) {
            S.remove(v.g);
            S.remove(v.ring);
            S.remove(v.scorch);
            return false;
        }
        return true;
    });
    mnTick(dt, t);
}
// ===== The Pit: PvP flag, bots that dive in =====
function pitFlag(b, on) {
    if (on === !!b.pit)
        return;
    const r = b.hp / b.max;
    b.pit = on;
    b.max = CL[b.cls].hp + 20 * ((on ? PVPL : b.lvl) - 1);
    b.hp = Math.max(1, Math.round(r * b.max));
    if (on) {
        if (mobs.indexOf(b) < 0)
            mobs.push(b);
    }
    else {
        const i = mobs.indexOf(b);
        if (i >= 0 && !(DU && DU.b === b))
            mobs.splice(i, 1);
        b.aggro = false;
        b.dot = null;
        b.slow = 0;
        b.stun = 0;
        if (P && P.t === b)
            P.t = null;
    }
    wbLabelDraw(b);
}
function wbPitHurt(t, d, src) {
    if (t.dead)
        return;
    t.hp -= d;
    float(t.pos, '-' + d, '#f77');
    if (t.hp <= 0) {
        if (src && src.wb)
            wbXP(src, 20 + 3 * t.lvl);
        wbKill(t);
    }
}
function pitFoes(b) {
    const a = wbots.filter(o => o !== b && o.pit && !o.dead && groundH(o.pos.x, o.pos.z) < -.6);
    if (P.pit && !P.dead && !P.stealth && groundH(P.pos.x, P.pos.z) < -.6)
        a.push(P);
    return a;
}
function pitAI(b, dt, go, face, sp) {
    const inP = groundH(b.pos.x, b.pos.z) < -1.2;
    if (b.pitMode == 'go') {
        if (inP) {
            b.pitMode = 'fight';
            pitFlag(b, true);
            b.pitIdle = 0;
        }
        else
            go(ARENA.x, ARENA.z, sp);
        return;
    }
    if (b.pitMode == 'fight') {
        b.pitT -= dt;
        if (b.hp < b.max * .35 || b.pitT <= 0 || !inP && groundH(b.pos.x, b.pos.z) > -.3) {
            b.pitMode = 'leave';
            return;
        }
        const foes = pitFoes(b);
        let tg = null, bd = 1e9;
        foes.forEach(f => { const d = d3(f, b); if (d < bd) {
            bd = d;
            tg = f;
        } });
        if (!tg) {
            b.pitIdle += dt;
            if (d3({ pos: { x: ARENA.x, z: ARENA.z } }, b) > 6)
                go(ARENA.x, ARENA.z, sp * .6);
            if (b.pitIdle > 14)
                b.pitMode = 'leave';
            return;
        }
        b.pitIdle = 0;
        const R = b.rng ? 15 : 3;
        if (bd > R)
            go(tg.pos.x, tg.pos.z, sp);
        else {
            if (b.rng && bd < 6)
                go(2 * b.pos.x - tg.pos.x, 2 * b.pos.z - tg.pos.z, sp * .8);
            else
                face(tg);
            if (b.cd <= 0) {
                if (b.cls == 'priest' && b.hp < b.max * .45 && b.hc <= 0) {
                    b.hp = Math.min(b.max, b.hp + Math.round(b.max * .25));
                    b.hc = 8;
                    b.cd = 2;
                    float(b.pos, '+heal', '#6f6');
                    burst(b.pos, 0x66ff88, 8, 1.2);
                }
                else
                    wbSwing(b, tg, Math.round((10 + PVPL * 3) * b.k * rnd(.85, 1.15) * (tg === P ? G.diff : 1)), false);
            }
        }
        return;
    }
    if (b.pitMode == 'leave') {
        const dx = b.pos.x - ARENA.x, dz = b.pos.z - ARENA.z, l = Math.hypot(dx, dz) || 1;
        go(ARENA.x + dx / l * (ARENA.R + 8), ARENA.z + dz / l * (ARENA.R + 8), sp);
        if (groundH(b.pos.x, b.pos.z) > -.3) {
            pitFlag(b, false);
            b.pitMode = null;
        }
    }
}
function pitOff(silent) {
    P.pit = false;
    if (!G.on && !DU)
        pvpStats(false);
    $('pvpf').style.display = 'none';
    $('vig').style.opacity = 0;
    if (!silent)
        say('You are no longer flagged for PvP.');
}
function pitReset() { if (P)
    P.pit = false; $('pvpf').style.display = 'none'; $('vig').style.opacity = 0; }
function pitTick(dt, t) {
    pitFlames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 13 + i) * .25; });
    if (G.on || DU) {
        if (P.pit)
            pitOff(true);
        return;
    }
    const inside = groundH(P.pos.x, P.pos.z) < -1.2;
    if (inside) {
        P.pitT = 6;
        if (!P.pit) {
            P.pit = true;
            pvpStats(true);
            bn('⚔️ PvP zone — you are hostile!', 2400);
            say('<span style="color:#ff7a7a">You descend into The Pit. You are flagged for PvP — fight at equal power!</span>');
        }
    }
    else if (P.pit) {
        P.pitT -= dt;
        if (P.pitT <= 0)
            pitOff(false);
    }
    $('pvpf').style.display = P.pit ? 'block' : 'none';
    $('vig').style.opacity = P.pit ? .55 + Math.sin(t * 3) * .15 : 0;
}
// ===== Dungeon: The Crypt of Ashes (3 bosses) =====
const DG = { on: false, x: 0, z: 1200, name: 'Crypt of Ashes', left: 0, total: 0, bossDown: new Set(), cleared: false, t: 0, ret: null, px: 0, pz: 0 };
const DGR = [[0, 14], [74, 24], [158, 24], [246, 28]], DGC = [[10, 54], [94, 138], [178, 222]];
const DT0 = MOBS.length;
MOBS.push(['Skeleton Warrior', 0xd8d2b8, 1.15, 0], ['Crypt Ghoul', 0x7a8a5a, 1.3, 1], ['Cultist', 0x5a2a6a, 1.2, 0], ['Bone Brute', 0xc9c0a0, 1.9, 0], ['Shadow Wraith', 0x4a3a7a, 1.5, 0], ['Gravewarden Mortuk', 0x9a9a8a, 3.0, 0], ['Banshee Queen Sylvaine', 0x8a5ad0, 2.3, 0], ['Azrak the Ashen King', 0xc43a1a, 3.6, 0]);
const DGT = { skel: DT0, ghoul: DT0 + 1, cult: DT0 + 2, brute: DT0 + 3, wraith: DT0 + 4 };
const DG_BOSSES = [
    { id: 1, ty: DT0 + 5, name: 'Gravewarden Mortuk', lvl: 10, x: 0, z: 74, hpm: 12, dm: 1.6, spd: .85, rng: 4.6, acd: 1.5 },
    { id: 2, ty: DT0 + 6, name: 'Banshee Queen Sylvaine', lvl: 11, x: 0, z: 158, hpm: 12, dm: 1.4, spd: 1, rng: 3.6, acd: 1.2 },
    { id: 3, ty: DT0 + 7, name: 'Azrak the Ashen King', lvl: 13, x: 0, z: 258, hpm: 16, dm: 1.6, spd: .9, rng: 5.4, acd: 1.4 }
];
const DG_PLAN = [
    { ri: 1, cz: 74, lvl: 7, types: [DGT.skel, DGT.ghoul], n: 14, bx: 0, bz: 74 },
    { ri: 2, cz: 158, lvl: 8, types: [DGT.cult, DGT.wraith], n: 16, bx: 0, bz: 158 },
    { ri: 3, cz: 246, lvl: 9, types: [DGT.brute, DGT.wraith, DGT.skel], n: 12, bx: 0, bz: 258 }
];
let dgG = null, dgBlock = [], dgFlames = [], dgPortals = [], dgZones = [], dgLight = null, dgExit = null;
function dgWalk(x, z) {
    const rx = x - DG.x, rz = z - DG.z;
    for (const [cz, r] of DGR)
        if (Math.hypot(rx, rz - cz) < r - 1.2)
            return true;
    for (const [a, b] of DGC)
        if (Math.abs(rx) < 3.2 && rz > a && rz < b)
            return true;
    return false;
}
function dgClamp() {
    const ox = DG.px, oz = DG.pz;
    if (!dgWalk(P.pos.x, P.pos.z)) {
        if (dgWalk(P.pos.x, oz))
            P.pos.z = oz;
        else if (dgWalk(ox, P.pos.z))
            P.pos.x = ox;
        else {
            P.pos.x = ox;
            P.pos.z = oz;
        }
    }
    DG.px = P.pos.x;
    DG.pz = P.pos.z;
}
function buildDungeon() {
    if (dgG)
        return;
    dgG = new THREE.Group();
    dgG.position.set(DG.x, 0, DG.z);
    dgG.visible = false;
    S.add(dgG);
    const stoneM = new THREE.MeshLambertMaterial({ map: stoneT, color: 0x6a6480 }), floorM = new THREE.MeshLambertMaterial({ map: stoneT, color: 0x4a465a }), bone = new THREE.MeshLambertMaterial({ color: 0xe0dac0 });
    const box = (w, h, d, x, y, z, mat, ry) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry)
        m.rotation.y = ry; dgG.add(m); dgBlock.push(m); return m; };
    const flat = (g, x, y, z, mat) => { const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); dgG.add(m); return m; };
    const torch = (x, z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 2.6, 6), stoneM); p.position.set(x, 1.3, z); dgG.add(p); const f = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.1, 7), new THREE.MeshBasicMaterial({ color: 0xff9a2a })); f.position.set(x, 3.1, z); dgG.add(f); dgFlames.push(f); };
    DGR.forEach(([cz, r], i) => {
        flat(new THREE.CircleGeometry(r, 48), 0, .02, cz, floorM);
        const N = 40, openS = i > 0, openN = i < 3;
        for (let k = 0; k < N; k++) {
            const a = k / N * Math.PI * 2, sx = Math.cos(a) * r, sz = Math.sin(a) * r;
            if (Math.abs(sx) < 5.4 && ((sz < 0 && openS) || (sz > 0 && openN)))
                continue;
            box(2 * Math.PI * r / N * 1.04, 10, 1.6, Math.cos(a) * (r + .8), 5, cz + Math.sin(a) * (r + .8), stoneM, Math.atan2(-Math.cos(a), -Math.sin(a)));
            if (k % 4 == 0)
                torch(Math.cos(a) * (r - 1.2), cz + Math.sin(a) * (r - 1.2));
        }
        for (let k = 0; k < 14; k++) {
            const a = rnd(0, 6.28), rr = rnd(3, r - 3), b = new THREE.Mesh(k % 3 ? new THREE.SphereGeometry(rnd(.15, .3), 6, 5) : new THREE.BoxGeometry(.7, .12, .16), bone);
            b.position.set(Math.cos(a) * rr, .15, cz + Math.sin(a) * rr);
            b.rotation.y = rnd(0, 3);
            dgG.add(b);
        }
    });
    DGC.forEach(([a, b]) => {
        flat(new THREE.PlaneGeometry(8, b - a), 0, .02, (a + b) / 2, floorM);
        [-1, 1].forEach(s => box(1.2, 10, b - a, s * 4.4, 5, (a + b) / 2, stoneM));
        for (let z = a + 6; z < b - 4; z += 10)
            [-1, 1].forEach(s => torch(s * 3.4, z));
    });
    // portal to leave
    const mkPortal = (x, z, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, .28, 8, 32), new THREE.MeshBasicMaterial({ color: col })); ring.position.y = 2.8; g.add(ring); const d = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .45, side: 2 })); d.position.y = 2.8; g.add(d); dgG.add(g); const o = { g, d, x, z }; dgPortals.push(o); return o; };
    mkPortal(0, -10, 0x4a9cff);
    dgExit = mkPortal(0, 236, 0x66ffaa);
    dgExit.g.visible = false;
    // boss area decor
    const rune = (z, col, r) => flat(new THREE.RingGeometry(r - .4, r, 48), 0, .06, z, new THREE.MeshBasicMaterial({ color: col, side: 2, transparent: true, opacity: .8 }));
    rune(74, 0xd8d0a0, 9);
    rune(74, 0xd8d0a0, 5);
    rune(158, 0xb06aff, 10);
    rune(158, 0xb06aff, 6);
    for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + .3;
        box(1.6, 1, 3, Math.cos(a) * 18, .5, 74 + Math.sin(a) * 18, stoneM, a);
    }
    for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.2, 6), bone), f = new THREE.Mesh(new THREE.ConeGeometry(.2, .55, 6), new THREE.MeshBasicMaterial({ color: 0xc58aff }));
        c.position.set(Math.cos(a) * 12, .6, 158 + Math.sin(a) * 12);
        f.position.set(Math.cos(a) * 12, 1.5, 158 + Math.sin(a) * 12);
        dgG.add(c);
        dgG.add(f);
        dgFlames.push(f);
    }
    const lavaM = new THREE.MeshLambertMaterial({ map: mtex('lava', 0x8a1a1a), emissive: 0x7a2a08 });
    flat(new THREE.CircleGeometry(15, 40), 0, .05, 246, lavaM);
    rune(246, 0xff7a1a, 15);
    box(8, 1.4, 5, 0, .7, 270, stoneM);
    box(5, 1.4, 4, 0, 2.1, 271.5, stoneM);
    box(5, 6, 1.2, 0, 4.4, 273.5, stoneM);
    [-8, 8].forEach(x => { const br = new THREE.Mesh(new THREE.CylinderGeometry(.9, .6, 2, 8), stoneM); br.position.set(x, 1, 266); dgG.add(br); const f = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 8), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); f.position.set(x, 3.2, 266); dgG.add(f); dgFlames.push(f); });
    dgLight = new THREE.PointLight(0xffb870, 1.7, 42);
    dgLight.visible = false;
    S.add(dgLight);
    dgG.updateMatrixWorld(true);
}
function decorBoss(m) {
    const g = m.mesh, id = m.boss, s = MOBS[m.ty][2], C = c => new THREE.MeshLambertMaterial({ color: c, emissive: 0x220a04 });
    const aura = new THREE.Mesh(new THREE.SphereGeometry(1.5 * s, 14, 10), new THREE.MeshBasicMaterial({ color: id == 1 ? 0x77ff88 : id == 2 ? 0xb06aff : 0xff6a1a, transparent: true, opacity: .13 }));
    aura.position.y = .9 * s;
    g.add(aura);
    [-1, 1].forEach(sd => {
        if (id == 3) {
            const h = new THREE.Mesh(new THREE.ConeGeometry(.22 * s, .9 * s, 6), C(0x2a1a14));
            h.position.set(sd * .35 * s, 2.35 * s, .5 * s);
            h.rotation.z = -sd * .45;
            g.add(h);
        }
        if (id == 1) {
            const h = new THREE.Mesh(new THREE.ConeGeometry(.18 * s, .7 * s, 5), C(0xe0dac0));
            h.position.set(sd * .85 * s, 1.7 * s, 0);
            h.rotation.z = -sd * .9;
            g.add(h);
        }
    });
    if (id == 3)
        for (let i = 0; i < 5; i++) {
            const a = i / 5 * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(.12 * s, .5 * s, 5), new THREE.MeshBasicMaterial({ color: 0xffb02a }));
            f.position.set(Math.cos(a) * .35 * s, 2.15 * s, .5 * s + Math.sin(a) * .35 * s);
            g.add(f);
        }
    if (id == 2)
        g.traverse(o => { if (o.material && o.material.isMeshLambertMaterial) {
            o.material.transparent = true;
            o.material.opacity = .72;
        } });
}
function mkDgMob(ty, x, z, lvl, o) {
    const mesh = mobMesh(ty);
    mesh.position.set(x, 0, z);
    S.add(mesh);
    mesh.traverse(q => { if (q.isMesh && q.material.isMeshLambertMaterial)
        q.castShadow = true; });
    const hp = Math.round((30 + lvl * 22) * (o.hpm || 1.4));
    const m = { mesh, pos: mesh.position, hx: x, hz: z, lvl, ty, hp, max: hp, cd: rnd(0, 1), slow: 0, aggro: !!o.aggro, dg: 1, dm: o.dm || 1.25, spd: o.spd || 1 };
    if (o.boss) {
        m.boss = o.boss;
        m.name = o.name;
        m.rng = o.rng;
        m.acd = o.acd;
        decorBoss(m);
    }
    mobs.push(m);
    DG.left++;
    DG.total++;
    return m;
}
function spawnDungeon() {
    DG.left = 0;
    DG.total = 0;
    DG_PLAN.forEach(pl => {
        for (let i = 0; i < pl.n; i++) {
            let x, z, k = 0;
            do {
                const a = rnd(0, 6.283), r = rnd(5, DGR[pl.ri][1] - 5);
                x = Math.cos(a) * r;
                z = pl.cz + Math.sin(a) * r;
                k++;
            } while (k < 25 && Math.hypot(x - pl.bx, z - pl.bz) < 10);
            mkDgMob(pick(pl.types), DG.x + x, DG.z + z, pl.lvl, {});
        }
    });
    [[0, DGT.skel, 7], [1, DGT.cult, 8], [2, DGT.brute, 9]].forEach(([ci, ty, lvl]) => {
        const [a, b] = DGC[ci];
        for (let i = 0; i < 4; i++)
            mkDgMob(ty, DG.x + rnd(-2, 2), DG.z + a + 6 + (b - a - 12) * (i + .5) / 4, lvl, {});
    });
    DG_BOSSES.forEach(b => mkDgMob(b.ty, DG.x + b.x, DG.z + b.z, b.lvl, { boss: b.id, name: b.name, hpm: b.hpm, dm: b.dm, spd: b.spd, rng: b.rng, acd: b.acd }));
}
function enterDungeon() {
    if (DG.on)
        return;
    if (G.on || DU)
        return say('Finish your PvP match first.');
    if (P.pit)
        return say('Leave The Pit first.');
    ['dgw', 'pv', 'mb', 'adm', 'pause', 'map'].forEach(i => $(i).style.display = 'none');
    mapOpen = false;
    paused = false;
    dismount();
    P.cast = null;
    endChan();
    cancelGround(true);
    buildDungeon();
    DG.ret = { x: P.pos.x, z: P.pos.z };
    DG.on = true;
    DG.t = 0;
    DG.cleared = false;
    DG.bossDown = new Set();
    if (dgExit)
        dgExit.g.visible = false;
    dgG.visible = true;
    dgLight.visible = true;
    P.pos.set(DG.x, 0, DG.z - 4);
    P.by = 0;
    P.jy = 0;
    DG.px = P.pos.x;
    DG.pz = P.pos.z;
    yaw = Math.PI;
    P.t = null;
    spawnDungeon();
    bn('🏰 ' + DG.name, 2800);
    say('<span style="color:#c9a0ff">You enter the Crypt of Ashes. 3 bosses and ' + (DG.total - 3) + ' monsters lurk inside. The blue portal behind you leads out.</span>');
}
function leaveDungeon(quiet) {
    if (!DG.on)
        return;
    mobs.filter(m => m.dg).forEach(m => S.remove(m.mesh));
    mobs = mobs.filter(m => !m.dg);
    dgZones.forEach(z => S.remove(z.g));
    dgZones = [];
    dgG.visible = false;
    dgLight.visible = false;
    DG.on = false;
    if (P.t && mobs.indexOf(P.t) < 0)
        P.t = null;
    const r = DG.ret || { x: 0, z: -3 };
    P.pos.set(r.x, 0, r.z);
    P.by = 0;
    P.jy = 0;
    $('bossf').style.display = 'none';
    $('dgp').style.display = 'none';
    if (!quiet)
        say('You leave the Crypt of Ashes.');
}
function dgZone(x, z, r, col, delay, dmgv, src, kind) {
    const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 48), new THREE.MeshBasicMaterial({ color: col, side: 2, transparent: true, opacity: .9 })), disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: col, side: 2, transparent: true, opacity: .2 }));
    [ring, disc].forEach(o => { o.rotation.x = -Math.PI / 2; o.position.y = .14; g.add(o); });
    g.position.set(x, 0, z);
    g.scale.set(r, 1, r);
    S.add(g);
    dgZones.push({ g, disc, t: delay, max: delay, x, z, r, col, dmg: dmgv, src, kind });
}
function dgAdds(b, ty, n, lvl) {
    for (let i = 0; i < n; i++)
        mkDgMob(ty, b.pos.x + rnd(-7, 7), b.pos.z + rnd(-7, 7), lvl, { aggro: true });
    burst(b.pos, 0x9a44ff, 20, 1.6);
}
function bossTick(b, dt, t) {
    if (b.stun > 0)
        return;
    const eng = b.aggro || d3(b, P) < 24;
    if (!eng)
        return;
    const f = b.hp / b.max, id = b.boss;
    b.t1 = (b.t1 === undefined ? (id == 3 ? 4 : 5) : b.t1) - dt;
    if (id == 1) {
        if (b.t1 <= 0) {
            b.t1 = 9;
            dgZone(b.pos.x, b.pos.z, 8, 0xff5533, 1.4, 55, b, 'slam');
        }
        if (f < .5 && !b.p1) {
            b.p1 = 1;
            dgAdds(b, DGT.skel, 4, 9);
            bn('Mortuk raises the fallen!', 2200);
        }
    }
    else if (id == 2) {
        if (b.t1 <= 0) {
            b.t1 = 11;
            dgZone(b.pos.x, b.pos.z, 15, 0xb06aff, 1.3, 48, b, 'wail');
        }
        if (f < .66 && !b.p1) {
            b.p1 = 1;
            dgAdds(b, DGT.wraith, 3, 10);
            bn('Sylvaine calls the spirits!', 2200);
        }
        if (f < .33 && !b.p2) {
            b.p2 = 1;
            dgAdds(b, DGT.wraith, 3, 10);
            bn('The spirits answer again!', 2200);
        }
        if (Math.random() < .3)
            burst(b.pos, 0xb06aff, 1, .7, 1.8);
    }
    else {
        if (b.t1 <= 0) {
            b.t1 = 8;
            const px = P.pos.x, pz = P.pos.z;
            dgZone(px, pz, 5, 0xff7a1a, 1.7, 60, b, 'fire');
            for (let k = 0; k < 2; k++)
                dgZone(px + rnd(-9, 9), pz + rnd(-9, 9), 5, 0xff7a1a, 1.7, 60, b, 'fire');
        }
        if (f < .6 && !b.p1) {
            b.p1 = 1;
            dgAdds(b, DGT.brute, 4, 11);
            bn('Azrak summons his guard!', 2200);
        }
        if (f < .25 && !b.p2) {
            b.p2 = 1;
            b.dm *= 1.4;
            b.spd *= 1.25;
            bn('🔥 Azrak is ENRAGED!', 2600);
        }
        if (Math.random() < .4)
            burst(b.pos, 0xff7a1a, 1, 1.5, 3);
    }
}
function dgKilled(m) {
    DG.left = Math.max(0, DG.left - 1);
    if (m.boss) {
        DG.bossDown.add(m.boss);
        const B = DG_BOSSES[m.boss - 1], xp = 80 * B.lvl + 150, gd = 40 * B.lvl;
        addXP(xp);
        P.gold += gd;
        P.gear += m.boss == 3 ? 2 : 1;
        burst(m.pos, 0xffd24a, 40, 2.4);
        bn('☠ ' + B.name + ' defeated!', 3200);
        say('<b style="color:#ffd24a">' + B.name + ' defeated! +' + xp + ' xp, +' + gd + ' gold</b>');
        say('<span style="color:#c9f">★ Loot: Ember Blade +' + P.gear + ' (more damage!)</span>');
        if (DG.bossDown.size == 3) {
            DG.cleared = true;
            addXP(300);
            P.gold += 200;
            if (dgExit)
                dgExit.g.visible = true;
            setTimeout(() => { if (DG.on)
                bn('🏆 Dungeon Cleared!', 4500); }, 3300);
            say('<b style="color:#6fff9a">The Crypt of Ashes is cleared! +300 xp, +200 gold. A green portal opens.</b>');
        }
    }
}
function dgTick(dt, t) {
    if (!DG.on)
        return;
    DG.t += dt;
    dgLight.position.set(P.pos.x, 4.5, P.pos.z);
    dgFlames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 12 + i * 1.7) * .25; });
    dgPortals.forEach(p => { p.d.rotation.z += dt * 1.6; });
    P.slowT = Math.max(0, (P.slowT || 0) - dt);
    mobs.forEach(m => { if (m.boss)
        bossTick(m, dt, t); });
    dgZones = dgZones.filter(z => {
        z.t -= dt;
        z.disc.material.opacity = .12 + .38 * (1 - Math.max(0, z.t) / z.max);
        if (z.t > 0)
            return true;
        if (Math.hypot(P.pos.x - z.x, P.pos.z - z.z) < z.r && !P.dead) {
            foeHit(P, z.dmg, z.src);
            if (z.kind == 'wail')
                P.slowT = 3.5;
        }
        burst(new THREE.Vector3(z.x, 0, z.z), z.col, 22, 2, .2);
        S.remove(z.g);
        return false;
    });
    if (DG.t > 3)
        dgPortals.forEach(p => { if (p.g.visible && DG.on && Math.hypot(P.pos.x - (DG.x + p.x), P.pos.z - (DG.z + p.z)) < 2.5)
            leaveDungeon(); });
    if (!DG.on)
        return;
    let bf = null;
    mobs.forEach(m => { if (m.boss && (m.aggro || d3(m, P) < 28) && (!bf || d3(m, P) < d3(bf, P)))
        bf = m; });
    const el = $('bossf');
    if (bf) {
        const s = `<b style="color:#ff9a6a">${bf.name}</b> <small>Lv ${bf.lvl}</small><div class="bar" style="height:14px"><i style="background:#c0392b;width:${Math.max(0, bf.hp / bf.max * 100)}%"></i></div>`;
        if (el.dataset.s !== s) {
            el.dataset.s = s;
            el.innerHTML = s;
        }
        el.style.display = 'block';
    }
    else
        el.style.display = 'none';
    const pn = $('dgp'), ps = '🏰 <b>' + DG.name + '</b><br>Bosses ' + DG.bossDown.size + '/3 · Monsters left ' + DG.left + (DG.cleared ? '<br><span style="color:#6fff9a">Cleared! Use the green portal.</span>' : '');
    if (pn.dataset.s !== ps) {
        pn.dataset.s = ps;
        pn.innerHTML = ps;
    }
    pn.style.display = 'block';
}
function toggleDg() {
    if (!running)
        return;
    const p = $('dgw');
    p.style.display = p.style.display == 'flex' ? 'none' : 'flex';
    renderDg();
}
function renderDg() {
    const inD = DG.on, low = P && P.lvl < 6;
    $('dgw').innerHTML = `<div class="mp" style="min-width:min(520px,92vw);text-align:center"><b style="color:var(--gold)">🏰 Dungeons</b><span onclick="toggleDg()" style="float:right;cursor:pointer">✕</span><div style="margin:12px 0;padding:12px;border:2px solid #7a5a22;border-radius:8px;background:radial-gradient(circle at 50% 0,#3a1a4a,#0a0610 80%);text-align:left"><div style="font-size:18px;color:#d9b8ff"><b>The Crypt of Ashes</b></div><div style="font-size:12px;opacity:.85;margin:4px 0 8px">A haunted crypt beneath the meadow. Recommended level 7+. Monsters here are stronger than outside.</div>${DG_BOSSES.map(b => `<div style="font-size:13px;margin:3px 0">${inD && DG.bossDown.has(b.id) ? '✔' : '☠'} <b>${b.name}</b> <small style="opacity:.75">· Lv ${b.lvl}</small></div>`).join('')}<div style="font-size:12px;opacity:.8;margin-top:6px">3 bosses · about 60 monsters${low ? '<br><span style="color:#ff9a6a">⚠ You are below the recommended level.</span>' : ''}</div></div>${inD ? '<button onclick="leaveDungeon();toggleDg()">🚪 Leave the Dungeon</button>' : '<button onclick="enterDungeon()">⚔ Enter the Dungeon</button>'}</div>`;
}
// ===== Mounts v2: proper quadruped / bird / dragon anatomy with animation =====
const MH = {
    mat: (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})),
    bas: c => new THREE.MeshBasicMaterial({ color: c }),
    mesh(g, parent, x, y, z, mat, sx, sy, sz) { const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); if (sx)
        m.scale.set(sx, sy, sz); (parent).add(m); m.castShadow = true; return m; },
    sph(r, parent, x, y, z, mat, sx, sy, sz) { return MH.mesh(new THREE.SphereGeometry(r, 12, 9), parent, x, y, z, mat, sx, sy, sz); },
    cyl(rt, rb, h, parent, x, y, z, mat, seg) { return MH.mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 9), parent, x, y, z, mat); },
    box(w, h, d, parent, x, y, z, mat) { return MH.mesh(new THREE.BoxGeometry(w, h, d), parent, x, y, z, mat); },
    cone(r, h, parent, x, y, z, mat, rx, rz, seg) { const m = MH.mesh(new THREE.ConeGeometry(r, h, seg || 6), parent, x, y, z, mat); m.rotation.set(rx || 0, 0, rz || 0); return m; },
    // tapered rod between two points
    rod(parent, a, b, r1, r2, mat, seg) { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dx, dy, dz) || 1e-3; const m = MH.mesh(new THREE.CylinderGeometry(r2, r1, len, seg || 8), parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, mat); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)); return m; },
    // jointed leg hanging from a hip group; returns hip group (userData holds base angles)
    leg(parent, x, y, z, o) {
        const hip = new THREE.Group(), knee = new THREE.Group();
        hip.position.set(x, y, z);
        parent.add(hip);
        MH.sph(o.r1 * 1.08, hip, 0, 0, 0, o.mat, 1, 1, 1.15);
        MH.cyl(o.r1, o.r2, o.u, hip, 0, -o.u / 2, 0, o.mat);
        knee.position.y = -o.u;
        hip.add(knee);
        MH.sph(o.r2 * 1.1, knee, 0, 0, 0, o.mat);
        MH.cyl(o.r2 * .92, o.r3, o.l, knee, 0, -o.l / 2, 0, o.lmat || o.mat);
        const fy = -o.l;
        if (o.foot == 'paw') {
            MH.sph(o.r3 * 1.7, knee, 0, fy - o.r3 * .35, o.r3 * .8, o.fmat || o.mat, 1, .55, 1.5);
            for (let k = -1; k <= 1; k++)
                MH.cone(.035, .14, knee, k * o.r3 * .75, fy - o.r3 * .55, o.r3 * 2.1, o.cmat || MH.mat(0xe8e0d0), Math.PI / 2 + .4);
        }
        else if (o.foot == 'talon') {
            MH.sph(o.r3 * 1.3, knee, 0, fy, o.r3, o.fmat || o.mat, 1, .6, 1.4);
            for (let k = -1; k <= 1; k++)
                MH.cone(.04, .3, knee, k * o.r3 * .9, fy - .03, o.r3 * 2.4, o.cmat || MH.mat(0x2a2218), Math.PI / 2 + .5);
        }
        else if (o.foot == 'cloven') {
            [-1, 1].forEach(s => MH.cyl(o.r3 * .75, o.r3 * 1.0, .16, knee, s * o.r3 * .7, fy - .06, .02, MH.mat(0x1a1612)));
        }
        else {
            MH.sph(o.r3 * 1.15, knee, 0, fy + .02, 0, o.mat);
            MH.cyl(o.r3 * 1.05, o.r3 * 1.45, .2, knee, 0, fy - .09, .02, MH.mat(o.hoof || 0x1c1814));
        }
        hip.rotation.x = o.hip || 0;
        knee.rotation.x = o.knee || 0;
        hip.userData = { hip0: o.hip || 0, knee0: o.knee || 0, kn: knee };
        return hip;
    },
    // jointed chain (neck / tail); each seg has its own rotation; returns {segs, end}
    chain(parent, x, y, z, n, len, r0, r1, angs, mat, taperEnd) {
        const segs = [];
        let p = parent;
        for (let i = 0; i < n; i++) {
            const gr = new THREE.Group(), ra = r0 + (r1 - r0) * i / n, rb = r0 + (r1 - r0) * (i + 1) / n;
            if (i == 0)
                gr.position.set(x, y, z);
            else
                gr.position.y = len;
            gr.rotation.x = angs[i];
            p.add(gr);
            MH.cyl(rb, ra, len, gr, 0, len / 2, 0, mat, 9);
            MH.sph(rb * 1.02, gr, 0, len, 0, mat);
            gr.userData = { a0: angs[i] };
            segs.push(gr);
            p = gr;
        }
        const end = new THREE.Group();
        end.position.y = len;
        p.add(end);
        return { segs, end };
    }
};
const MS2 = {
    'Brown Horse': { fam: 'horse', t: 'fur', mane: 0x20120a, blaze: 1, ride: 1.62 },
    'Golden Charger': { fam: 'horse', t: 'armor', mane: 0xfff2b0, armor: 1, ride: 1.62 },
    'Hellsteed': { fam: 'horse', t: 'lava', mane: 0xff5a1a, flame: 1, horns: 1, eye: 0xffee33, ride: 1.62 },
    'Spirit Steed': { fam: 'horse', t: 'sparkle', mane: 0xffffff, ride: 1.62 },
    'Forest Stag': { fam: 'horse', t: 'fur', mane: 0x3a2a14, ride: 1.62 },
    'Arcane Unicorn': { fam: 'horse', t: 'sparkle', mane: 0xff7aff, horn: 1, wing: 1, ride: 1.62 }
};
function mhHorse(g, root, d, s, mats, refs) {
    const coat = mats.coat, mane = mats.mane, M = MH;
    // --- body ---
    M.sph(1, root, 0, 1.78, 0, coat, .62, .6, 1.3);
    M.sph(.6, root, 0, 1.72, .8, coat, 1, 1.02, .95);
    M.sph(.64, root, 0, 1.8, -.74, coat, .96, 1, 1);
    M.sph(.36, root, 0, 2.28, .55, coat, 1, .55, 1.3);
    M.sph(.5, root, 0, 1.4, .1, coat, 1.05, .6, 1.4);
    // --- legs ---
    const legs = [];
    const lg = (x, z, hind) => {
        const u = .64, l = .62, a = hind ? -.42 : .05, k = hind ? 1.0 : -.02, th2 = a + k;
        const y = u * Math.cos(a) + l * Math.cos(th2) + .19 * Math.cos(th2) + (hind ? 0 : 0);
        return M.leg(root, x, y, z, { u, l, r1: hind ? .23 : .2, r2: .14, r3: .1, mat: coat, hip: a, knee: k, hoof: s.flame ? 0x331008 : 0x1c1814 });
    };
    legs.push(lg(-.34, .8, false), lg(.34, .8, false), lg(-.36, -.78, true), lg(.36, -.78, true));
    refs.legs = legs;
    // --- neck + head ---
    const nk = M.chain(root, 0, 2.0, .9, 3, .5, .38, .23, [.7, .2, .12], coat);
    refs.neck = nk.segs;
    nk.segs.forEach((sg, i) => {
        const r = .3 - i * .03;
        M.box(.07, .48, .14, sg, 0, .26, -(r + .02), mane);
        if (!s.flame)
            M.cone(.06, .22, sg, 0, .1, -(r + .1), mane, -2.6);
    });
    const hdr = new THREE.Group(), hd = new THREE.Group();
    hdr.rotation.x = 1.35;
    nk.end.add(hdr);
    hd.scale.setScalar(1.25);
    hdr.add(hd);
    refs.head = hdr;
    refs.head0 = 1.35;
    M.sph(.22, hd, 0, .04, 0, coat, .95, 1.15, 1);
    M.sph(.17, hd, 0, .08, .08, coat);
    M.cyl(.115, .15, .54, hd, 0, .38, .03, coat);
    M.sph(.125, hd, 0, .67, .04, coat, 1, .9, .95);
    M.cyl(.1, .13, .4, hd, 0, .3, .15, coat);
    [-1, 1].forEach(sd => {
        M.sph(.03, hd, sd * .06, .74, .09, M.mat(0x120a08));
        M.sph(.05, hd, sd * .19, .1, -.06, mats.eye);
        M.sph(.024, hd, sd * .22, .11, -.075, M.bas(0xffffff));
        M.cone(.07, .22, hd, sd * .1, -.1, -.19, coat, -1.25, -sd * .15);
    });
    M.cone(.09, .22, hd, 0, -.03, -.2, mane, -1.6);
    if (s.blaze)
        M.box(.07, .5, .02, hd, 0, .3, -.125, M.mat(0xf4f0e8));
    const lea = M.mat(0x3a2418), tor = new THREE.Mesh(new THREE.TorusGeometry(.145, .018, 6, 14), lea);
    tor.rotation.x = Math.PI / 2;
    tor.position.set(0, .46, .03);
    hd.add(tor);
    M.box(.02, .5, .02, hd, .19, .12, -.0, lea).rotation.z = .0;
    M.box(.02, .5, .02, hd, -.19, .12, -.0, lea);
    if (s.horn) {
        const hn = M.cone(.06, .62, hd, 0, .12, -.36, M.mat(0xfff0ff, { emissive: 0x6a4a7a }), -.95);
        for (let k = 0; k < 4; k++)
            M.mesh(new THREE.TorusGeometry(.055 - k * .008, .012, 5, 10), hd, 0, .1 + k * .1, -.3 - k * .09, M.mat(0xd8b8ff, { emissive: 0x4a2a6a })).rotation.x = Math.PI / 2 - .95;
    }
    if (s.horns)
        [-1, 1].forEach(sd => M.cone(.06, .42, hd, sd * .16, -.08, -.26, M.mat(0x2a1a14), -.9, -sd * .45));
    if (s.armor) {
        const gold = M.mat(0xe8b84a, { emissive: 0x3a2a08 }), steel = M.mat(0xc8d0dc, { emissive: 0x141820 });
        M.mesh(new THREE.BoxGeometry(.3, .62, .05), hd, 0, .34, -.13, gold);
        M.sph(.1, hd, 0, .42, -.15, steel);
        M.sph(.5, root, 0, 1.72, .98, steel, 1, 1, .7).material.emissive = new THREE.Color(0x141820);
        nk.segs.forEach((sg, i) => M.box(.5 - i * .05, .12, .4 - i * .03, sg, 0, .26, 0, i % 2 ? steel : gold));
        const cap = M.mat(0xf2ece0, { emissive: 0x2a2418 });
        M.box(.98, .05, 1.2, root, 0, 2.4, -.1, cap);
        [-1, 1].forEach(sd => { const dr = M.box(.05, .85, 1.3, root, sd * .66, 2.0, -.1, cap); dr.rotation.z = sd * .22; M.box(.06, .08, 1.3, root, sd * .74, 1.6, -.1, M.mat(0xe8b84a, { emissive: 0x3a2a08 })).rotation.z = sd * .22; });
    }
    // --- tail ---
    const tl = M.chain(root, 0, 2.05, -1.2, 4, .4, .1, .06, [-2.55, .3, .3, .3], mane);
    refs.tail = tl.segs;
    M.cone(.12, .55, tl.end, 0, .0, 0, mane, Math.PI);
    // --- saddle ---
    const lea2 = M.mat(0x5a2a1a), blanket = M.mat(s.armor ? 0xf6f2ea : 0x7a1a1a);
    M.box(.98, .05, 1.15, root, 0, 2.4, -.05, blanket);
    M.box(.5, .1, .66, root, 0, 2.47, -.05, lea2);
    M.box(.32, .17, .1, root, 0, 2.54, .3, lea2);
    M.box(.34, .22, .1, root, 0, 2.56, -.38, lea2);
    [-1, 1].forEach(sd => {
        M.box(.03, .75, .06, root, sd * .56, 2.05, -.05, lea2);
        const st = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 6, 12), M.mat(0xc8c8d0));
        st.position.set(sd * .56, 1.66, -.05);
        st.rotation.y = Math.PI / 2;
        root.add(st);
    });
    if (s.flame) {
        refs.flames = [];
        nk.segs.forEach((sg, i) => { const f = M.cone(.09, .45, sg, 0, .25, -.3, M.bas(i % 2 ? 0xff7a1a : 0xffc22a), -2.2); refs.flames.push(f); });
        tl.segs.forEach(sg => refs.flames.push(M.cone(.1, .4, sg, 0, .2, 0, M.bas(0xff6a1a))));
        legs.forEach(l => { const f = M.cone(.1, .3, l.userData.kn, 0, -.62, 0, M.bas(0xff8a2a)); refs.flames.push(f); });
    }
}
// ---------- quadrupeds: wolf, panther, bear, boar, gryphon, drake ----------
Object.assign(MS2, {
    'Gryphon': { fam: 'quad', t: 'fur', head: 'eagle', fea: 0xf2ead8, L: 1.0, rx: .5, ry: .5, u: .5, l: .46, r1: .17, r2: .11, r3: .08, foot: 'talon', hfoot: 'paw', hindA: -.3, hindK: .7, neck: { n: 3, len: .38, r0: .36, r1: .24, angs: [.75, .12, .02] }, hd: 1.0, tail: { n: 4, len: .4, r0: .12, r1: .07, angs: [-2.2, .3, .3, .3] }, fly: 1, wing: { type: 'feather', len: 2.5, n: 12, fw: .26, armC: 0xc8a050, c1: 0xf4ecd8, c2: 0xc8a050 }, eye: 0xffcc22 },
    'Ember Drake': { fam: 'quad', t: 'scale', head: 'dragon', L: 1.3, rx: .58, ry: .55, u: .5, l: .46, r1: .2, r2: .13, r3: .09, foot: 'talon', hindA: -.3, hindK: .75, neck: { n: 5, len: .42, r0: .38, r1: .2, angs: [.55, .25, .15, .1, .05] }, hd: 1.1, tail: { n: 7, len: .5, r0: .3, r1: .05, angs: [-2.4, .25, .25, .2, .2, .2, .2], spikes: 1 }, fly: 1, wing: { type: 'bat', len: 3.0, bone: 0x2a4a28, mem: 0x2a8a3a, em: 0x0a2a10 }, eye: 0xff6a1a },
    'Dire Wolf': { fam: 'quad', t: 'fur', head: 'wolf', L: .9, rx: .54, ry: .52, u: .44, l: .42, r1: .2, r2: .13, r3: .095, foot: 'paw', hindA: -.35, hindK: .85, neck: { n: 2, len: .42, r0: .4, r1: .28, angs: [.85, .3] }, hd: 1.0, tail: { n: 3, len: .4, r0: .14, r1: .08, angs: [-2.2, .35, .35] }, ruff: 1, spine: 1, eye: 0xffcc22 },
    'Shadow Panther': { fam: 'quad', t: 'spot', head: 'cat', L: 1.15, rx: .42, ry: .42, u: .5, l: .5, r1: .14, r2: .09, r3: .07, foot: 'paw', hindA: -.3, hindK: .75, neck: { n: 2, len: .4, r0: .32, r1: .24, angs: [.8, .35] }, hd: 1.0, tail: { n: 5, len: .4, r0: .09, r1: .05, angs: [-2.0, .35, .3, .3, .3] }, eye: 0x66ff88 },
    'Great Bear': { fam: 'quad', t: 'fur', head: 'bear', L: .85, rx: .62, ry: .6, u: .56, l: .5, r1: .3, r2: .22, r3: .14, foot: 'paw', hindA: -.2, hindK: .5, neck: { n: 2, len: .4, r0: .5, r1: .42, angs: [.7, .35] }, hd: 1.15, tail: { n: 1, len: .25, r0: .14, r1: .1, angs: [-2.4] }, hump: 1 },
    'Iron Boar': { fam: 'quad', t: 'fur', head: 'boar', L: .8, rx: .55, ry: .55, u: .52, l: .46, r1: .23, r2: .16, r3: .1, foot: 'cloven', hindA: -.15, hindK: .4, neck: { n: 2, len: .34, r0: .5, r1: .4, angs: [.55, .3] }, hd: 1.2, tail: { n: 2, len: .22, r0: .06, r1: .04, angs: [-2.0, .9] }, bristles: 1, armor: 1, eye: 0xff4a2a }
});
function mhQuad(g, root, d, s, mats, refs) {
    const M = MH, coat = mats.coat, mane = mats.mane;
    const a = s.hindA, k = s.hindK, th2 = a + k, hipH = s.u * Math.cos(a) + s.l * Math.cos(th2) + .1 * Math.cos(th2) + .05, hipF = s.u * Math.cos(.05) + s.l * Math.cos(.03) + .15;
    const by = Math.max(hipH, hipF) + s.ry * .45;
    refs.by = by;
    // body
    M.sph(1, root, 0, by, 0, coat, s.rx, s.ry, s.L * 1.25);
    M.sph(s.rx * 1.02, root, 0, by + s.ry * .05, s.L * .72, mats.fea || coat, 1, 1.03, .9);
    M.sph(s.rx * 1.0, root, 0, by + s.ry * .04, -s.L * .72, coat, 1, 1.02, .95);
    if (s.hump)
        M.sph(.5, root, 0, by + s.ry * .75, s.L * .45, coat, 1.1, .8, 1.2);
    // legs
    const legs = [];
    const lg = (x, z, hind) => M.leg(root, x, hind ? hipH : hipF, z, { u: s.u, l: s.l, r1: hind ? s.r1 * 1.15 : s.r1, r2: s.r2, r3: s.r3, mat: coat, foot: hind ? (s.hfoot || s.foot) : s.foot, hip: hind ? a : .05, knee: hind ? k : -.03 });
    legs.push(lg(-s.rx * .62, s.L * .62, false), lg(s.rx * .62, s.L * .62, false), lg(-s.rx * .66, -s.L * .62, true), lg(s.rx * .66, -s.L * .62, true));
    refs.legs = legs;
    // neck + head
    const nc = s.neck, nk = M.chain(root, 0, by + s.ry * .45, s.L * .75, nc.n, nc.len, nc.r0, nc.r1, nc.angs, mats.fea || coat);
    refs.neck = nk.segs;
    if (s.ruff)
        nk.segs.forEach((sg, i) => { for (let q = -1; q <= 1; q += 1)
            M.cone(.2, .5, sg, q * .3, .22, -.05, coat, -.5, q * -.6); });
        for (let q = -1; q <= 1; q += 2)
            M.cone(.18, .45, root, q * .4, by + s.ry * .4, s.L * .8, coat, -.2, -q * .9);
    const sum = nc.angs.reduce((x, y) => x + y, 0), cum = s.head == 'eagle' ? 1.6 : s.head == 'dragon' ? 1.75 : 2.0;
    const hdr = new THREE.Group(), hd = new THREE.Group();
    hdr.rotation.x = cum - sum;
    nk.end.add(hdr);
    hd.scale.setScalar(s.hd || 1);
    hdr.add(hd);
    refs.head = hdr;
    refs.head0 = cum - sum;
    const eye = mats.eye, dk = M.mat(0x120a08), white = M.mat(0xf2ede0);
    const eyes = (x, y, z, r) => [-1, 1].forEach(sd => { M.sph(r || .045, hd, sd * x, y, z, eye); M.sph((r || .045) * .5, hd, sd * (x + .02), y + .01, z - .01, M.bas(0x050505)); });
    if (s.head == 'wolf') {
        M.sph(.27, hd, 0, .05, 0, coat, 1, 1.1, 1);
        M.cyl(.09, .17, .5, hd, 0, .4, .03, coat, 8);
        M.sph(.085, hd, 0, .68, .02, dk);
        M.cyl(.07, .12, .4, hd, 0, .34, .15, coat, 8);
        eyes(.2, .14, -.06);
        [-1, 1].forEach(sd => { M.cone(.12, .34, hd, sd * .15, -.1, -.24, coat, -.3 - 1.0, sd * -.25); M.cone(.025, .1, hd, sd * .08, .52, .12, white, Math.PI); M.cone(.06, .25, hd, sd * .28, .0, .02, coat, 0, sd * -1.1); });
        M.box(.1, .06, .26, hd, 0, .5, .13, M.mat(0xc04a4a));
    }
    else if (s.head == 'cat') {
        M.sph(.26, hd, 0, .05, 0, coat, 1, 1.05, .95);
        M.cyl(.1, .15, .28, hd, 0, .3, .05, coat, 8);
        M.sph(.07, hd, 0, .46, .04, M.mat(0x2a1a22));
        eyes(.17, .14, -.08, .05);
        [-1, 1].forEach(sd => { M.sph(.09, hd, sd * .17, -.08, -.2, coat, 1, .8, .6); M.cone(.025, .12, hd, sd * .06, .38, .12, white, Math.PI); });
        M.cyl(.06, .1, .22, hd, 0, .26, .15, coat, 8);
    }
    else if (s.head == 'bear') {
        M.sph(.34, hd, 0, .05, 0, coat, 1.05, 1, 1);
        M.cyl(.15, .22, .32, hd, 0, .38, .06, coat, 9);
        M.sph(.1, hd, 0, .56, .04, dk);
        eyes(.22, .16, -.1, .04);
        [-1, 1].forEach(sd => M.sph(.11, hd, sd * .24, -.1, -.26, coat, 1, 1, .7));
        M.cyl(.1, .17, .22, hd, 0, .3, .18, coat, 8);
    }
    else if (s.head == 'boar') {
        M.sph(.3, hd, 0, .05, 0, coat, 1.05, 1.1, 1);
        M.cyl(.17, .22, .52, hd, 0, .4, .04, coat, 9);
        M.cyl(.15, .15, .08, hd, 0, .68, .04, M.mat(0x7a5a5a), 9);
        M.cyl(.1, .17, .42, hd, 0, .32, .17, coat, 8);
        eyes(.23, .17, -.1, .04);
        [-1, 1].forEach(sd => { M.cone(.06, .5, hd, sd * .2, .5, .16, white, -.5, sd * .55); M.cone(.1, .24, hd, sd * .2, -.12, -.2, coat, -.9, sd * -.3); });
    }
    else if (s.head == 'eagle') {
        const fea = mats.fea, bk = M.mat(0xf0b020, { emissive: 0x4a3008 });
        M.sph(.23, hd, 0, .04, 0, fea, 1, 1.1, 1);
        M.cone(.14, .46, hd, 0, .38, .03, bk, .32);
        M.cone(.09, .3, hd, 0, .3, .1, bk, -.05);
        M.box(.36, .05, .12, hd, 0, .14, -.15, fea);
        eyes(.18, .12, -.09, .06);
        for (let q = -1; q <= 1; q++)
            M.cone(.07, .36, hd, q * .1, -.15, -.12, fea, -2.0, q * .3);
        [-1, 1].forEach(sd => M.sph(.13, hd, sd * .17, 0, .03, fea));
    }
    else if (s.head == 'dragon') {
        const hornM = M.mat(0x2a2218), tooth = white;
        M.sph(.27, hd, 0, .02, 0, coat, 1, 1.05, 1);
        M.cyl(.14, .25, .76, hd, 0, .4, .02, coat, 8);
        M.cyl(.1, .2, .58, hd, 0, .34, .16, coat, 8);
        for (let q = 0; q < 5; q++)
            [-1, 1].forEach(sd => M.cone(.025, .11, hd, sd * (.1 + q * .006), .2 + q * .12, .1, tooth, Math.PI));
        [-1, 1].forEach(sd => {
            M.cone(.075, .56, hd, sd * .17, -.1, -.2, hornM, -2.1, sd * .35);
            M.cone(.05, .24, hd, sd * .3, 0, .04, coat, 0, sd * -1.2);
            M.sph(.05, hd, sd * .06, .74, .05, dk);
            M.box(.14, .05, .12, hd, sd * .18, .12, -.14, coat);
        });
        eyes(.2, .12, -.1, .055);
    }
    // tail
    const tl = M.chain(root, 0, by + s.ry * .35, -s.L * 1.1, s.tail.n, s.tail.len, s.tail.r0, s.tail.r1, s.tail.angs, coat);
    refs.tail = tl.segs;
    if (s.head == 'wolf')
        M.sph(.17, tl.end, 0, .05, 0, coat, 1, 1.4, 1);
    if (s.head == 'eagle')
        M.sph(.2, tl.end, 0, .08, 0, mane, .9, 1.6, .9);
    if (s.tail.spikes)
        tl.segs.forEach((sg, i) => M.cone(.09 - i * .008, .3 - i * .02, sg, 0, s.tail.len * .5, -(.2 - i * .02), mane, -.4));
    if (s.head == 'dragon')
        M.cone(.14, .5, tl.end, 0, .2, 0, mane, 0);
    if (s.spine)
        for (let q = 0; q < 7; q++)
            M.cone(.07, .28, root, 0, by + s.ry * .9, s.L * 0.9 - q * s.L * .3, mane, -.3);
    if (s.head == 'dragon')
        for (let q = 0; q < 8; q++)
            M.cone(.1 - q * .005, .38, root, 0, by + s.ry * .95, s.L * 1.1 - q * s.L * .3, mane, -.25);
    if (s.head == 'dragon')
        M.box(.62, .06, 2.2, root, 0, by - s.ry * .9, 0.2, M.mat(0xe8d08a));
    if (s.bristles)
        for (let q = 0; q < 9; q++)
            M.cone(.07, .3, root, 0, by + s.ry * .95, s.L * 1.0 - q * s.L * .24, M.mat(0x2a1a14), -.4);
    if (s.armor) {
        const st = M.mat(0x9aa4b4, { emissive: 0x141820 });
        M.sph(.62, root, 0, by + s.ry * .35, s.L * .5, st, 1, .55, 1.1);
        M.sph(.62, root, 0, by + s.ry * .3, -s.L * .3, st, 1, .5, 1.2);
        [-1, 1].forEach(sd => M.cone(.09, .35, root, sd * s.rx * .8, by + s.ry * .75, s.L * .45, st, 0, -sd * .6));
        M.box(.4, .3, .08, hd, 0, .3, -.28, st);
    }
    // saddle
    const lea = M.mat(0x4a2a1a), top = by + s.ry * 1.0 + (s.hump ? .15 : 0);
    M.box(.8, .06, .95, root, 0, top, -.05, M.mat(0x6a1a1a));
    M.box(.46, .1, .62, root, 0, top + .07, -.05, lea);
    M.box(.3, .15, .1, root, 0, top + .14, .3, lea);
    M.box(.32, .2, .1, root, 0, top + .16, -.38, lea);
    refs.saddleTop = top + .12;
}

CM.warrior.col = 0x6a4a38;
// ---------- wings ----------
MH.tris = function (parent, pts, idx, mat) {
    const g = new THREE.BufferGeometry(), arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2]; });
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    parent.add(m);
    return m;
};
MH.featherWing = function (parent, side, o) {
    const piv = new THREE.Group(), M = MH, len = o.len;
    piv.position.set(side * o.x, o.y, o.z);
    parent.add(piv);
    const arm = M.mat(o.armC), f1 = M.mat(o.c1, o.em ? { emissive: o.em } : {}), f2 = M.mat(o.c2, o.em ? { emissive: o.em } : {});
    const E = { x: side * len * .4, y: len * .14, z: -.05 }, T = { x: side * len, y: len * .06, z: -len * .08 };
    M.rod(piv, { x: 0, y: 0, z: 0 }, E, .12, .09, arm);
    M.rod(piv, E, T, .09, .04, arm);
    const n = o.n || 11;
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1), pos = t < .4 ? { x: E.x * (t / .4), y: E.y * (t / .4), z: -.05 * (t / .4) } : { x: E.x + (T.x - E.x) * ((t - .4) / .6), y: E.y + (T.y - E.y) * ((t - .4) / .6), z: -.05 + (T.z + .05) * ((t - .4) / .6) };
        const L = len * (t > .78 ? .78 - (t - .78) * .6 : .34 + .5 * t), sw = side * (.06 + .62 * t);
        for (let layer = 0; layer < 2; layer++) {
            const ll = layer ? L * .55 : L, f = new THREE.Mesh(new THREE.BoxGeometry(o.fw, .03, ll), layer ? f2 : f1);
            f.position.z = -ll / 2;
            const gp = new THREE.Group();
            gp.position.set(pos.x, pos.y - layer * .03 + .02, pos.z - .05);
            gp.rotation.y = sw * (layer ? .8 : 1);
            gp.add(f);
            piv.add(gp);
        }
    }
    return piv;
};
MH.batWing = function (parent, side, o) {
    const piv = new THREE.Group(), M = MH, L = o.len;
    piv.position.set(side * o.x, o.y, o.z);
    parent.add(piv);
    const bone = M.mat(o.bone), mem = M.mat(o.mem, { side: 2, emissive: o.em || 0 });
    const P = (x, y, z) => ({ x: side * x * L, y: y * L, z: z * L });
    const S0 = P(0, 0, 0), E = P(.36, .3, -.08), W = P(.74, .26, -.2), F = [P(1.04, .1, -.32), P(.92, .02, -.72), P(.64, -.04, -.98), P(.3, -.06, -.86)], B = P(.02, -.1, -.6);
    M.rod(piv, S0, E, .13, .1, bone);
    M.rod(piv, E, W, .1, .07, bone);
    F.forEach(f => M.rod(piv, W, f, .06, .022, bone));
    M.cone(.06, .3, piv, W.x, W.y + .1, W.z, bone, 0, 0);
    const v = [S0, W, F[0], F[1], F[2], F[3], B].map(p => [p.x, p.y, p.z]);
    const ix = side > 0 ? [[0, 1, 6], [1, 5, 6], [1, 4, 5], [1, 3, 4], [1, 2, 3]] : [[0, 6, 1], [1, 6, 5], [1, 5, 4], [1, 4, 3], [1, 3, 2]];
    MH.tris(piv, v, ix.flat(), mem);
    return piv;
};
// ---------- wings attach + swan + dispatch ----------
Object.assign(MS2, { 'Radiant Swan': { fam: 'swan', t: 'feather', fly: 1, wing: { type: 'feather', len: 2.6, n: 12, fw: .28, armC: 0xe8e8f0, c1: 0xffffff, c2: 0xe4e4f4, em: 0x3a3a50 } } });
Object.assign(MS2['Arcane Unicorn'], { fly: 1, wing: { type: 'feather', len: 1.9, n: 11, fw: .2, armC: 0xe8d8ff, c1: 0xf6eaff, c2: 0xc8a0ff, em: 0x4a2a7a } });
function mhSwan(g, root, d, s, mats, refs) {
    const M = MH, wh = mats.coat, by = 1.5, org = M.mat(0xf08a1a, { emissive: 0x3a1a04 });
    M.sph(1, root, 0, by, 0, wh, .55, .5, 1.25);
    M.sph(.5, root, 0, by + .12, .85, wh, 1, 1, 1);
    M.sph(.42, root, 0, by + .05, -.8, wh, 1.1, .9, 1);
    for (let i = -2; i <= 2; i++) {
        const f = M.box(.2, .03, 1.0, root, 0, by + .22, -1.45, wh);
        f.position.set(Math.sin(i * .2) * 1.0 * .5, by + .24, -1.15 - Math.cos(i * .2) * .5);
        f.rotation.y = i * .2;
    }
    const nk = M.chain(root, 0, by + .35, .95, 6, .34, .2, .1, [.9, -.35, -.45, -.4, .25, .1], wh);
    refs.neck = nk.segs;
    const hdr = new THREE.Group(), hd = new THREE.Group();
    hdr.rotation.x = 1.5;
    nk.end.add(hdr);
    hd.scale.setScalar(1.0);
    hdr.add(hd);
    refs.head = hdr;
    refs.head0 = 1.5;
    M.sph(.14, hd, 0, .04, 0, wh, 1, 1.15, 1);
    M.cone(.075, .34, hd, 0, .27, .03, org, .12);
    M.sph(.055, hd, 0, .14, .0, M.mat(0x181010));
    [-1, 1].forEach(sd => { M.sph(.075, hd, sd * .1, .12, -.04, M.mat(0x181010), 1, 1, .8); M.sph(.03, hd, sd * .12, .13, -.06, M.bas(0xffffff)); });
    const legs = [];
    [-1, 1].forEach(sd => legs.push(M.leg(root, sd * .26, by - .3, .1, { u: .32, l: .32, r1: .07, r2: .05, r3: .04, mat: org, foot: 'talon', cmat: org, hip: -.8, knee: 1.5 })));
    refs.legs = legs;
    const tl = M.chain(root, 0, by + .2, -1.2, 2, .3, .05, .03, [-2.0, .2], wh);
    refs.tail = tl.segs;
    const top = by + .52;
    M.box(.8, .05, 1.0, root, 0, top, .0, M.mat(0xf2f0ff));
    M.box(.44, .1, .56, root, 0, top + .07, 0, M.mat(0x5a2a1a));
    M.box(.3, .16, .1, root, 0, top + .14, .26, M.mat(0x5a2a1a));
    M.box(.3, .2, .1, root, 0, top + .16, -.3, M.mat(0x5a2a1a));
    refs.saddleTop = top + .12;
    refs.by = by;
}
function mhWings(g, root, s, refs) {
    if (!s.wing)
        return;
    const w = s.wing, sh = s.fam == 'horse' ? { x: .4, y: 2.35, z: .35 } : s.fam == 'swan' ? { x: .4, y: refs.by + .3, z: .15 } : { x: .35, y: (refs.by || 1.8) + (s.ry || .5) * .8, z: (s.L || 1) * .3 };
    refs.wings = [-1, 1].map(sd => { const o = Object.assign({}, w, { x: sh.x, y: sh.y, z: sh.z }); return { piv: w.type == 'bat' ? MH.batWing(root, sd, o) : MH.featherWing(root, sd, o), sd, rise: w.type == 'bat' ? .15 : .1 }; });
}
function mountMesh2(d) {
    const s = MS2[d.n] || MS2['Brown Horse'], g = new THREE.Group(), root = new THREE.Group(), refs = { t: 0 };
    g.add(root);
    const coat = new THREE.MeshLambertMaterial({ map: mtex(s.t, d.col), emissive: d.cls ? d.col : 0, emissiveIntensity: .2 });
    const mats = { coat, mane: MH.mat(s.mane != null ? s.mane : d.col, s.flame ? { emissive: 0x551a05 } : {}), eye: MH.mat(s.eye || 0x1a1008, s.eye ? { emissive: s.eye } : {}) };
    if (s.fea)
        mats.fea = new THREE.MeshLambertMaterial({ map: mtex('feather', s.fea) });
    if (s.fam == 'horse')
        mhHorse(g, root, d, s, mats, refs);
    else if (s.fam == 'swan')
        mhSwan(g, root, d, s, mats, refs);
    else
        mhQuad(g, root, d, s, mats, refs);
    mhWings(g, root, s, refs);
    g.root = root;
    g.legs = refs.legs;
    g.tl = refs.tail[0];
    g.ride = s.ride || (refs.saddleTop - .9);
    g.refs = refs;
    refs.fly = !!s.fly;
    g.anim = function (t, mv, jump) { mhAnim(g, refs, t, mv, jump); };
    return g;
}
function mhAnim(g, r, t, mv, jump) {
    const ph = t * 11, A = mv ? 1 : 0;
    r.legs.forEach((h, i) => {
        const front = i < 2, p = ph + (i == 0 || i == 3 ? 0 : Math.PI), u = h.userData;
        if (r.fly) {
            h.rotation.x = u.hip0 + Math.sin(t * 2 + i) * .05;
            u.kn.rotation.x = u.knee0;
        }
        else if (jump) {
            h.rotation.x = u.hip0 + (front ? -.9 : .7);
            u.kn.rotation.x = u.knee0 + (front ? .9 : -.2);
        }
        else {
            h.rotation.x = u.hip0 + Math.sin(p) * (front ? .55 : .5) * A;
            u.kn.rotation.x = u.knee0 + Math.max(0, Math.sin(p + 1.4)) * (front ? -.8 : .9) * A;
        }
    });
    g.root.position.y = r.fly ? Math.sin(t * (mv ? 5 : 3)) * (mv ? .12 : .08) : jump ? .1 : mv ? Math.abs(Math.sin(ph)) * .07 : Math.sin(t * 1.6) * .012;
    g.root.rotation.x = mv && !r.fly ? Math.sin(ph * 2) * .015 : r.fly && mv ? -.06 : 0;
    r.neck.forEach((sg, i) => { sg.rotation.x = sg.userData.a0 + Math.sin((r.fly ? t * 5 : ph * 2) + i * .6) * (mv ? .035 : .012); sg.rotation.z = Math.sin(t * .9 + i) * .02; });
    r.head.rotation.x = r.head0 + (mv ? Math.sin(ph * 2) * .05 : Math.sin(t * .8) * .03);
    r.tail.forEach((sg, i) => { sg.rotation.z = Math.sin(t * (mv ? 9 : 2.2) - i * .7) * (mv ? .2 : .12); if (i)
        sg.rotation.x = sg.userData.a0 + (mv ? -.2 : 0); });
    if (r.wings)
        r.wings.forEach(w => { const sp = mv ? 8 : 5, am = mv ? .6 : .38; w.piv.rotation.z = w.sd * (w.rise + Math.sin(t * sp) * am); w.piv.rotation.x = Math.sin(t * sp + 1) * .08; });
    if (r.flames)
        r.flames.forEach((f, i) => { f.scale.set(1, 1 + Math.sin(t * 16 + i * 1.3) * .3, 1); });
}

function mountMesh(d) { return mountMesh2(d); }
function MOUNTANIM(dt, t) {
    pvpTick(dt, t);
    wbTick(dt, t);
    zoneTick(dt, t);
    admTick(dt, t);
    saveTick(dt);
    chanTick(dt, t);
    warTick(dt, t);
    pitTick(dt, t);
    dgTick(dt, t);
    petTick(dt, t);
    lionTick(dt, t);
    admBossTick(dt, t);
    toyTick(dt, t);
    if (P.cast) {
        if (P.mv) {
            P.cast = null;
            say('Mount cancelled (you moved).');
        }
        else {
            P.cast.t -= dt;
            if (P.cast.t <= 0) {
                const i = P.cast.i;
                P.cast = null;
                doMount(i);
            }
        }
    }
    $('cb').style.display = P.cast ? 'block' : 'none';
    if (P.cast)
        $('cbi').style.width = (1 - P.cast.t / P.cast.max) * 100 + '%';
    const ty = P.mm ? P.mm.ride + (P.mount.fly ? 4 + Math.sin(t * 3) * .3 : 0) : 0;
    P.by = (P.by || 0) + (ty - (P.by || 0)) * Math.min(1, dt * 5);
    jcTick(dt, t);
    jcGround();
    const was = P.jy || 0;
    P.vy = (P.vy || 0) - 28 * dt * (P.bal > 0 && P.vy < 0 ? .25 : 1);
    P.jy = Math.max(0, was + P.vy * dt);
    if (P.jy === 0 && P.vy < 0)
        P.vy = 0;
    if (was > .05 && P.jy === 0)
        burst(new THREE.Vector3(P.pos.x, P.gl || 0, P.pos.z), P.onP ? 0xe8d8a8 : 0xc8b890, 7, .3, .1);
    P.pos.y = P.by + P.jy + (P.gl === undefined ? groundH(P.pos.x, P.pos.z) : P.gl);
    if (P.mm) {
        P.mm.anim(t, P.mv, P.jy > .05);
        P.mesh.legs[0].rotation.set(-.35, 0, -.5);
        P.mesh.legs[1].rotation.set(-.35, 0, .5);
    }
}
function startCast(i) { if (JR.on)
    return say('You cannot mount during the Jump Challenge.'); if (DG.on)
    return say('You cannot mount inside the dungeon.'); if (P.mount)
    dismount(); const d = ML()[i]; if (mobs.some(m => m.aggro && d3(m, P) < 45))
    return say('You cannot mount while in combat!'); P.cast = { i, t: 1.2, max: 1.2 }; say('Summoning ' + d.n + '...'); }
function mountToggle() { if (P.mount)
    return dismount(); if (P.cast) {
    P.cast = null;
    return say('Summon cancelled.');
} let i = P.sel; if (i === undefined)
    i = 0; startCast(i); }
function doMount(i) { if (P.stealth) stealthOff(); if (P.lion) lionToggle(); const d = ML()[i]; P.mount = d; P.mm = mountMesh(d); P.mm.position.y = -P.mm.ride; P.mesh.add(P.mm); P.sel = i; burst(P.pos, 0xffffff, 16, 1); say('Mounted: ' + d.n + ' (H to dismount, abilities disabled)'); }
function dismount() { if (!P || !P.mount)
    return; P.mesh.legs.forEach(l => l.rotation.set(0, 0, 0)); P.mesh.remove(P.mm); P.mm = null; P.mount = null; say('Dismounted.'); }
function toggleBook() { const b = $('mb'); b.style.display = b.style.display == 'flex' ? 'none' : 'flex'; renderBook(); }
function renderBookOld() { $('mb').innerHTML = '<b style="color:var(--gold)">Mounts</b> <small>click to summon · H mount/dismount · B close</small>' + MOUNTS.map((d, i) => { const ok = P.lvl >= d.lvl; return `<div onclick="pickMount(${i})" style="margin-top:6px;padding:6px;border:1px solid ${P.sel === i ? '#e8b84a' : '#555'};border-radius:5px;opacity:${ok ? 1 : .45};cursor:${ok ? 'pointer' : 'default'}">${d.e} <b>${d.n}</b> — speed ×${d.sp}${d.fly ? ' · flying (mobs ignore you)' : ''}<br><small>${ok ? 'Unlocked' : 'Unlocks at level ' + d.lvl}</small></div>`; }).join(''); }
function renderBook() { const L = ML(); $('mb').innerHTML = `<div class="mp" style="min-width:min(560px,92vw);text-align:center"><b style="color:var(--gold)">🐴 Mounts</b><span onclick="toggleBook()" style="float:right;cursor:pointer">✕</span><div style="margin:8px 0 12px;font-size:12px;opacity:.8">Click a mount to summon it · H mount/dismount · P or Esc to close</div><div style="display:grid;grid-template-columns:repeat(3,110px);gap:10px;justify-content:center">${L.map((d, i) => `<div class="sl" onclick="pickMount(${i})" style="cursor:pointer;width:110px;height:122px;background:radial-gradient(circle at 50% 35%,#${d.col.toString(16).padStart(6, '0')},#050505 85%);border-color:${P.sel === i ? '#fff' : d.cls ? '#e8b84a' : '#7a5a22'}"><i class="ic" style="font-size:46px;top:10px">${d.e}</i><span style="font-size:11px;bottom:38px">${d.n}</span><em style="bottom:22px;color:#fff">×${d.sp} speed</em><em style="color:#8cf">${d.fly ? 'Flying' : 'Ground'}${d.cls ? ' · ⭐ Class' : ''}</em></div>`).join('')}</div></div>`; }
function pickMount(i) { P.sel = i; $('mb').style.display = 'none'; startCast(i); }
function togglePause() { if (!running)
    return; if (GT)
    return cancelGround(); if (mapOpen)
    return toggleMap(); if ($('mb').style.display == 'flex')
    return toggleBook(); if ($('pv').style.display == 'flex')
    return togglePvP(); if ($('petw').style.display == 'flex') return togglePets(); if ($('toyw').style.display == 'flex') return toggleToys(); if ($('dgw').style.display == 'flex') return toggleDg(); if ($('adm').style.display == 'flex') return toggleAdm(); if ($('bp').style.display == 'block') return closeBP(); paused = !paused; clearKeys(); $('pause').style.display = paused ? 'flex' : 'none'; }
function toggleMap() { if (!running)
    return; if (DG.on)
    return say('The map is unavailable inside the dungeon.'); mapOpen = !mapOpen; $('map').style.display = mapOpen ? 'flex' : 'none'; if (mapOpen)
    drawMap(); }
function toMenu() {
    if (DG.on)
        leaveDungeon(true);
    pitReset();
    endChan();
    dismissMinions();
    cancelGround(true);
    saveHero();
    petClear();
    removePinata(true);
    gumEnd(true);
    admZones.forEach(z => S.remove(z.g));
    admZones = [];
    stealthOff(true);
    toyCleanup();
    jcReset();
    toyCD = {};
    wbClear();
    if (G.on)
        leaveMatch(1);
    running = false;
    paused = false;
    mapOpen = false;
    window.SP = 0;
    ['pause', 'map', 'mb', 'cb', 'adm', 'petw', 'toyw', 'toyb'].forEach(i => $(i).style.display = 'none');
    clearKeys();
    S.remove(P.mesh);
    mobs.forEach(m => S.remove(m.mesh));
    dying.forEach(o => S.remove(o.m));
    bolts.forEach(b => S.remove(b.b || b.ring));
    parts.forEach(p => S.remove(p.m));
    fx.forEach(o => o.el.remove());
    mobs = [];
    dying = [];
    bolts = [];
    parts = [];
    fx = [];
    ring.visible = false;
    showSelect();
}
function drawMap() {
    const c = $('mc'), g = c.getContext('2d'), W = c.width, K = W / (WORLD * 2), X = x => (x + WORLD) * K, Z = z => (z + WORLD) * K;
    if (!window.ZMAP) {
        const zc = document.createElement('canvas');
        zc.width = zc.height = 260;
        const zg = zc.getContext('2d'), im = zg.createImageData(260, 260);
        for (let py = 0; py < 260; py++)
            for (let px = 0; px < 260; px++) {
                const x = (px / 260 * 2 - 1) * WORLD, z = (py / 260 * 2 - 1) * WORLD, col = ZONES[zoneAt(x, z)].col, i = (py * 260 + px) * 4;
                im.data[i] = (col >> 16) & 255;
                im.data[i + 1] = (col >> 8) & 255;
                im.data[i + 2] = col & 255;
                im.data[i + 3] = 255;
            }
        zg.putImageData(im, 0, 0);
        window.ZMAP = zc;
    }
    g.imageSmoothingEnabled = false;
    g.drawImage(window.ZMAP, 0, 0, W, W);
    g.strokeStyle = 'rgba(255,255,255,.35)';
    g.beginPath();
    g.arc(X(0), Z(0), R0 * K, 0, 6.3);
    g.stroke();
    ZONES.forEach((ZN, i) => {
        const c = [[0, -62], [0, -300], [300, 0], [0, 300], [-300, 0]][i], t = ZN.e + ' ' + ZN.n;
        g.textAlign = 'center';
        g.fillStyle = '#fff';
        g.strokeStyle = '#000';
        g.lineWidth = 3;
        g.font = 'bold 13px Georgia';
        g.strokeText(t, X(c[0]), Z(c[1]));
        g.fillText(t, X(c[0]), Z(c[1]));
        g.font = '11px Georgia';
        g.strokeText('Lv ' + ZN.lv, X(c[0]), Z(c[1]) + 14);
        g.fillText('Lv ' + ZN.lv, X(c[0]), Z(c[1]) + 14);
    });
    g.textAlign = 'left';
    g.fillStyle = '#9a8a6a';
    g.beginPath();
    g.arc(X(0), Z(0), TOWN * K, 0, 6.3);
    g.fill();
    g.fillStyle = '#8a3a2a';
    [[-10, -9], [10, -9], [-11, 8], [11, 9]].forEach(([x, z]) => g.fillRect(X(x) - 4, Z(z) - 4, 8, 8));
    g.fillStyle = '#ff9933';
    g.beginPath();
    g.arc(X(-5), Z(0), 3, 0, 6.3);
    g.fill();
    g.fillStyle = '#ffdd33';
    g.font = 'bold 15px Georgia';
    g.fillText('!', X(0) - 3, Z(5) + 5);
    g.fillStyle = '#fff';
    g.font = '11px Georgia';
    g.fillText('Town', X(0) - 14, Z(0) + TOWN * K + 12);
    g.strokeStyle = '#ff4444';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(X(ARENA.x), Z(ARENA.z), ARENA.R * K, 0, 6.3);
    g.stroke();
    g.fillStyle = '#ff7a7a';
    g.font = 'bold 11px Georgia';
    g.fillText('⚔ The Pit (PvP)', X(ARENA.x) - 38, Z(ARENA.z) + 4);
    g.strokeStyle = '#7be04a';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(X(JC.x), Z(JC.z), 13 * K, 0, 6.3);
    g.stroke();
    g.fillStyle = '#9dff7a';
    g.fillText('🦘 Jump Challenge', X(JC.x) - 44, Z(JC.z) + 4);
    wbots.forEach(b => { if (b.dead) return; g.fillStyle = b.role == 'town' ? '#ffe48a' : '#4fc3ff'; g.beginPath(); g.arc(X(b.pos.x), Z(b.pos.z), 3.5, 0, 6.3); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); });
    mobs.forEach(m => { g.fillStyle = 'hsl(' + Math.max(0, 120 - m.lvl * 18) + ',80%,50%)'; g.fillRect(X(m.pos.x) - 2, Z(m.pos.z) - 2, 4, 4); });
    g.save();
    g.translate(X(P.pos.x), Z(P.pos.z));
    g.rotate(Math.PI - P.mesh.rotation.y);
    g.fillStyle = '#fff';
    g.strokeStyle = '#000';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -9);
    g.lineTo(6, 7);
    g.lineTo(-6, 7);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
}
const pg = new THREE.SphereGeometry(.12, 5, 4), pm = {};
function burst(pos, col, n, up, h) { pm[col] = pm[col] || new THREE.MeshBasicMaterial({ color: col }); for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(pg, pm[col]);
    m.position.copy(pos);
    m.position.y += (h === undefined ? 1.2 : h);
    S.add(m);
    parts.push({ m, v: new THREE.Vector3(rnd(-3, 3), rnd(2, 6) * (up || 1), rnd(-3, 3)), t: rnd(.5, .9) });
} }
function ANIM(dt, t) {
    MOUNTANIM(dt, t);
    sun.position.set(P.pos.x + 50, 80, P.pos.z + 30);
    sun.target.position.copy(P.pos);
    npc.rotation.y = Math.atan2(P.pos.x - npc.position.x, P.pos.z - npc.position.z);
    fire.scale.set(1 + Math.sin(t * 20) * .1, 1 + Math.sin(t * 13) * .2, 1 + Math.cos(t * 17) * .1);
    fl.intensity = 1.1 + Math.sin(t * 25) * .25 + Math.random() * .2;
    if (Math.random() < .4)
        burst(new THREE.Vector3(-5, 1, 0), 0xff9933, 1, .6, 0);
    clouds.forEach(c => { c.position.x += dt * 1.5; if (c.position.x > WORLD + 80)
        c.position.x = -WORLD - 80; });
    mobs.slice().forEach(m => { if (m.dot) {
        m.dot.a = (m.dot.a || 0) + dt;
        if (m.dot.c && Math.random() < .25)
            burst(m.pos, m.dot.c, 1, .8);
        if (m.dot.a >= 1) {
            m.dot.a = 0;
            hit(m, m.dot.d);
            if (m.dot && m.dot.c)
                burst(m.pos, m.dot.c, 6, 1.4);
            if (m.dot && --m.dot.n <= 0)
                m.dot = null;
        }
    } });
    if (P.hot) {
        P.hot.a += dt;
        if (P.hot.a >= 1) {
            P.hot.a = 0;
            heal(.07);
            if (--P.hot.n <= 0)
                P.hot = null;
        }
    }
    if (P.shield > 0) {
        if (!P.sh) {
            P.sh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: .25 }));
            P.sh.position.y = 1.3;
            P.mesh.add(P.sh);
        }
    }
    else if (P.sh) {
        P.mesh.remove(P.sh);
        P.sh = null;
    }
    sway.forEach(l => { l.rotation.z = Math.sin(t * 1.3 + l.userData.ph) * .04; });
    dying = dying.filter(o => { o.t += dt; o.m.scale.setScalar(Math.max(.01, 1 - o.t * 1.6)); o.m.rotation.z = o.t * 2.2; o.m.position.y = (o.y0 || 0) - o.t * .5; if (o.t > .6) {
        S.remove(o.m);
        return false;
    } return true; });
    parts = parts.filter(p => { p.t -= dt; p.v.y -= 12 * dt; p.m.position.addScaledVector(p.v, dt); p.m.scale.setScalar(Math.max(.01, p.t * 1.5)); if (p.t <= 0) {
        S.remove(p.m);
        return false;
    } return true; });
}
function start(c, spec) {
    window.SP = 1;
    paused = false;
    $('menu').style.display = 'none';
    $('spec').style.display = 'none';
    $('cs').style.display = 'none';
    $('dlg').style.display = 'none';
    csOn = false;
    if (stage)
        stage.visible = false;
    setMenuMode(false);
    const k = CL[c];
    P = { cls: c, cfg: k, hp: k.hp, max: k.hp, mp: k.mp, mmax: k.mp, lvl: 1, xp: 0, gold: 0, gear: 0, t: null, cds: [0, 0, 0, 0, 0], sw: 0 };
    if (SPECS[c])
        P.spec = spec || (CUR && CUR.sp) || SPECS[c][1][0];
    P.cfg = cfgOf(P);
    P.max = P.hp = maxHP(1);
    P.mesh = hero(k.col, c, CUR && CUR.id);
    applySpec(P.mesh, P.spec);
    S.add(P.mesh);
    P.mesh.traverse(o => { if (o.isMesh)
        o.castShadow = true; });
    P.pos = P.mesh.position;
    P.pos.set(0, 0, -3);
    for (let i = 0; i < 260; i++)
        spawn();
    wbInit();
    zoneNow = 0;
    zoneSeen = new Set([0]);
    Q = { need: 5, have: 0, on: false, done: 0 };
    loadHero();
    petClear();
    if (CUR && CUR.pet !== null && CUR.pet !== undefined)
        summonPet(CUR.pet, true);
    buildHB();
    say('Welcome, hero! Speak to the Elder (the golden gem) in town.');
    running = true;
    last = performance.now();
    if (!window.LP) {
        window.LP = 1;
        requestAnimationFrame(loop);
    }
}
function useAbil(i) {
    const a = P.cfg.ab[i];
    if (!a)
        return;
    if (GT && GT.i !== i)
        cancelGround(true);
    if (P.dead || G.cd > 0 || (DU && DU.cd > 0))
        return;
    if (P.mount)
        return say('Dismount first (H).');
    if (P.cds[i] > 0 || P.mp < a.cost)
        return;
    if (a.need) {
        if (!P.t)
            tab();
        if (!P.t)
            return say('No target nearby.');
        if (d3(P.t, P) > a.range)
            return say('Out of range.');
    }
    if (a.ground) {
        if (GT && GT.i === i)
            return cancelGround();
        return beginGround(i);
    }
    if (a.still && P.mv)
        return say('Stand still to channel.');
    endChan();
    P.mp -= a.cost;
    P.cds[i] = a.cd;
    P.sw = .3;
    if (P.t)
        P.mesh.rotation.y = Math.atan2(P.t.pos.x - P.pos.x, P.t.pos.z - P.pos.z);
    if (P.stealth && !a.stealth) {
        stealthOff(true);
        P.amb = 1;
        float(P.pos, 'Ambush!', '#c9b0ff');
    }
    a.f();
}
function tab() { let b = null, bd = 35; mobs.forEach(m => { const d = d3(m, P); if (d < bd && m !== P.t && m.adm != 'friendly') {
    bd = d;
    b = m;
} }); P.t = b; }
const KN = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright' };
const clearKeys = () => { for (const k in keys)
    keys[k] = 0; };
addEventListener('keydown', e => { if (e.target && (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') && e.target.id == 'admc') return; const n = KN[e.code]; if (n) {
    keys[n] = 1;
    if (n.startsWith('arrow'))
        e.preventDefault();
} if (e.code == 'Space' && !(e.target && e.target.tagName == 'INPUT'))
    e.preventDefault(); if (csOn && csKey(e))
    return; if (!running || e.repeat)
    return; if (e.code == 'KeyM') {
    toggleMap();
    return;
} if (e.code == 'Escape') {
    togglePause();
    return;
} if (paused)
    return; if (e.code == 'Space') {
    jump();
    return;
} if (e.code == 'KeyH') {
    mountToggle();
    return;
} if (e.code == 'KeyB' || e.code == 'KeyP') {
    toggleBook();
    return;
} if (e.code == 'KeyF') {
    nearBot();
    return;
} if (e.code == 'KeyR') {
    toggleAdm();
    return;
} if (e.code == 'KeyJ') {
    toggleDg();
    return;
} if (e.code == 'KeyO') {
    togglePvP();
    return;
} if (e.code == 'KeyK') {
    togglePets();
    return;
} if (e.code == 'KeyT') {
    toggleToys();
    return;
} const dg = e.code.startsWith('Digit') ? +e.code.slice(5) : e.code.startsWith('Numpad') ? +e.code.slice(6) || 0 : 0; if (dg >= 1 && dg <= P.cfg.ab.length)
    useAbil(dg - 1); if (e.key == 'Tab') {
    e.preventDefault();
    tab();
} });
addEventListener('keyup', e => { const n = KN[e.code]; if (n)
    keys[n] = 0; });
addEventListener('blur', clearKeys);
addEventListener('visibilitychange', clearKeys);
document.addEventListener('mouseleave', clearKeys);
let drag = false, moved = 0;
const el = R.domElement;
el.oncontextmenu = e => e.preventDefault();
el.onmousedown = e => {
    // Right mouse button is camera-look only; never treat it as a movement command.
    if (e.button === 2) { e.preventDefault(); drag = true; moved = 0; return; }
    if (e.button === 0) { drag = true; moved = 0; }
};
addEventListener('mouseup', e => { if (e.button === 0 || e.button === 2) drag = false; });
addEventListener('pointerup', () => { drag = false; });
addEventListener('mousemove', e => { if (drag && running) {
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (moved > 4) {
        yaw -= e.movementX * .006;
        pit = Math.max(.05, Math.min(1.3, pit + e.movementY * .005));
    }
} });
el.addEventListener('wheel', e => { zoom = Math.max(5, Math.min(30, zoom + e.deltaY * .01)); });
el.onclick = e => {
    if (e.button !== 0) return;
    if (!running) {
        csClick(e);
        return;
    }
    if (moved > 4)
        return;
    if (GT) {
        confirmGround();
        return;
    }
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
    if (PIN && ray.intersectObject(PIN.body, true).length)
        return hitPinata();
    const hits = ray.intersectObjects([npc, ...mobs.map(m => m.mesh), ...wbots.filter(b => !b.dead).map(b => b.mesh), ...(P.spec && !P.dead ? [P.mesh] : [])], true);
    if (!hits.length)
        return;
    let o = hits[0].object;
    while (o.parent && o.parent !== S)
        o = o.parent;
    if (P.spec && o === P.mesh)
        return showSpecPanel();
    const wbx = wbots.find(b => b.mesh === o);
    if (wbx)
        return selBot(wbx);
    if (o === npc) {
        if (d3(npc, P) > 9)
            return say('Move closer to the Elder.');
        if (Q.on)
            return say(`Elder: Slay ${Q.need - Q.have} more beasts.`);
        Q.need = 5 + Q.done * 3;
        Q.have = 0;
        Q.on = true;
        return say(`<span style="color:#fc6">Elder: Slay ${Q.need} beasts beyond the town!</span>`);
    }
    P.t = mobs.find(m => m.mesh === o) || P.t;
};
const proj = v => { const p = v.clone().project(cam); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, b: p.z > 1 }; };
let last = 0;
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (running && !paused)
    update(dt, now / 1000);
else if (!running)
    menuTick(dt, now / 1000); if (mapOpen && running)
    drawMap(); R.render(S, cam); requestAnimationFrame(loop); }
function update(dt, t) {
    const f = fwd(), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), v = new THREE.Vector3();
    if (keys.w || keys.arrowup)
        v.add(f);
    if (keys.s || keys.arrowdown)
        v.sub(f);
    if (keys.d || keys.arrowright)
        v.add(r);
    if (keys.a || keys.arrowleft)
        v.sub(r);
    const frozen = G.cd > 0 || (DU && DU.cd > 0), mv = v.lengthSq() > 0 && !P.dead && !frozen;
    if (mv) {
        v.normalize();
        P.pos.addScaledVector(v, 9 * dt * (P.lion ? 1.3 : 1) * (P.mount ? P.mount.sp : 1) * (ADM.speed ? 2.5 : 1) * (P.sprint > 0 ? 1.7 : 1) * (P.slowT > 0 ? .5 : 1) * (P.gum > 0 ? 1.15 : 1));
        P.mesh.rotation.y = Math.atan2(v.x, v.z);
    }
    if (G.on) {
        // During the BG countdown, keep the player inside their starting castle.
        if (G.mode == 'bg' && G.cd > 0) {
            const leftX = G.c.x - 80, half = BG_CASTLE_HALF - 2, depth = BG_CASTLE_DEPTH - 2;
            P.pos.x = Math.max(leftX - half, Math.min(leftX + half, P.pos.x));
            P.pos.z = Math.max(G.c.z - depth, Math.min(G.c.z + depth, P.pos.z));
        }
        const dx = P.pos.x - G.c.x, dz = P.pos.z - G.c.z, l = Math.hypot(dx, dz);
        if (l > G.r - 1.5) {
            P.pos.x = G.c.x + dx / l * (G.r - 1.5);
            P.pos.z = G.c.z + dz / l * (G.r - 1.5);
        }
    }
    else if (DG.on) {
        dgClamp();
    }
    else {
        P.pos.x = Math.max(-WORLD, Math.min(WORLD, P.pos.x));
        P.pos.z = Math.max(-WORLD, Math.min(WORLD, P.pos.z));
    }
    {
        P.mv = mv;
        const sw = mv && !P.mount ? Math.sin(t * 12) * .8 : 0, m0 = P.mesh, hb = mv ? Math.abs(Math.sin(t * 12)) * .1 : 0;
        m0.children[0].position.y = 1.1 + hb + (mv ? 0 : Math.sin(t * 2) * .02);
        m0.children[1].position.y = 2.2 + hb + (mv ? 0 : Math.sin(t * 2) * .03);
        m0.legs[0].rotation.x = sw;
        m0.legs[1].rotation.x = -sw;
        m0.arm.rotation.x = -sw * .8;
        if (P.jy > .05) {
            m0.legs[0].rotation.x = -.6;
            m0.legs[1].rotation.x = .3;
            m0.arm.rotation.x = -2.4;
        }
    }
    P.sw = Math.max(0, P.sw - dt);
    heroSwing(P.mesh, P.sw);
    P.cds = P.cds.map(c => Math.max(0, (c || 0) - dt));
    // Summoner auto-attack: small shadow bolt every 1.8s at an in-combat target within 28 range
    P.aa = Math.max(0, (P.aa || 0) - dt);
    if (P.cls == 'warlock' && P.spec == 'summon' && P.aa <= 0 && !P.dead && !P.mount && P.t && mobs.indexOf(P.t) >= 0 && P.t.hp > 0 && (P.t.aggro || G.on || DU) && d3(P.t, P) <= 28 && !(G.cd > 0 || (DU && DU.cd > 0))) {
        P.aa = 1.8;
        shot(0x66e0ff, dmg(.55), null, .2);
    }
    P.mp = Math.min(P.mmax, P.mp + P.cfg.regen * dt);
    const town = Math.hypot(P.pos.x, P.pos.z) < TOWN;
    if (town)
        P.hp = Math.min(P.max, P.hp + 9 * dt);
    ANIM(dt, t);
    mark.rotation.y = t * 2;
    mark.position.y = 3.4 + Math.sin(t * 3) * .15;
    mark.visible = true;
    mark.material.color.set(Q.on ? 0x66ccff : 0xffdd33);
    mobs.forEach(m => {
        if (m.wb || m.adm)
            return;
        if (!m.bot && m.stun > 0) {
            m.stun -= dt;
            m.mv = 0;
            return;
        }
        if (m.bot) {
            botAI(m, dt, t);
            return;
        }
        const d = d3(m, P);
        m.slow = Math.max(0, m.slow - dt);
        m.cd -= dt;
        m.mv = 0;
        m.lunge = Math.max(0, (m.lunge || 0) - dt);
        const show = m === P.t || m.aggro;
        m.mesh.bar.forEach(b => { b.visible = show; b.quaternion.copy(cam.quaternion); });
        m.mesh.bar[1].scale.x = Math.max(.001, m.hp / m.max);
        const go = (tx, tz, sp) => { m.mv = 1; const dx = tx - m.pos.x, dz = tz - m.pos.z, l = Math.hypot(dx, dz) || 1; m.pos.x += dx / l * sp * dt; m.pos.z += dz / l * sp * dt; m.mesh.rotation.y = Math.atan2(dx, dz); };
        if (m.bt && (m.bt.dead || d3(m, m.bt) > 40))
            m.bt = null;
        if (m.bt && !(m.aggro && d < 25)) {
            const bd = d3(m, m.bt);
            if (bd > 2.6)
                go(m.bt.pos.x, m.bt.pos.z, (5 + m.lvl * .35) * (m.slow > 0 ? .4 : 1));
            else {
                m.mesh.rotation.y = Math.atan2(m.bt.pos.x - m.pos.x, m.bt.pos.z - m.pos.z);
                if (m.cd <= 0) {
                    m.cd = 1.1;
                    m.lunge = .25;
                    (m.bt.mn ? mnHurt : wbHurt)(m.bt, Math.max(1, Math.round(2 + m.lvl * 2.2 - (m.bt.lvl || 1) * .4)));
                }
            }
        }
        else if (!town && !ADM.ignore && !P.stealth && ((d < 17 && !(P.mount && P.mount.fly)) || m.aggro) && d < 55) {
            if (d > (m.rng || 2.6))
                go(P.pos.x, P.pos.z, (5 + m.lvl * .35) * (m.slow > 0 ? .4 : 1) * (m.spd || 1));
            else {
                m.mesh.rotation.y = Math.atan2(P.pos.x - m.pos.x, P.pos.z - m.pos.z);
                if (m.cd <= 0 && !(P.mount && P.mount.fly)) {
                    m.cd = m.acd || 1.1;
                    m.lunge = .25;
                    let dm = Math.max(1, Math.round(2 + m.lvl * 2.2 - P.lvl * .4));
                    dm = Math.max(1, Math.round(dm * (m.dm || 1) * specT()));
                    if (P.shield > 0) {
                        const a = Math.min(P.shield, dm);
                        P.shield -= a;
                        dm -= a;
                    }
                    P.hp -= dm;
                    float(P.pos, dm ? '-' + dm : 'absorbed', dm ? '#f55' : '#8cf');
                    if (ADM.thorns)
                        thornsQ.push(m);
                    if (dm > 0) {
                        P.cast = null;
                        if (P.mount)
                            dismount();
                    }
                }
            }
        }
        else {
            m.aggro = false;
            if (Math.hypot(m.hx - m.pos.x, m.hz - m.pos.z) > .5)
                go(m.hx, m.hz, 4);
        }
        m.pos.y = groundH(m.pos.x, m.pos.z) + (m.mv ? Math.abs(Math.sin(t * 10 + m.hx)) * .3 : 0);
        m.mesh.scale.setScalar(1 + m.lunge * .8);
    });
    bolts = bolts.filter(b => {
        if (b.ring) {
            b.t += dt * 2.5;
            b.ring.scale.setScalar(1 + b.t * 11);
            b.ring.material.opacity = 1 - b.t;
            if (b.t >= 1) {
                S.remove(b.ring);
                return false;
            }
            return true;
        }
        if (!b.m || b.m.dead || (b.m !== P && !b.m.ally && !b.m.mn && mobs.indexOf(b.m) < 0)) {
            S.remove(b.b);
            return false;
        }
        const tp = b.m.pos.clone().setY(1.2), dv = tp.clone().sub(b.b.position), l = dv.length();
        if (l < 1) {
            if (b.wbBy)
                wbHitMob(b.m, b.d, b.wbBy);
            else if (b.m === P || b.m.ally || b.m.mn || (b.m.wb && b.src))
                foeHit(b.m, b.d, b.src);
            else
                hit(b.m, b.d);
            if (b.fn)
                b.fn(b.m);
            S.remove(b.b);
            return false;
        }
        b.b.position.addScaledVector(dv.normalize(), Math.min(l, 40 * dt));
        burst(b.b.position, b.c || 0xff6600, 1, .1, 0);
        return true;
    });
    if (DU && P.hp <= 0) {
        P.hp = 1;
        duelEnd(false);
    }
    if (P.hp <= 0 && G.on)
        pvpPlayerDown();
    else if (P.hp <= 0) {
        if (DG.on)
            leaveDungeon(true);
        dismount();
        P.cast = null;
        say('<span style="color:#f66">You died! Respawning in town...</span>');
        P.hp = P.max;
        P.pos.set(0, 0, -3);
        P.gold = Math.floor(P.gold * .8);
        P.t = null;
        mobs.forEach(m => m.aggro = false);
    }
    // camera
    const cp = Math.cos(pit);
    let cx = P.pos.x + Math.sin(yaw) * cp * zoom, cy = P.pos.y + 2 + Math.sin(pit) * zoom, cz = P.pos.z + Math.cos(yaw) * cp * zoom;
    const blk = G.on ? camBlock : DG.on ? dgBlock : [];
    if (blk.length) {
        // pull the camera in front of any wall between it and the player
        const o = new THREE.Vector3(P.pos.x, P.pos.y + 2, P.pos.z), dv = new THREE.Vector3(cx - o.x, cy - o.y, cz - o.z), len = dv.length() || 1;
        camRay.set(o, dv.normalize());
        camRay.far = len;
        const vis = n => { while (n) {
            if (!n.visible)
                return false;
            n = n.parent;
        } return true; };
        const h = camRay.intersectObjects(blk, false).find(x => vis(x.object));
        if (h) {
            const k = Math.max(2.2, h.distance - .8) / len;
            cx = o.x + (cx - o.x) * k;
            cy = o.y + (cy - o.y) * k;
            cz = o.z + (cz - o.z) * k;
        }
    }
    cam.position.set(cx, Math.max(.6, cy), cz);
    cam.lookAt(P.pos.x, P.pos.y + 2, P.pos.z);
    if (P.t) {
        ring.visible = true;
        ring.position.set(P.t.pos.x, .25, P.t.pos.z);
    }
    else
        ring.visible = false;
    fx = fx.filter(o => { o.t -= dt; o.p.y += dt * 1.6; const s = proj(o.p); o.el.style.left = s.x + 'px'; o.el.style.top = s.y + 'px'; o.el.style.opacity = s.b ? 0 : Math.min(1, o.t * 2); if (o.t <= 0) {
        o.el.remove();
        return false;
    } return true; });
    hud();
}
function hud() {
    const pc = (v, m) => Math.max(0, v / m * 100) + '%';
    $('pf').innerHTML = `<b>${esc(P.name || P.cls)}</b> <small>${CNAME(P.cls)}${P.lion ? ' · 🦁 lion' : P.spec ? ' · ' + P.spec : ''}</small> Lv ${P.lvl} &nbsp; ★${P.gear} &nbsp; <span style="color:var(--gold)">${P.gold}g</span><div class="bar"><i style="background:#c33;width:${pc(P.hp, P.max)}"></i></div><div class="bar" style="height:10px"><i style="background:#38c;width:${pc(P.mp, P.mmax)}"></i></div><div class="bar" style="height:6px"><i style="background:#a5c;width:${pc(P.xp, xpN())}"></i></div>`;
    const tf = $('tf');
    if (P.t) {
        tf.style.display = 'block';
        tf.innerHTML = `${P.t.name || MOBS[P.t.ty][0]} — Lv ${P.t.lvl}<div class="bar"><i style="background:#d33;width:${pc(P.t.hp, P.t.max)}"></i></div>`;
    }
    else
        tf.style.display = 'none';
    $('qt').innerHTML = `<b style="color:var(--gold)">Quest</b><br>${Q.on ? `Slay beasts: ${Q.have}/${Q.need}` : 'None — talk to the Elder'}<br><small>${Math.hypot(P.pos.x, P.pos.z) < TOWN ? 'Safe zone' : (G.on ? 'Arena' : DG.on ? '🏰 ' + DG.name : ZONES[zoneAt(P.pos.x, P.pos.z)].e + ' ' + ZONES[zoneAt(P.pos.x, P.pos.z)].n + (P.pit ? ' · ⚔ PvP' : ''))}</small>`;
    [...$('hb').children].forEach((s, i) => { const u = s.querySelector('u'), a = P.cfg.ab[i]; u.style.height = P.cds[i] > 0 ? (P.cds[i] / a.cd * 100) + '%' : '0'; u.textContent = P.cds[i] > 0 ? P.cds[i].toFixed(1) : ''; s.style.borderColor = a.stealth && P.stealth ? '#fff' : P.mp >= a.cost ? '#e8b84a' : '#555'; s.style.boxShadow = a.stealth && P.stealth ? '0 0 12px #b08aff' : ''; });
    const c = $('mm').getContext('2d'), k = .9;
    c.clearRect(0, 0, 120, 120);
    c.fillStyle = ZONES[G.on ? 0 : zoneAt(P.pos.x, P.pos.z)].mm;
    c.fillRect(0, 0, 120, 120);
    const X = x => 60 + (x - P.pos.x) * k, Z = z => 60 + (z - P.pos.z) * k;
    c.fillStyle = '#9a8a6a';
    c.beginPath();
    c.arc(X(0), Z(0), TOWN * k, 0, 6.3);
    c.fill();
    c.fillStyle = '#fd3';
    c.fillRect(X(0) - 2, Z(5) - 2, 4, 4);
    c.fillStyle = '#f44';
    mobs.forEach(m => { const x = X(m.pos.x), z = Z(m.pos.z); if (x > 0 && x < 120 && z > 0 && z < 120)
        c.fillRect(x - 1.5, z - 1.5, 3, 3); });
    c.fillStyle = '#4fc3ff';
    wbots.forEach(b => { if (b.dead) return; const x = X(b.pos.x), z = Z(b.pos.z); if (x > 0 && x < 120 && z > 0 && z < 120)
        c.fillRect(x - 2, z - 2, 4, 4); });
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(60, 60, 3.5, 0, 6.3);
    c.fill();
}

// ===== Pets: small companions that follow you and nip at enemies you fight =====
const PETS = [
    { n: 'Bear Cub', e: '🐻', lvl: 1, col: 0x6b4423, col2: 0xc49a6c, ear: 'round', tail: 'stub', s: .8, pw: 1, d: 'A clumsy little cub. Loves honey and fights.' },
    { n: 'Fox Kit', e: '🦊', lvl: 3, col: 0xd9661e, col2: 0xffffff, ear: 'point', tail: 'bushy', long: 1, s: .7, pw: 1, d: 'Quick and sly, always one step behind you.' },
    { n: 'Snow Cub', e: '🐻‍❄️', lvl: 5, col: 0xf2f2ee, col2: 0xd8d4c8, ear: 'round', tail: 'stub', s: .85, pw: 1.15, d: 'A polar cub from Frostpeak Tundra.' },
    { n: 'Baby Owl', e: '🦉', lvl: 7, col: 0x8a6a44, col2: 0xe8d8b0, ear: 'tuft', beak: 1, wings: 1, fly: 1, s: .65, pw: 1.1, d: 'Hovers by your shoulder and swoops at foes.' },
    { n: 'Wolf Pup', e: '🐺', lvl: 10, col: 0x6e7278, col2: 0xcfcfcf, ear: 'point', tail: 'bushy', long: 1, s: .85, pw: 1.3, d: 'Fierce for its size. Bites hard.' },
    { n: 'Ember Whelp', e: '🐉', lvl: 14, col: 0xc0301a, col2: 0xffb347, ear: 'horn', tail: 'long', long: 1, wings: 1, fly: 1, s: .75, pw: 1.5, d: 'A baby dragon. Its bite burns.' }
];
let PET = null;
function petMesh(d) {
    const g = new THREE.Group(), body = new THREE.Group(), m = M(d.col), m2 = M(d.col2), k = new THREE.MeshBasicMaterial({ color: 0x111111 });
    g.add(body);
    add(new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), m), 0, .6, 0, body).scale.set(1, .9, 1.25);
    if (d.beak || d.col2 == 0xffffff)
        add(new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 8), m2), 0, .55, .22, body).scale.set(1, 1, .8);
    const head = new THREE.Group();
    head.position.set(0, 1.0, d.beak ? .15 : .45);
    body.add(head);
    add(new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 10), m), 0, 0, 0, head);
    if (d.beak) {
        add(new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), m2), 0, .02, .16, head).scale.set(1.2, 1, .5);
        add(new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 6), M(0xe8a020)), 0, -.06, .33, head).rotation.x = 1.9;
    }
    else {
        add(new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 8), m2), 0, -.07, .3, head).scale.set(1, .8, d.long ? 1.9 : 1.1);
        add(new THREE.Mesh(new THREE.SphereGeometry(.055, 6, 6), k), 0, -.03, d.long ? .58 : .46, head);
    }
    [-1, 1].forEach(sd => {
        add(new THREE.Mesh(new THREE.SphereGeometry(d.beak ? .07 : .05, 6, 6), d.beak ? new THREE.MeshBasicMaterial({ color: 0xffcc22 }) : k), sd * .13, .08, .29, head);
        if (d.ear == 'round')
            add(new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), m), sd * .23, .25, -.02, head);
        else if (d.ear == 'point')
            add(new THREE.Mesh(new THREE.ConeGeometry(.1, .28, 5), m), sd * .18, .32, 0, head).rotation.z = -sd * .25;
        else if (d.ear == 'tuft')
            add(new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 4), m), sd * .2, .3, 0, head).rotation.z = -sd * .5;
        else if (d.ear == 'horn')
            add(new THREE.Mesh(new THREE.ConeGeometry(.05, .26, 5), m2), sd * .15, .3, -.1, head).rotation.x = -.5;
    });
    g.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * .22, .38, sz * .28); add(new THREE.Mesh(new THREE.BoxGeometry(.15, d.fly ? .2 : .36, .15), d.beak ? M(0xe8a020) : m), 0, -.17, 0, l); body.add(l); return l; });
    if (d.tail == 'stub')
        g.tail = add(new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 6), m), 0, .65, -.55, body);
    else if (d.tail == 'bushy') {
        g.tail = new THREE.Group();
        g.tail.position.set(0, .7, -.5);
        body.add(g.tail);
        add(new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), m), 0, .12, -.25, g.tail).scale.set(1, 1, 2);
        add(new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 6), m2), 0, .2, -.55, g.tail);
    }
    else if (d.tail == 'long') {
        g.tail = new THREE.Group();
        g.tail.position.set(0, .6, -.5);
        body.add(g.tail);
        add(new THREE.Mesh(new THREE.ConeGeometry(.12, .8, 6), m), 0, 0, -.38, g.tail).rotation.x = -1.6;
    }
    if (d.wings)
        g.wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.set(sd * .35, .8, -.05); add(new THREE.Mesh(new THREE.BoxGeometry(.6, .04, .38), d.beak ? m : m2), sd * .3, 0, 0, w); body.add(w); return w; });
    g.head = head;
    g.body = body;
    g.scale.setScalar(d.s);
    g.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial)
        o.castShadow = true; });
    return g;
}
function petClear() { if (PET) {
    S.remove(PET.mesh);
    PET = null;
} }
function summonPet(i, quiet) {
    const d = PETS[i];
    if (!d)
        return;
    if (P.lvl < d.lvl && !quiet)
        return say('The ' + d.n + ' unlocks at level ' + d.lvl + '.');
    petClear();
    const g = petMesh(d), a = P.mesh.rotation.y;
    g.position.set(P.pos.x + Math.cos(a) * 1.6, 0, P.pos.z - Math.sin(a) * 1.6);
    S.add(g);
    PET = { i, d, mesh: g, pos: g.position, cd: 0, bite: 0 };
    burst(g.position, 0xffe48a, 12, 1);
    if (!quiet)
        say('<span style="color:#ffe48a">' + d.e + ' Your ' + d.n + ' is following you!</span>');
}
function dismissPet() { if (!PET)
    return; burst(PET.pos, 0xffe48a, 10, 1); say(PET.d.e + ' ' + PET.d.n + ' dismissed.'); petClear(); }
function petTarget() {
    if (P.dead || G.on || DU)
        return null;
    const m = P.t;
    return m && !m.wb && !m.bot && mobs.indexOf(m) >= 0 && m.hp > 0 && m.aggro && d3(m, P) < 25 ? m : null;
}
function petTick(dt, t) {
    if (!PET)
        return;
    const g = PET.mesh, d = PET.d, a = P.mesh.rotation.y, tg = petTarget();
    let gx = P.pos.x - Math.sin(a) * 1.4 + Math.cos(a) * 1.6, gz = P.pos.z - Math.cos(a) * 1.4 - Math.sin(a) * 1.6;
    if (tg) {
        const dx = PET.pos.x - tg.pos.x, dz = PET.pos.z - tg.pos.z, l = Math.hypot(dx, dz) || 1;
        gx = tg.pos.x + dx / l * 1.6;
        gz = tg.pos.z + dz / l * 1.6;
    }
    const dx = gx - PET.pos.x, dz = gz - PET.pos.z, dist = Math.hypot(dx, dz);
    if (d3(PET, P) > 45) {
        PET.pos.x = gx;
        PET.pos.z = gz;
    }
    const mv = dist > .35;
    if (mv) {
        const sp = Math.min(dist, Math.min(32, Math.max(6, dist * 3)) * dt);
        PET.pos.x += dx / dist * sp;
        PET.pos.z += dz / dist * sp;
        g.rotation.y = Math.atan2(dx, dz);
    }
    else {
        const f = tg || P, ty = Math.atan2(f.pos.x - PET.pos.x, f.pos.z - PET.pos.z);
        let df = ty - g.rotation.y;
        df = Math.atan2(Math.sin(df), Math.cos(df));
        g.rotation.y += df * Math.min(1, dt * 4);
    }
    const hop = mv && !d.fly ? Math.abs(Math.sin(t * 14)) * .15 : 0;
    PET.pos.y = groundH(PET.pos.x, PET.pos.z) + (d.fly ? 1.8 + Math.sin(t * 3) * .2 : 0) + hop;
    const sw = mv ? Math.sin(t * 14) * .7 : 0;
    g.legs.forEach((l, j) => l.rotation.x = (j == 0 || j == 3) ? sw : -sw);
    if (g.tail)
        g.tail.rotation.y = Math.sin(t * (mv ? 14 : 5)) * .35;
    if (g.wings)
        g.wings.forEach((w, j) => w.rotation.z = (j ? -1 : 1) * (Math.sin(t * (mv ? 16 : 9)) * .5 + .2));
    PET.bite = Math.max(0, PET.bite - dt);
    g.head.position.z = (d.beak ? .15 : .45) + (PET.bite > 0 ? Math.sin(PET.bite / .25 * PI) * .3 : 0);
    g.head.rotation.x = mv ? 0 : Math.sin(t * 2) * .06;
    PET.cd = Math.max(0, PET.cd - dt);
    if (tg && d3(PET, tg) < 2.6 && PET.cd <= 0) {
        PET.cd = 1.6;
        PET.bite = .25;
        hit(tg, Math.max(1, Math.round((2 + P.lvl * 1.2) * d.pw)));
    }
}
function togglePets() { if (!running)
    return; const p = $('petw'); p.style.display = p.style.display == 'flex' ? 'none' : 'flex'; renderPets(); }
function renderPets() {
    $('petw').innerHTML = `<div class="mp" style="min-width:min(600px,92vw);max-width:96vw;text-align:center"><b style="color:var(--gold)">🐾 Pets</b><span onclick="togglePets()" style="float:right;cursor:pointer">✕</span><div style="margin:8px 0 12px;font-size:12px;opacity:.8">Click a pet to summon it · click your active pet to dismiss it. Pets follow you and nip at enemies you're fighting. K or Esc to close.</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${PETS.map((d, i) => { const ok = P.lvl >= d.lvl, on = PET && PET.i === i; return `<div class="sl" onclick="pickPet(${i})" title="${d.d}" style="cursor:${ok ? 'pointer' : 'default'};opacity:${ok ? 1 : .45};width:100px;height:122px;background:radial-gradient(circle at 50% 35%,#${d.col.toString(16).padStart(6, '0')},#050505 85%);border-color:${on ? '#fff' : '#e8b84a'};${on ? 'box-shadow:0 0 12px #ffe48a' : ''}"><i class="ic" style="font-size:46px;top:10px">${d.e}</i><span style="font-size:11px;bottom:38px">${d.n}</span><em style="bottom:22px;color:#fff">${on ? '✔ Active' : ok ? 'Summon' : '🔒 Lv ' + d.lvl}</em><em style="color:#8cf">${d.fly ? 'Flying' : 'Ground'}</em></div>`; }).join('')}</div></div>`;
}
function pickPet(i) {
    if (P.lvl < PETS[i].lvl)
        return say('The ' + PETS[i].n + ' unlocks at level ' + PETS[i].lvl + '.');
    if (PET && PET.i === i)
        dismissPet();
    else
        summonPet(i);
    saveHero();
    renderPets();
}

// ===== Toys: fun items with cooldowns (Piñata, Bubble Gum, ...) =====
const TOYS = [
    { n: 'Piñata', e: '🪅', lvl: 1, cd: 30, col: 0xe8408a, d: 'Hangs a piñata in front of you. Click it to smash it open for candy and a little gold!', f: () => spawnPinata() },
    { n: 'Bubble Gum', e: '🫧', lvl: 1, cd: 10, col: 0xff8fc8, d: 'Chew for 5 minutes: blow bubbles, +15% move speed and higher jumps.', f: () => chewGum() },
    { n: 'Fireworks', e: '🎆', lvl: 1, cd: 15, col: 0x3a4aff, d: 'Launch a volley of colorful fireworks into the sky!', f: () => launchFireworks() },
    { n: 'Red Balloon', e: '🎈', lvl: 2, cd: 20, col: 0xe02a2a, d: 'Hold a balloon for 1 minute: you float down slowly and jump much higher.', f: () => holdBalloon() },
    { n: 'Snowman', e: '⛄', lvl: 3, cd: 30, col: 0xbfe6ff, d: 'Build a friendly snowman that waves at you for 1 minute.', f: () => buildSnowman() },
    { n: 'Campfire', e: '🔥', lvl: 4, cd: 60, col: 0xff7a1a, d: 'Light a campfire for 1 minute. Standing near it slowly restores health and mana.', f: () => lightCampfire() }
];
let PIN = null, toyCD = {};
const PIN_COLS = [0xe8408a, 0xffd23a, 0x3ac8ff, 0x7be04a, 0xff7a2a, 0xb05aff];
function spawnPinata() {
    if (DG.on || G.on || DU)
        return say('You cannot use the Piñata here.') || false;
    removePinata(true);
    const a = P.mesh.rotation.y, x = P.pos.x + Math.sin(a) * 4, z = P.pos.z + Math.cos(a) * 4, gy = groundH(x, z);
    const root = new THREE.Group(), wood = M(0x6b4a2a);
    root.position.set(x, gy, z);
    root.rotation.y = a + PI / 2;
    // a little wooden gallows to hang it from
    add(new THREE.Mesh(new THREE.BoxGeometry(.18, 4.2, .18), wood), -1.6, 2.1, 0, root);
    add(new THREE.Mesh(new THREE.BoxGeometry(.18, 4.2, .18), wood), 1.6, 2.1, 0, root);
    add(new THREE.Mesh(new THREE.BoxGeometry(3.6, .18, .18), wood), 0, 4.2, 0, root);
    const swing = new THREE.Group();
    swing.position.set(0, 4.1, 0);
    root.add(swing);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 4), M(0xeeeeee)), 0, -.5, 0, swing);
    // the piñata: a striped llama-ish critter
    const body = new THREE.Group();
    body.position.y = -1.9;
    swing.add(body);
    for (let i = 0; i < 6; i++)
        add(new THREE.Mesh(new THREE.BoxGeometry(.24, .7, .6), M(PIN_COLS[i])), -.6 + i * .24, 0, 0, body);
    const neck = new THREE.Group();
    neck.position.set(.62, .3, 0);
    body.add(neck);
    for (let i = 0; i < 4; i++)
        add(new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .3), M(PIN_COLS[(i + 2) % 6])), 0, i * .2, 0, neck);
    add(new THREE.Mesh(new THREE.BoxGeometry(.45, .3, .32), M(PIN_COLS[0])), .1, .9, 0, neck);
    [-1, 1].forEach(sd => {
        add(new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })), .2, .95, sd * .17, neck);
        add(new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 4), M(PIN_COLS[3])), -.05, 1.12, sd * .1, neck);
    });
    [[-.5, -.2], [-.5, .2], [.5, -.2], [.5, .2]].forEach(([lx, lz], i) => add(new THREE.Mesh(new THREE.BoxGeometry(.16, .45, .16), M(PIN_COLS[(i + 4) % 6])), lx, -.55, lz, body));
    // paper fringe
    for (let i = 0; i < 10; i++)
        add(new THREE.Mesh(new THREE.BoxGeometry(.12, .25, .02), M(PIN_COLS[i % 6])), -.65 + i * .14, -.35, .31, body).rotation.z = rnd(-.3, .3);
    root.traverse(o => { if (o.isMesh)
        o.castShadow = true; });
    // invisible, generous click box so the swinging piñata is easy to hit
    add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 1.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })), .1, .1, 0, body);
    S.add(root);
    PIN = { root, swing, body, hp: 6, max: 6, sv: 0, life: 120, pos: root.position };
    burst(new THREE.Vector3(x, gy + 2, z), 0xffd23a, 14, 1.2);
    say('🪅 A Piñata appears! Click it to whack it.');
}
function removePinata(quiet) { if (!PIN)
    return; S.remove(PIN.root); if (!quiet)
    say('The Piñata floats away...'); PIN = null; }
function hitPinata() {
    if (!PIN)
        return;
    if (d3(PIN, P) > 8)
        return say('Move closer to the Piñata.');
    P.sw = .3;
    P.mesh.rotation.y = Math.atan2(PIN.pos.x - P.pos.x, PIN.pos.z - P.pos.z);
    PIN.hp--;
    PIN.sv += 2.5 * (Math.random() < .5 ? -1 : 1);
    const wp = new THREE.Vector3();
    PIN.body.getWorldPosition(wp);
    burst(wp, PIN_COLS[(Math.random() * 6) | 0], 8, 1.2);
    float(wp, PIN.hp > 0 ? 'Whack!' : 'SMASH!', '#ffd23a');
    if (PIN.hp > 0)
        return;
    for (let i = 0; i < 6; i++)
        burst(wp, PIN_COLS[i], 10, 2.2);
    const g = 2 + ((Math.random() * Math.max(2, P.lvl)) | 0);
    P.gold += g;
    const candy = ['🍬', '🍭', '🍫', '🍡'][(Math.random() * 4) | 0];
    say('<span style="color:#ffd23a">🪅 The Piñata bursts! ' + candy + ' Candy everywhere! +' + g + ' gold</span>');
    S.remove(PIN.root);
    PIN = null;
}
function pinataTick(dt, t) {
    if (!PIN)
        return;
    PIN.life -= dt;
    if (PIN.life <= 0 || d3(PIN, P) > 60)
        return removePinata();
    PIN.sv *= Math.pow(.25, dt);
    PIN.swing.rotation.x = Math.sin(t * 6) * PIN.sv * .12 + Math.sin(t * 1.3) * .05;
    PIN.swing.rotation.z = Math.cos(t * 5) * PIN.sv * .05;
    const k = PIN.hp / PIN.max;
    PIN.body.scale.setScalar(.95 + .05 * k + (PIN.sv > .3 ? Math.sin(t * 30) * .03 : 0));
}
// ----- Bubble gum -----
const GUM_T = 300;
function chewGum() {
    P.gum = GUM_T;
    if (!P.gumB) {
        const g = new THREE.Group();
        g.position.set(0, 2.08, .38);
        const b = new THREE.Mesh(new THREE.SphereGeometry(.7, 16, 12), new THREE.MeshLambertMaterial({ color: 0xff8fc8, emissive: 0x401028, transparent: true, opacity: .85 }));
        b.position.z = .72;
        g.add(b);
        const shine = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 }));
        shine.position.set(-.28, .3, .45);
        b.add(shine);
        g.scale.setScalar(.01);
        P.mesh.add(g);
        P.gumB = { g, b, ph: 0, n: 0 };
    }
    say('<span style="color:#ff8fc8">🫧 Chomp chomp! Bubble Gum: +15% speed and higher jumps for 5 minutes.</span>');
}
function gumEnd(quiet) {
    if (!P)
        return;
    if (P.gumB) {
        P.mesh.remove(P.gumB.g);
        P.gumB = null;
    }
    if (P.gum > 0 && !quiet)
        say('Your Bubble Gum lost its flavor.');
    P.gum = 0;
}
function gumTick(dt, t) {
    if (!P.gum || P.gum <= 0)
        return;
    P.gum -= dt;
    if (P.gum <= 0) {
        P.gum = 1;
        return gumEnd();
    }
    const B = P.gumB;
    if (B) {
        // inflate for 3s, hold briefly, then either deflate back or POP
        B.ph += dt;
        const C = 4.2;
        if (B.ph >= C) {
            B.ph = 0;
            B.n++;
        }
        const pop = B.n % 3 == 2;
        let s;
        if (B.ph < 3)
            s = .08 + .92 * Math.pow(B.ph / 3, 1.6);
        else if (B.ph < 3.5)
            s = 1 + Math.sin((B.ph - 3) * 30) * .03;
        else if (pop) {
            if (!B.popped) {
                B.popped = 1;
                const wp = new THREE.Vector3();
                B.b.getWorldPosition(wp);
                burst(wp, 0xff8fc8, 12, .8);
                float(wp, 'pop!', '#ff8fc8');
            }
            s = .05;
        }
        else
            s = Math.max(.08, 1 - (B.ph - 3.5) / .7 * .92);
        if (B.ph < 3)
            B.popped = 0;
        B.g.scale.setScalar(Math.max(.01, s * .9));
    }
}
// ----- Toy box window -----
function toyTick(dt, t) {
    for (const k in toyCD)
        toyCD[k] = Math.max(0, toyCD[k] - dt);
    pinataTick(dt, t);
    gumTick(dt, t);
    fwTick(dt);
    balloonTick(dt, t);
    placedTick(dt, t);
    toyBuffUI();
    if ($('toyw').style.display == 'flex' && Math.floor(t * 2) !== toyTick.l) {
        toyTick.l = Math.floor(t * 2);
        renderToys();
    }
}
function toggleToys() { if (!running)
    return; const p = $('toyw'); p.style.display = p.style.display == 'flex' ? 'none' : 'flex'; renderToys(); }
function renderToys() {
    $('toyw').innerHTML = `<div class="mp" style="min-width:min(560px,92vw);max-width:96vw;text-align:center"><b style="color:var(--gold)">🎁 Toys</b><span onclick="toggleToys()" style="float:right;cursor:pointer">✕</span><div style="margin:8px 0 12px;font-size:12px;opacity:.8">Click a toy to use it. Toys are just for fun! T or Esc to close.</div><div style="display:grid;grid-template-columns:repeat(3,120px);gap:10px;justify-content:center">${TOYS.map((d, i) => { const ok = P.lvl >= d.lvl, cd = Math.ceil(toyCD[i] || 0); return `<div class="sl" onclick="useToy(${i})" title="${d.d}" style="cursor:${ok && !cd ? 'pointer' : 'default'};opacity:${ok ? 1 : .45};width:120px;height:132px;background:radial-gradient(circle at 50% 35%,#${d.col.toString(16).padStart(6, '0')},#050505 85%)"><i class="ic" style="font-size:46px;top:10px">${d.e}</i><span style="font-size:12px;bottom:40px">${d.n}</span><em style="bottom:22px;color:#fff;font-size:10px">${!ok ? '🔒 Lv ' + d.lvl : cd ? '⏳ ' + cd + 's' : 'Use'}</em><em style="color:#8cf;font-size:10px">${i == 1 && P.gum > 0 ? 'Chewing!' : i == 3 && P.bal > 0 ? 'Holding!' : 'Cooldown ' + d.cd + 's'}</em></div>`; }).join('')}</div><div style="margin-top:10px;font-size:12px;opacity:.75;text-align:left;max-width:400px;margin-left:auto;margin-right:auto">${TOYS.map(d => d.e + ' <b>' + d.n + '</b>: ' + d.d).join('<br>')}</div></div>`;
}
function useToy(i) {
    const d = TOYS[i];
    if (P.lvl < d.lvl)
        return say(d.n + ' unlocks at level ' + d.lvl + '.');
    if (toyCD[i] > 0)
        return say(d.n + ' is not ready yet (' + Math.ceil(toyCD[i]) + 's).');
    if (P.dead)
        return;
    if (d.f() === false)
        return;
    toyCD[i] = d.cd;
    $('toyw').style.display = 'none';
}
// ----- Toy buff timers (top-left) -----
function toyBuffUI() {
    const f = (e, n, v) => e + ' ' + n + ' ' + Math.floor(v / 60) + ':' + String(Math.floor(v % 60)).padStart(2, '0');
    const L = [];
    if (P.gum > 0)
        L.push('<span style="color:#ff8fc8">' + f('🫧', 'Bubble Gum', P.gum) + '</span>');
    if (P.bal > 0)
        L.push('<span style="color:#ff6b6b">' + f('🎈', 'Balloon', P.bal) + '</span>');
    if (P.stealth)
        L.push('<span style="color:#c9b0ff">👤 Stealthed</span>');
    const el = $('toyb'), s = L.join('<br>');
    el.style.display = s ? 'block' : 'none';
    if (el.dataset.s !== s) {
        el.dataset.s = s;
        el.innerHTML = s;
    }
}
// ----- Fireworks -----
let fwR = [], fwP = [];
const FW_COLS = [0xff3a3a, 0xffd23a, 0x3ac8ff, 0x7bff4a, 0xff5ae0, 0xffffff, 0xff9a2a, 0xb05aff];
function launchFireworks() {
    for (let i = 0; i < 6; i++) {
        const col = FW_COLS[(Math.random() * FW_COLS.length) | 0];
        const r = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .6, 6), new THREE.MeshBasicMaterial({ color: col }));
        r.position.set(P.pos.x + rnd(-1.5, 1.5), P.pos.y + .5, P.pos.z + rnd(-1.5, 1.5));
        r.visible = false;
        S.add(r);
        fwR.push({ m: r, col, delay: i * .45, vx: rnd(-1.5, 1.5), vz: rnd(-1.5, 1.5), vy: rnd(17, 23), t: rnd(.9, 1.2), kind: i % 3 });
    }
    say('<span style="color:#9fd8ff">🎆 Fireworks! Look up!</span>');
}
function fwExplode(p, col, kind) {
    const n = kind == 1 ? 60 : 44, col2 = FW_COLS[(Math.random() * FW_COLS.length) | 0];
    for (let i = 0; i < n; i++) {
        const c = kind == 2 && i % 2 ? col2 : col;
        const m = new THREE.Mesh(new THREE.SphereGeometry(kind == 1 ? .12 : .17, 5, 4), new THREE.MeshBasicMaterial({ color: c, transparent: true }));
        m.position.copy(p);
        S.add(m);
        // even spread on a sphere; kind 1 is a flat ring
        const u = Math.random() * 2 - 1, a = Math.random() * 6.283, sp = kind == 1 ? 11 : rnd(7, 10);
        const v = kind == 1 ? new THREE.Vector3(Math.cos(i / n * 6.283), rnd(-.1, .1), Math.sin(i / n * 6.283)).multiplyScalar(sp) : new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(a), u, Math.sqrt(1 - u * u) * Math.sin(a)).multiplyScalar(sp);
        fwP.push({ m, v, t: rnd(1.1, 1.6), max: 1.6 });
    }
}
function fwTick(dt) {
    fwR = fwR.filter(r => {
        if (r.delay > 0) {
            r.delay -= dt;
            r.m.visible = r.delay <= 0;
            return true;
        }
        r.m.position.x += r.vx * dt;
        r.m.position.z += r.vz * dt;
        r.m.position.y += r.vy * dt;
        r.vy -= 6 * dt;
        r.t -= dt;
        if (Math.random() < .8)
            burst(r.m.position.clone().setY(r.m.position.y - 1.2), 0xffcc66, 1, .2);
        if (r.t <= 0) {
            fwExplode(r.m.position, r.col, r.kind);
            S.remove(r.m);
            return false;
        }
        return true;
    });
    fwP = fwP.filter(q => {
        q.t -= dt;
        q.v.multiplyScalar(Math.pow(.35, dt));
        q.v.y -= 3 * dt;
        q.m.position.addScaledVector(q.v, dt);
        q.m.material.opacity = Math.min(1, q.t / .6);
        if (q.t <= 0) {
            S.remove(q.m);
            q.m.material.dispose();
            return false;
        }
        return true;
    });
}
// ----- Red balloon -----
function holdBalloon() {
    P.bal = 60;
    if (!P.balM) {
        const g = new THREE.Group();
        g.position.set(.55, 1.6, .1);
        add(new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 2, 4), new THREE.MeshBasicMaterial({ color: 0xeeeeee })), 0, 1, 0, g);
        const b = add(new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 12), new THREE.MeshLambertMaterial({ color: 0xe02a2a, emissive: 0x300808 })), 0, 2.45, 0, g);
        b.scale.set(1, 1.2, 1);
        add(new THREE.Mesh(new THREE.ConeGeometry(.08, .14, 6), M(0xc01a1a)), 0, 1.86, 0, g).rotation.x = PI;
        add(new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 })), -.2, 2.7, .35, g);
        P.mesh.add(g);
        P.balM = g;
    }
    say('<span style="color:#ff6b6b">🎈 You grab a red balloon! Jump high and float down slowly for 1 minute.</span>');
}
function balloonEnd(quiet) {
    if (P && P.balM) {
        P.mesh.remove(P.balM);
        P.balM = null;
    }
    if (P && P.bal > 0 && !quiet)
        say('🎈 Your balloon floats away...');
    if (P)
        P.bal = 0;
}
function balloonTick(dt, t) {
    if (!(P.bal > 0))
        return;
    P.bal -= dt;
    if (P.balM) {
        P.balM.rotation.z = Math.sin(t * 1.7) * .12 - (P.mv ? .2 : 0);
        P.balM.rotation.x = Math.cos(t * 1.3) * .1 + (P.mv ? -.25 : 0);
    }
    if (P.bal <= 0) {
        P.bal = 1;
        balloonEnd();
    }
}
// ----- Placed toys (snowman, campfire) -----
let PLACED = [];
function placeSpot(dist) { const a = P.mesh.rotation.y, x = P.pos.x + Math.sin(a) * dist, z = P.pos.z + Math.cos(a) * dist; return { x, z, y: groundH(x, z), a }; }
function noPlace() { if (DG.on || G.on || DU) {
    say('You cannot place that here.');
    return true;
} return false; }
function buildSnowman() {
    if (noPlace())
        return false;
    const p = placeSpot(3.5), g = new THREE.Group(), snow = M(0xf4f8ff), k = new THREE.MeshBasicMaterial({ color: 0x111111 });
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.a + PI;
    add(new THREE.Mesh(new THREE.SphereGeometry(.85, 14, 12), snow), 0, .75, 0, g);
    add(new THREE.Mesh(new THREE.SphereGeometry(.62, 14, 12), snow), 0, 1.95, 0, g);
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(.45, 14, 12), snow), 0, 2.85, 0, g);
    [-1, 1].forEach(sd => add(new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 6), k), sd * .16, .1, .4, head));
    add(new THREE.Mesh(new THREE.ConeGeometry(.08, .45, 6), M(0xff7a1a)), 0, -.02, .6, head).rotation.x = PI / 2;
    for (let i = 0; i < 5; i++)
        add(new THREE.Mesh(new THREE.SphereGeometry(.04, 5, 5), k), (i - 2) * .08, -.2 - Math.abs(i - 2) * -.03 - .02, .4, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .06, 14), k), 0, .38, 0, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .32, .5, 14), k), 0, .65, 0, head);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .1, 14), M(0xc0202a)), 0, .45, 0, head);
    add(new THREE.Mesh(new THREE.TorusGeometry(.46, .1, 6, 16), M(0x2a7a3a)), 0, 2.45, 0, g).rotation.x = PI / 2;
    for (let i = 0; i < 3; i++)
        add(new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), k), 0, 2.2 - i * .3, .6 - Math.abs(i - 1) * .03, g);
    const arms = [-1, 1].map(sd => { const a = new THREE.Group(); a.position.set(sd * .55, 2.05, 0); add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.1, 5), M(0x5a3a1a)), sd * .5, .2, 0, a).rotation.z = -sd * 1.1; g.add(a); return a; });
    g.traverse(o => { if (o.isMesh)
        o.castShadow = true; });
    S.add(g);
    burst(new THREE.Vector3(p.x, p.y, p.z), 0xffffff, 20, 1.5);
    PLACED.push({ root: g, life: 60, tick(dt, t) { arms[1].rotation.z = Math.sin(t * 6) * .5 + .4; head.rotation.y = Math.sin(t * .8) * .3; if (Math.random() < .05)
            burst(new THREE.Vector3(g.position.x + rnd(-2, 2), g.position.y + 4, g.position.z + rnd(-2, 2)), 0xffffff, 1, -.2, 0); } });
    say('⛄ You built a snowman! It waves hello.');
}
function lightCampfire() {
    if (noPlace())
        return false;
    const p = placeSpot(2.8), g = new THREE.Group(), wood = M(0x5a3a1a), stone = M(0x777777);
    g.position.set(p.x, p.y, p.z);
    for (let i = 0; i < 8; i++)
        add(new THREE.Mesh(new THREE.DodecahedronGeometry(.22, 0), stone), Math.cos(i / 8 * 6.283) * .8, .12, Math.sin(i / 8 * 6.283) * .8, g);
    for (let i = 0; i < 4; i++) {
        const l = add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.2, 6), wood), 0, .25, 0, g);
        l.rotation.set(1.1, i / 4 * 6.283, 0);
    }
    const fl = add(new THREE.Mesh(new THREE.ConeGeometry(.4, 1.1, 8), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: .9 })), 0, .75, 0, g);
    const fl2 = add(new THREE.Mesh(new THREE.ConeGeometry(.22, .7, 8), new THREE.MeshBasicMaterial({ color: 0xffe14a })), 0, .6, 0, g);
    const light = new THREE.PointLight(0xff8a2a, 1.4, 12);
    light.position.set(0, 1.4, 0);
    g.add(light);
    S.add(g);
    let msgT = 0;
    PLACED.push({ root: g, life: 60, tick(dt, t) {
            fl.scale.set(1 + Math.sin(t * 17) * .1, 1 + Math.sin(t * 11) * .25, 1 + Math.cos(t * 13) * .1);
            fl2.scale.set(1, 1 + Math.sin(t * 21) * .3, 1);
            light.intensity = 1.2 + Math.sin(t * 23) * .2 + Math.random() * .2;
            if (Math.random() < .3)
                burst(new THREE.Vector3(g.position.x, g.position.y, g.position.z), Math.random() < .5 ? 0xff9933 : 0xffdd55, 1, .5, 1);
            if (!P.dead && d3(g.position, P) < 4.5) {
                P.hp = Math.min(P.max, P.hp + P.max * .03 * dt);
                P.mp = Math.min(P.mmax, P.mp + P.mmax * .03 * dt);
                msgT -= dt;
                if (msgT <= 0) {
                    msgT = 3;
                    if (P.hp < P.max || P.mp < P.mmax)
                        float(P.pos, '🔥 cozy', '#ffb347');
                }
            }
        } });
    say('🔥 You light a cozy campfire. Stand close to recover health and mana.');
}
function placedTick(dt, t) {
    PLACED = PLACED.filter(o => {
        o.life -= dt;
        o.tick(dt, t);
        if (o.life <= 0) {
            burst(o.root.position, 0xcccccc, 12, 1);
            S.remove(o.root);
            return false;
        }
        return true;
    });
}
function toyCleanup() {
    balloonEnd(true);
    PLACED.forEach(o => S.remove(o.root));
    PLACED = [];
    fwR.forEach(r => S.remove(r.m));
    fwP.forEach(q => S.remove(q.m));
    fwR = [];
    fwP = [];
    $('toyb').style.display = 'none';
    $('toyb').dataset.s = '';
}

// ===== Jump Challenge: a spiral of floating platforms next to The Pit =====
const JP = [], JR = { on: false, t: 0, cp: 0, falls: 0, done: false };
const JC_A0 = -PI / 4 + .55, JC_RAD = 10.5, JC_START = { x: JC.x + Math.cos(JC_A0) * 15.5, z: JC.z + Math.sin(JC_A0) * 15.5 };
function jcFmt(s) { return Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0'); }
(function buildJumpCourse() {
    const base = groundH(JC.x, JC.z), N = 20, a0 = JC_A0;
    // central stone pillar with a beacon on top (decoration only)
    const pil = add(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 24, 12), TM(stoneT)), JC.x, base + 12, JC.z);
    pil.castShadow = pil.receiveShadow = true;
    const bea = add(new THREE.Mesh(new THREE.OctahedronGeometry(1.1), new THREE.MeshBasicMaterial({ color: 0x9dff7a })), JC.x, base + 25.5, JC.z);
    JC.bea = bea;
    for (let i = 0; i < N; i++) {
        const a = a0 + i * .62, r = JC_RAD, cp = i == 7 || i == 14, fin = i == N - 1, small = !cp && !fin && i % 4 == 3, mv = !cp && !fin && i > 0 && i % 5 == 2;
        const w = fin ? 4 : cp ? 3.2 : small ? 1.7 : 2.4;
        const x = JC.x + Math.cos(a) * r, z = JC.z + Math.sin(a) * r, top = base + 1 + i * 1.05;
        const col = fin ? 0xffd23a : cp ? 0xe8b84a : mv ? 0xa05aff : new THREE.Color().setHSL(.33 - i / N * .33, .55, .45).getHex();
        const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, .5, w), M(col)), x, top - .25, z);
        m.castShadow = m.receiveShadow = true;
        // little hanging rock under each platform so they look like floating islands
        add(new THREE.Mesh(new THREE.ConeGeometry(w * .45, w * .8, 6), TM(rockT)), 0, -.25 - w * .4, 0, m).rotation.x = PI;
        if (cp || fin) {
            add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.4, 6), M(0x5a3a1a)), w / 2 - .3, 1.45, w / 2 - .3, m);
            const fl = add(new THREE.Mesh(new THREE.BoxGeometry(.9, .55, .04), M(fin ? 0xff3a3a : 0x7be04a)), w / 2 - .3 + .45, 2.35, w / 2 - .3, m);
            fl.userData.flag = 1;
        }
        if (fin) {
            const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.3, .12, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffe48a })), 0, 1.6, 0, m);
            JC.ring = ring;
        }
        JP.push({ i, x, z, x0: x, z0: z, a, top, w, m, cp, fin, mv, dx: 0, dz: 0 });
    }
    // start pad on the ground facing the arena
    const pad = add(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, .2, 24), new THREE.MeshLambertMaterial({ color: 0x7be04a, emissive: 0x1a4a10 })), JC_START.x, groundH(JC_START.x, JC_START.z) + .1, JC_START.z);
    pad.receiveShadow = true;
    JC.pad = pad;
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const g = cv.getContext('2d');
    g.font = 'bold 52px Georgia';
    g.textAlign = 'center';
    g.lineWidth = 8;
    g.strokeStyle = '#000';
    g.strokeText('🦘 JUMP CHALLENGE', 256, 62);
    g.fillStyle = '#9dff7a';
    g.fillText('🦘 JUMP CHALLENGE', 256, 62);
    g.font = 'bold 28px Georgia';
    g.strokeText('Reach the top flag! Race the clock', 256, 108);
    g.fillStyle = '#ffe0a0';
    g.fillText('Reach the top flag! Race the clock', 256, 108);
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
    sign.scale.set(11, 2.75, 1);
    sign.position.set(JC.x + Math.cos(JC_A0 - .3) * 17, groundH(JC_START.x, JC_START.z) + 5, JC.z + Math.sin(JC_A0 - .3) * 17);
    S.add(sign);
})();
function platTop(x, z, feet) {
    let best = null;
    for (const p of JP) {
        const h = p.w / 2 + .2;
        if (Math.abs(x - p.x) <= h && Math.abs(z - p.z) <= h && p.top <= feet + .35 && (!best || p.top > best.top))
            best = p;
    }
    return best;
}
// Works out what the hero is standing on: terrain or a platform. Keeps height smooth when stepping on/off.
function jcGround() {
    const x = P.pos.x, z = P.pos.z, base = groundH(x, z);
    let g = base, pl = null;
    if (Math.hypot(x - JC.x, z - JC.z) < JC.R && !G.on && !DG.on) {
        const feet = P.pos.y - (P.by || 0);
        pl = platTop(x, z, feet);
        if (pl)
            g = Math.max(base, pl.top);
    }
    if (pl && pl === P.onP && (P.jy || 0) < .05) {
        P.pos.x += pl.dx;
        P.pos.z += pl.dz;
    }
    if (P.gl !== undefined && (pl || P.onP) && g !== P.gl)
        P.jy = Math.max(0, (P.jy || 0) + P.gl - g);
    P.gl = g;
    P.onP = pl;
}
function jcReset() { JR.on = false; JR.done = false; JR.t = 0; JR.cp = 0; JR.falls = 0; $('jcp').style.display = 'none'; }
function jcTick(dt, t) {
    // animate course
    JP.forEach(p => {
        if (p.mv) {
            const off = Math.sin(t * 1.3 + p.i) * 1.4, nx = p.x0 + Math.cos(p.a) * off, nz = p.z0 + Math.sin(p.a) * off;
            p.dx = nx - p.x;
            p.dz = nz - p.z;
            p.x = nx;
            p.z = nz;
            p.m.position.x = nx;
            p.m.position.z = nz;
        }
        p.m.children.forEach(c => { if (c.userData.flag)
            c.rotation.y = Math.sin(t * 3 + p.i) * .3; });
    });
    if (JC.ring)
        JC.ring.rotation.y = t * 2;
    JC.bea.rotation.y = t;
    JC.bea.position.y = groundH(JC.x, JC.z) + 25.5 + Math.sin(t * 2) * .3;
    JC.pad.material.emissive.setHSL(.3, .7, .12 + Math.sin(t * 3) * .06);
    const near = Math.hypot(P.pos.x - JC.x, P.pos.z - JC.z), el = $('jcp'), onPad = Math.hypot(P.pos.x - JC_START.x, P.pos.z - JC_START.z) < 3;
    const best = CUR && CUR.jb ? jcFmt(CUR.jb) : '—';
    if (G.on || DG.on || P.dead) {
        if (JR.on)
            jcReset();
        el.style.display = 'none';
        return;
    }
    if (!JR.on) {
        if (!P.onP && (P.jy || 0) < .05 && near < JC.R)
            JR.done = false;
        if (P.onP && P.onP.i == 0 && !JR.done) {
            if (P.mount)
                dismount();
            JR.on = true;
            JR.t = 0;
            JR.cp = 0;
            JR.falls = 0;
            bn('🦘 GO!', 1200);
            say('<span style="color:#9dff7a">🦘 Jump Challenge started! Reach the golden platform at the top.</span>');
        }
        else {
            const s = onPad ? '🦘 <b>Jump Challenge</b><br><small>Jump onto the first platform to start the clock!<br>Best time: ' + best + '</small>' : '';
            el.style.display = s ? 'block' : 'none';
            if (s && el.dataset.s !== s) {
                el.dataset.s = s;
                el.innerHTML = s;
            }
            return;
        }
    }
    JR.t += dt;
    if (P.mount)
        dismount();
    const p = P.onP;
    if (p && p.cp && p.i > JR.cp) {
        JR.cp = p.i;
        burst(P.pos, 0x7be04a, 16, 1.4);
        say('<span style="color:#9dff7a">🚩 Checkpoint ' + (p.i == 7 ? 1 : 2) + '/2 reached!</span>');
    }
    if (p && p.fin) {
        JR.on = false;
        JR.done = true;
        const first = !(CUR && CUR.jb), rec = first || JR.t < CUR.jb;
        if (CUR && rec) {
            CUR.jb = JR.t;
            saveHero();
        }
        const xp = (first ? 3 : 1) * 20 * P.lvl, gold = (first ? 3 : 1) * (15 + 3 * P.lvl);
        addXP(xp);
        P.gold += gold;
        bn(rec ? '🏆 NEW RECORD! ' + jcFmt(JR.t) : '🏁 FINISHED! ' + jcFmt(JR.t), 4000);
        say('<span style="color:#ffd23a">🏁 Jump Challenge complete in ' + jcFmt(JR.t) + ' (' + JR.falls + ' falls)' + (first ? ' — first clear bonus!' : '') + ' +' + xp + ' xp, +' + gold + ' gold</span>');
        launchFireworks();
        el.style.display = 'none';
        return;
    }
    // fell to the ground: back to the last checkpoint (or start)
    if (!p && (P.jy || 0) < .05 && near < JC.R) {
        JR.falls++;
        const c = JR.cp ? JP[JR.cp] : null;
        if (c) {
            P.pos.x = c.x;
            P.pos.z = c.z;
            P.gl = c.top;
            P.pos.y = c.top + (P.by || 0);
            P.onP = c;
            P.jy = 0;
            P.vy = 0;
            burst(P.pos, 0x7be04a, 12, 1.2);
            say('Oops! Back to checkpoint.');
        }
        else {
            jcReset();
            say('You fell! Jump onto the first platform to try again.');
            return;
        }
    }
    if (near > JC.R + 14) {
        jcReset();
        say('Jump Challenge cancelled (you left the course).');
        return;
    }
    const s = '🦘 <b>Jump Challenge</b> ⏱ ' + jcFmt(JR.t) + '<br><small>Platform ' + (p ? p.i + 1 : '–') + '/' + JP.length + ' · 🚩 ' + (JR.cp == 14 ? 2 : JR.cp == 7 ? 1 : 0) + '/2 · Falls ' + JR.falls + ' · Best ' + best + '</small>';
    el.style.display = 'block';
    if (el.dataset.s !== s) {
        el.dataset.s = s;
        el.innerHTML = s;
    }
}

// ===== Rogue: Stealth (5th ability, key 5) =====
ICONS['Stealth'] = ['👤', '#3a2a5a'];
const STEALTH_AB = { n: 'Stealth', cost: 0, cd: .3, stealth: 1, f: () => toggleStealth() };
const PROWL_AB = { n: 'Prowl', cost: 0, cd: .3, stealth: 1, f: () => toggleStealth() };
ICONS['Prowl'] = ['🌑', '#4a3a1a'];
{
    const baseCfg = cfgOf;
    cfgOf = p => { const c = baseCfg(p); return p.cls == 'rogue' ? Object.assign({}, c, { ab: c.ab.concat([STEALTH_AB]) }) : c; };
}
function toggleStealth() {
    if (P.stealth)
        return stealthOff();
    if (G.on || DU) {
        P.cds[4] = 0;
        return say('You cannot use Stealth in PvP.');
    }
    P.stealth = true;
    // swap to see-through copies of the hero's materials (originals are kept and restored)
    P.stM = [];
    P.mesh.traverse(o => { if (o.isMesh && o.material && !o.userData.noSt) {
        const orig = o.material, cl = orig.clone();
        cl.transparent = true;
        cl.opacity = .3;
        cl.depthWrite = false;
        o.material = cl;
        P.stM.push([o, orig]);
    } });
    mobs.forEach(m => { if (!m.bot && !m.wb)
        m.aggro = false; });
    if (P.t && !P.t.wb && !P.t.bot)
        P.t = null;
    burst(P.pos, 0x6a4aaa, 16, 1);
    float(P.pos, 'Stealth', '#c9b0ff');
    if (P.lion)
        say('<span style="color:#c9b0ff">🦁 You crouch low and prowl unseen. Monsters ignore you. Your next attack deals double damage!</span>');
    else
        say('<span style="color:#c9b0ff">👤 You vanish into the shadows. Monsters ignore you. Your next attack deals double damage!</span>');
}
function stealthOff(quiet) {
    if (!P || !P.stealth)
        return;
    P.stealth = false;
    const si = P.cfg && P.cfg.ab ? P.cfg.ab.findIndex(a => a.stealth) : -1;
    if (si >= 0)
        P.cds[si] = 3;
    (P.stM || []).forEach(([o, m]) => { o.material.dispose(); o.material = m; });
    P.stM = null;
    if (!quiet) {
        burst(P.pos, 0x6a4aaa, 10, 1);
        say('<span style="color:#c9b0ff">👤 You leave stealth.</span>');
    }
}
// ===== Admin: teleport by clicking the world map or the minimap =====
function admTP(x, z) {
    if (DG.on || G.on || DU)
        return say('<span style="color:#4fc3ff">[R] You cannot teleport here.</span>');
    x = Math.max(-WORLD + 2, Math.min(WORLD - 2, x));
    z = Math.max(-WORLD + 2, Math.min(WORLD - 2, z));
    burst(P.pos, 0x4fc3ff, 20, 1.5);
    P.cast = null;
    P.pos.set(x, 0, z);
    P.gl = undefined;
    P.onP = null;
    P.jy = 0;
    P.vy = 0;
    P.t = null;
    burst(P.pos, 0x4fc3ff, 24, 1.5);
    float(P.pos, 'Teleport!', '#4fc3ff');
    say('<span style="color:#4fc3ff">[R] Teleported to ' + Math.round(x) + ', ' + Math.round(z) + ' — ' + (Math.hypot(x, z) < TOWN ? 'Town' : ZONES[zoneAt(x, z)].e + ' ' + ZONES[zoneAt(x, z)].n) + '</span>');
}
function admMapTP() {
    if (!ADM.tp)
        admToggle('tp');
    $('adm').style.display = 'none';
    if (!mapOpen)
        toggleMap();
    say('<span style="color:#4fc3ff">[R] Click anywhere on the map to teleport there.</span>');
}
$('mc').addEventListener('click', e => {
    if (!ADM.tp || !running)
        return;
    const c = $('mc'), r = c.getBoundingClientRect(), px = (e.clientX - r.left - c.clientLeft) / c.clientWidth * c.width, pz = (e.clientY - r.top - c.clientTop) / c.clientHeight * c.height, K = c.width / (WORLD * 2);
    admTP(px / K - WORLD, pz / K - WORLD);
    if (mapOpen)
        toggleMap();
});
$('mm').addEventListener('click', e => {
    if (!ADM.tp || !running)
        return;
    const c = $('mm'), r = c.getBoundingClientRect(), px = (e.clientX - r.left - c.clientLeft) / c.clientWidth * 120, pz = (e.clientY - r.top - c.clientTop) / c.clientHeight * 120;
    admTP(P.pos.x + (px - 60) / .9, P.pos.z + (pz - 60) / .9);
});
setInterval(() => { const cur = ADM.tp ? 'crosshair' : ''; ['mm', 'mc'].forEach(i => { if ($(i).style.cursor !== cur)
    $(i).style.cursor = cur; }); }, 500);

// ===== Admin console: type commands, spawn dungeon bosses in the open world =====
let admLog = ['Type <b>help</b> to see the commands.'], admLast = '', admHist = [], admHi = 0, admZones = [];
const ADM_MODES = { aggressive: '😡 Aggressive — attacks everyone', passive: '😐 Passive — only fights back', friendly: '😇 Friendly — fights for you' };
function admConsoleHTML() {
    return `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #7a5a22;text-align:left"><b style="color:var(--gold)">💻 Console</b> <small style="opacity:.8">— boss IDs: ${DG_BOSSES.map(b => `<span onclick="admFill('spawn ${b.id}')" style="cursor:pointer;color:#ff9a6a;text-decoration:underline">${b.id} = ${b.name} (Lv ${b.lvl})</span>`).join(' · ')}</small><div id="admo" style="margin:6px 0;height:96px;overflow-y:auto;background:#000c;border:1px solid #7a5a22;border-radius:4px;padding:4px 6px;font-family:Consolas,monospace;font-size:12px;line-height:1.35">${admLog.map(l => '<div>' + l + '</div>').join('')}</div><div style="display:flex;gap:6px"><input id="admc" value="${esc(admLast)}" placeholder="e.g. spawn 3   ·   spawn 2 passive   ·   spawn 1 friendly 2" autocomplete="off" spellcheck="false" style="flex:1;font-family:Consolas,monospace;font-size:13px;padding:6px 8px;background:#0b0804;color:#9dff7a;border:2px solid #7a5a22;border-radius:4px" onkeydown="admKey(event)"><button onclick="admRun()" style="padding:4px 14px;font-size:13px;margin:0">Run</button></div></div>`;
}
function admFill(s) { const i = $('admc'); if (i) {
    i.value = s;
    i.focus();
} }
function admKey(e) {
    e.stopPropagation();
    if (e.key == 'Enter')
        admRun();
    else if (e.key == 'Escape')
        toggleAdm();
    else if (e.key == 'ArrowUp' && admHist.length) {
        admHi = Math.max(0, admHi - 1);
        e.target.value = admHist[admHi];
        e.preventDefault();
    }
    else if (e.key == 'ArrowDown' && admHist.length) {
        admHi = Math.min(admHist.length, admHi + 1);
        e.target.value = admHist[admHi] || '';
        e.preventDefault();
    }
}
function admOut(s) {
    admLog.push(s);
    if (admLog.length > 40)
        admLog.shift();
    const o = $('admo');
    if (o) {
        o.innerHTML = admLog.map(l => '<div>' + l + '</div>').join('');
        o.scrollTop = o.scrollHeight;
    }
}
function admRun() {
    const inp = $('admc'), raw = (inp ? inp.value : '').trim();
    if (!raw)
        return;
    admHist.push(raw);
    admHi = admHist.length;
    admLast = '';
    if (inp)
        inp.value = '';
    admOut('<span style="color:#9dff7a">&gt; ' + esc(raw) + '</span>');
    const a = raw.toLowerCase().split(/\s+/), cmd = a[0];
    if (cmd == 'help' || cmd == '?') {
        admOut('<b>spawn &lt;id&gt; [passive|friendly] [count]</b> — spawn a boss in front of you (aggressive by default)');
        admOut('<b>bosses</b> — list boss IDs · <b>clear</b> — remove spawned bosses');
        admOut('<b>tp &lt;x&gt; &lt;z&gt;</b> — teleport · <b>heal</b> — full health &amp; mana · <b>level &lt;n&gt;</b> — add levels');
    }
    else if (cmd == 'bosses' || cmd == 'list') {
        DG_BOSSES.forEach(b => admOut(b.id + ' — ' + b.name + ' (Lv ' + b.lvl + ')'));
    }
    else if (cmd == 'spawn') {
        const id = parseInt(a[1], 10), B = DG_BOSSES.find(b => b.id === id);
        if (!B)
            return admOut('<span style="color:#f77">Unknown boss id. Use: ' + DG_BOSSES.map(b => b.id).join(', ') + ' (type <b>bosses</b>)</span>');
        if (DG.on || G.on || DU)
            return admOut('<span style="color:#f77">You cannot spawn bosses inside dungeons or PvP.</span>');
        const mode = a.includes('passive') ? 'passive' : a.includes('friendly') || a.includes('ally') ? 'friendly' : 'aggressive';
        const n = Math.max(1, Math.min(5, parseInt(a.slice(2).find(x => /^\d+$/.test(x)) || '1', 10)));
        for (let i = 0; i < n; i++)
            admSpawnBoss(B, mode, i, n);
        admOut('<span style="color:#ffd24a">Spawned ' + (n > 1 ? n + '× ' : '') + B.name + ' — ' + ADM_MODES[mode] + '</span>');
    }
    else if (cmd == 'clear' || cmd == 'despawn') {
        const L = mobs.filter(m => m.adm);
        L.forEach(m => { burst(m.pos, 0x4fc3ff, 16, 1.5); S.remove(m.mesh); if (P.t === m)
            P.t = null; });
        mobs = mobs.filter(m => !m.adm);
        admOut(L.length ? 'Removed ' + L.length + ' spawned boss' + (L.length > 1 ? 'es' : '') + '.' : 'No spawned bosses to remove.');
    }
    else if (cmd == 'tp') {
        const x = parseFloat(a[1]), z = parseFloat(a[2]);
        if (isNaN(x) || isNaN(z))
            return admOut('<span style="color:#f77">Usage: tp &lt;x&gt; &lt;z&gt; (e.g. tp 0 0 = town)</span>');
        admTP(x, z);
        admOut('Teleported to ' + Math.round(x) + ', ' + Math.round(z) + '.');
    }
    else if (cmd == 'heal') {
        P.hp = P.max;
        P.mp = P.mmax;
        burst(P.pos, 0x66ff88, 20, 1.5);
        admOut('Fully healed.');
    }
    else if (cmd == 'level' || cmd == 'lvl') {
        const n = parseInt(a[1], 10);
        if (!(n > 0))
            return admOut('<span style="color:#f77">Usage: level &lt;n&gt; (e.g. level 5)</span>');
        admLvl(Math.min(100, n));
        admOut('Now level ' + P.lvl + '.');
    }
    else
        admOut('<span style="color:#f77">Unknown command "' + esc(cmd) + '". Type <b>help</b>.</span>');
}
function admSpawnBoss(B, mode, i, n) {
    const a = P.mesh.rotation.y + (n > 1 ? (i - (n - 1) / 2) * .6 : 0), d = 14, x = P.pos.x + Math.sin(a) * d, z = P.pos.z + Math.cos(a) * d;
    const mesh = mobMesh(B.ty);
    mesh.position.set(x, groundH(x, z), z);
    S.add(mesh);
    mesh.traverse(q => { if (q.isMesh && q.material.isMeshLambertMaterial)
        q.castShadow = true; });
    const hp = Math.round((30 + B.lvl * 22) * B.hpm);
    const m = { mesh, pos: mesh.position, hx: x, hz: z, lvl: B.lvl, ty: B.ty, hp, max: hp, cd: 1, slow: 0, aggro: false, dm: B.dm, spd: B.spd, boss: B.id, rng: B.rng, acd: B.acd, adm: mode, lunge: 0, t1: 4, tg: null };
    m.name = B.name + (mode == 'friendly' ? ' 😇' : mode == 'passive' ? ' 😐' : ' 😡');
    decorBoss(m);
    mobs.push(m);
    burst(m.pos, mode == 'friendly' ? 0x66ff88 : 0xff4422, 30, 2);
}
// who may this spawned boss fight?
function admFoes(m) {
    const L = [], pOK = !P.dead && !P.stealth && !ADM.ignore;
    if (m.adm == 'friendly') {
        mobs.forEach(o => { if (o !== m && !o.wb && !o.bot && !(o.adm == 'friendly') && !(o.adm == 'passive' && !o.aggro))
            L.push(o); });
        return L;
    }
    if (m.adm == 'passive') {
        if (m.aggro && pOK)
            L.push(P);
        if (m.hitBy && mobs.includes(m.hitBy))
            L.push(m.hitBy);
        return L;
    }
    if (pOK)
        L.push(P);
    wbots.forEach(b => { if (!b.dead)
        L.push(b); });
    mobs.forEach(o => { if (o !== m && !o.wb && !o.bot && o.adm != 'aggressive')
        L.push(o); });
    return L;
}
function admHurt(m, tg, d) {
    if (tg === P)
        return foeHit(P, d, m);
    if (tg.wb)
        return wbHurt(tg, d);
    if (tg.adm) {
        tg.hitBy = m;
        tg.aggro = tg.aggro || tg.adm != 'friendly';
    }
    tg.hp -= d;
    float(tg.pos, d, m.adm == 'friendly' ? '#9dff7a' : '#ff9a6a');
    if (tg.hp <= 0)
        kill(tg);
}
function admZone(m, x, z, r, col, delay, dmg, kind) {
    const g = new THREE.Group(), disc = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .2, depthWrite: false }));
    disc.rotation.x = -PI / 2;
    g.add(disc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - .3, r, 40), new THREE.MeshBasicMaterial({ color: col, side: 2 }));
    ring.rotation.x = -PI / 2;
    g.add(ring);
    g.position.set(x, groundH(x, z) + .15, z);
    S.add(g);
    admZones.push({ g, disc, t: delay, max: delay, x, z, r, col, dmg, m, kind });
}
function admBossTick(dt, t) {
    // telegraphed boss attacks
    admZones = admZones.filter(z => {
        z.t -= dt;
        z.disc.material.opacity = .12 + .38 * (1 - Math.max(0, z.t) / z.max);
        if (z.t > 0)
            return true;
        if (mobs.includes(z.m))
            admFoes(z.m).forEach(o => { if (Math.hypot(o.pos.x - z.x, o.pos.z - z.z) < z.r) {
                admHurt(z.m, o, z.dmg);
                if (o === P && z.kind == 'wail')
                    P.slowT = 3.5;
            } });
        burst(new THREE.Vector3(z.x, groundH(z.x, z.z), z.z), z.col, 22, 2, .2);
        S.remove(z.g);
        return false;
    });
    if (!DG.on && (P.slowT || 0) > 0)
        P.slowT = Math.max(0, P.slowT - dt);
    let bf = null;
    mobs.forEach(m => {
        if (!m.adm)
            return;
        m.cd -= dt;
        m.lunge = Math.max(0, (m.lunge || 0) - dt);
        m.slow = Math.max(0, (m.slow || 0) - dt);
        if (m.stun > 0) {
            m.stun -= dt;
            return;
        }
        // keep the current target while it's valid and close, otherwise pick the nearest foe
        const foes = admFoes(m);
        if (!m.tg || !foes.includes(m.tg) || m.tg.dead || m.tg.hp <= 0 || d3(m, m.tg) > 40) {
            m.tg = null;
            let bd = m.adm == 'aggressive' ? 26 : 34;
            foes.forEach(o => { const dd = d3(m, o); if (dd < bd) {
                bd = dd;
                m.tg = o;
            } });
        }
        const tg = m.tg, sp = (5 + m.lvl * .35) * (m.spd || 1) * (m.slow > 0 ? .4 : 1);
        let mv = false;
        if (tg) {
            if (tg === P)
                m.aggro = true;
            const dd = d3(m, tg);
            m.mesh.rotation.y = Math.atan2(tg.pos.x - m.pos.x, tg.pos.z - m.pos.z);
            if (dd > (m.rng || 3)) {
                const k = Math.min(dd, sp * dt) / dd;
                m.pos.x += (tg.pos.x - m.pos.x) * k;
                m.pos.z += (tg.pos.z - m.pos.z) * k;
                mv = true;
            }
            else if (m.cd <= 0) {
                m.cd = m.acd || 1.3;
                m.lunge = .25;
                const lv = tg === P ? P.lvl : tg.lvl || 1;
                admHurt(m, tg, Math.max(1, Math.round((2 + m.lvl * 2.2 - lv * .4) * (m.dm || 1))));
            }
            // signature attacks, like in the dungeon
            m.t1 -= dt;
            if (m.t1 <= 0) {
                if (m.boss == 1) {
                    m.t1 = 9;
                    admZone(m, m.pos.x, m.pos.z, 8, 0xff5533, 1.4, 55, 'slam');
                }
                else if (m.boss == 2) {
                    m.t1 = 11;
                    admZone(m, m.pos.x, m.pos.z, 15, 0xb06aff, 1.3, 48, 'wail');
                }
                else {
                    m.t1 = 8;
                    admZone(m, tg.pos.x, tg.pos.z, 5, 0xff7a1a, 1.7, 60, 'fire');
                    for (let k = 0; k < 2; k++)
                        admZone(m, tg.pos.x + rnd(-9, 9), tg.pos.z + rnd(-9, 9), 5, 0xff7a1a, 1.7, 60, 'fire');
                }
            }
        }
        else {
            m.aggro = false;
            // friendly bosses follow you around; others go back home
            const hx = m.adm == 'friendly' ? P.pos.x + 4 : m.hx, hz = m.adm == 'friendly' ? P.pos.z - 4 : m.hz, dd = Math.hypot(hx - m.pos.x, hz - m.pos.z);
            if (dd > (m.adm == 'friendly' ? 6 : .8)) {
                const k = Math.min(dd, sp * .8 * dt) / dd;
                m.pos.x += (hx - m.pos.x) * k;
                m.pos.z += (hz - m.pos.z) * k;
                m.mesh.rotation.y = Math.atan2(hx - m.pos.x, hz - m.pos.z);
                mv = true;
            }
            if (m.adm == 'friendly' && dd > 60) {
                m.pos.x = hx;
                m.pos.z = hz;
            }
        }
        if (m.boss == 2 && Math.random() < .3)
            burst(m.pos, 0xb06aff, 1, .7, 1.8);
        if (m.boss == 3 && Math.random() < .4)
            burst(m.pos, 0xff7a1a, 1, 1.5, 3);
        m.mv = mv ? 1 : 0;
        m.pos.y = groundH(m.pos.x, m.pos.z) + (mv ? Math.abs(Math.sin(t * 8 + m.hx)) * .25 : 0);
        m.mesh.scale.setScalar(1 + m.lunge * .6);
        if ((m.aggro || m.adm == 'friendly' && tg) && d3(m, P) < 45 && (!bf || d3(m, P) < d3(bf, P)))
            bf = m;
    });
    if (!DG.on) {
        const el = $('bossf');
        if (bf) {
            const s = `<b style="color:${bf.adm == 'friendly' ? '#9dff7a' : '#ff9a6a'}">${esc(bf.name)}</b> <small>Lv ${bf.lvl}</small><div class="bar" style="height:14px"><i style="background:${bf.adm == 'friendly' ? '#2a9a4a' : '#c0392b'};width:${Math.max(0, bf.hp / bf.max * 100)}%"></i></div>`;
            if (el.dataset.s !== s) {
                el.dataset.s = s;
                el.innerHTML = s;
            }
            el.style.display = 'block';
        }
        else
            el.style.display = 'none';
    }
}

// ----- Wildheart lion form -----
{
    const baseCfg2 = cfgOf;
    cfgOf = p => p.cls == 'druid' && p.lion ? Object.assign({}, CL.druid, { ab: CL.druid.abL.concat([PROWL_AB]) }) : baseCfg2(p);
}
function lionMesh() {
    const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c }), B = c => new THREE.MeshBasicMaterial({ color: c });
    const coat = L(0xd9a54a), light = L(0xf0d8a0), mane = L(0xa0521a), dark = L(0x6a3a14);
    add(new THREE.Mesh(new THREE.SphereGeometry(.7, 14, 10), coat), 0, 1.15, 0, g).scale.set(1, .82, 1.6);
    add(new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), light), 0, .92, .1, g).scale.set(1, .6, 1.5);
    const head = new THREE.Group();
    head.position.set(0, 1.7, 1.05);
    g.add(head);
    add(new THREE.Mesh(new THREE.SphereGeometry(.66, 14, 10), mane), 0, 0, -.12, head).scale.set(1.1, 1.1, .85);
    for (let k = 0; k < 12; k++) {
        const a = k / 12 * PI * 2, c = add(new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 5), k % 2 ? mane : dark), Math.cos(a) * .62, Math.sin(a) * .62, -.2, head);
        c.rotation.z = a - PI / 2;
    }
    add(new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), coat), 0, 0, .18, head);
    add(new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), light), 0, -.12, .5, head).scale.set(1.2, .8, .9);
    add(new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), B(0x2a1a10)), 0, -.02, .7, head).scale.set(1.3, 1, 1);
    [-1, 1].forEach(sd => {
        add(new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), B(0x1a1208)), sd * .16, .1, .52, head);
        add(new THREE.Mesh(new THREE.SphereGeometry(.025, 5, 5), B(0xffffff)), sd * .16 - .02, .13, .58, head);
        add(new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), coat), sd * .3, .42, .05, head).scale.set(1, 1, .5);
    });
    g.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * .36, .95, sz * .7); add(new THREE.Mesh(new THREE.BoxGeometry(.26, .9, .28), coat), 0, -.45, 0, l); add(new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), light), 0, -.9, .06, l).scale.set(1, .6, 1.2); g.add(l); return l; });
    g.tail = new THREE.Group();
    g.tail.position.set(0, 1.3, -1.05);
    g.add(g.tail);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1.1, 6), coat), 0, -.1, -.5, g.tail).rotation.x = -1.1;
    add(new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), dark), 0, -.45, -1.0, g.tail);
    g.head = head;
    g.scale.setScalar(.8);
    g.traverse(o => { if (o.isMesh)
        o.castShadow = true; });
    return g;
}
function lionToggle() {
    if (P.cls != 'druid')
        return;
    if (P.stealth)
        stealthOff(true);
    P.lion = !P.lion;
    if (P.lion) {
        P.lionHid = P.mesh.children.filter(c => c.visible);
        P.lionHid.forEach(c => c.visible = false);
        P.lionM = lionMesh();
        P.mesh.add(P.lionM);
        say('<span style="color:#ffd27a">🦁 You take the form of a mighty lion! Faster, tougher, and sharp claws.</span>');
    }
    else {
        if (P.lionM)
            P.mesh.remove(P.lionM);
        P.lionM = null;
        (P.lionHid || []).forEach(c => c.visible = true);
        P.lionHid = null;
        say('<span style="color:#9dff6a">🧝 You return to your elf form.</span>');
    }
    burst(P.pos, 0x7be04a, 22, 1.5);
    burst(P.pos, 0xffd27a, 12, 1.2);
    P.cfg = cfgOf(P);
    P.cds = [0, 0, 0, 1.5, 0];
    buildHB();
    if (P.lion)
        say('<span style="color:#c9b0ff">Tip: press 5 to Prowl (lion stealth).</span>');
}
function lionTick(dt, t) {
    const g = P.lionM;
    if (!g)
        return;
    const mv = P.mv && !P.dead, sw = mv ? Math.sin(t * 13) * .7 : 0, air = (P.jy || 0) > .05;
    g.legs.forEach((l, j) => l.rotation.x = air ? (j < 2 ? -.7 : .6) : (j == 0 || j == 3) ? sw : -sw);
    g.tail.rotation.y = Math.sin(t * (mv ? 9 : 2.5)) * .35;
    g.tail.rotation.x = mv ? .3 : 0;
    g.head.position.y = 1.7 + (mv ? Math.abs(Math.sin(t * 13)) * .06 : Math.sin(t * 2) * .02);
    g.head.rotation.x = P.sw > 0 ? -Math.sin(P.sw / .3 * PI) * .5 : 0;
    g.position.y = mv ? Math.abs(Math.sin(t * 13)) * .05 : 0;
}

// ===== New mounts: Giant Spider, Stone Golem, Witch's Broom, Water Elemental =====
MOUNTS.push(
    { n: 'Giant Spider', e: '🕷️', lvl: 0, sp: 2.2, col: 0x4a3a5a, fly: 0, custom: 'spider' },
    { n: 'Stone Golem', e: '🗿', lvl: 0, sp: 1.9, col: 0x8a8a80, fly: 0, custom: 'golem' },
    { n: 'Flying Broom', e: '🧹', lvl: 0, sp: 2.5, col: 0xa0703a, fly: 1, custom: 'broom' },
    { n: 'Water Elemental', e: '🌊', lvl: 0, sp: 2.3, col: 0x2a8ad8, fly: 0, custom: 'water' }
);
function mountMesh(d) {
    const g = d.custom == 'spider' ? mtSpider(d) : d.custom == 'golem' ? mtGolem(d) : d.custom == 'broom' ? mtBroom(d) : d.custom == 'water' ? mtWater(d) : mountMesh2(d);
    if (d.custom)
        g.traverse(o => { if (o.isMesh && !o.material.transparent)
            o.castShadow = true; });
    return g;
}
const MTL = (c, e, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c, emissive: e || 0 }, o || {}));
// ----- Giant Spider: 8 legs walking in two alternating sets of four -----
function mtSpider(d) {
    const g = new THREE.Group(), root = new THREE.Group(), body = MTL(0x4a3a5a), dark = MTL(0x2a2030), stripe = MTL(0xb08ad8, 0x2a1a40), eye = new THREE.MeshBasicMaterial({ color: 0x9affea });
    g.add(root);
    const ab = add(new THREE.Mesh(new THREE.SphereGeometry(.95, 16, 12), body), 0, 1.45, -1.15, root);
    ab.scale.set(1.05, .85, 1.25);
    for (let k = 0; k < 3; k++)
        add(new THREE.Mesh(new THREE.TorusGeometry(.62 - k * .12, .07, 6, 20), stripe), 0, 1.75 - k * .05, -1.0 - k * .42, root).rotation.x = 1.25;
    add(new THREE.Mesh(new THREE.SphereGeometry(.62, 14, 10), body), 0, 1.2, .35, root).scale.set(1, .75, 1.1);
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), dark), 0, 1.15, 1.0, root);
    [[-.14, .16], [.14, .16], [-.26, .08], [.26, .08], [-.08, .26], [.08, .26], [-.2, -.02], [.2, -.02]].forEach(([x, y], k) => add(new THREE.Mesh(new THREE.SphereGeometry(k < 2 ? .085 : .05, 8, 6), eye), x, y, .34, head));
    [-1, 1].forEach(sd => add(new THREE.Mesh(new THREE.ConeGeometry(.06, .3, 5), dark), sd * .12, -.28, .3, head).rotation.x = 2.6);
    // a little saddle
    add(new THREE.Mesh(new THREE.BoxGeometry(.75, .14, .9), MTL(0x7a3a2a)), 0, 1.68, -.15, root);
    const legs = [];
    [1, -1].forEach(sd => [.75, .3, -.15, -.6].forEach((z, k) => {
        const yaw = sd > 0 ? [-.75, -.25, .25, .75][k] : PI + [.75, .25, -.25, -.75][k];
        const hip = new THREE.Group();
        hip.position.set(sd * .45, 1.2, z);
        hip.rotation.y = yaw;
        root.add(hip);
        const swing = new THREE.Group(), lift = new THREE.Group();
        hip.add(swing);
        swing.add(lift);
        limb(lift, { x: 0, y: 0, z: 0 }, { x: 1.05, y: .7, z: 0 }, body, .17);
        add(new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), stripe), 1.05, .7, 0, lift);
        limb(lift, { x: 1.05, y: .7, z: 0 }, { x: 1.75, y: -1.15, z: 0 }, dark, .13);
        legs.push({ swing, lift, ph: (k + (sd > 0 ? 0 : 1)) % 2 ? PI : 0, yaw });
    }));
    g.ride = 1.78;
    g.anim = (t, mv, jump) => {
        const ph = t * 12, A = mv ? 1 : 0;
        legs.forEach((L, i) => {
            const p = ph + L.ph;
            L.swing.rotation.y = mv ? Math.sin(p) * .38 : Math.sin(t * 1.5 + i) * .03;
            L.lift.rotation.z = jump ? .45 : mv ? Math.max(0, Math.cos(p)) * .4 : Math.max(0, Math.sin(t * 2.3 + i * 1.7)) * .04;
        });
        root.position.y = jump ? .15 : mv ? Math.abs(Math.sin(ph)) * .06 : Math.sin(t * 2) * .02;
        ab.rotation.x = Math.sin(t * (mv ? 6 : 1.5)) * .06;
        head.rotation.y = Math.sin(t * .9) * .15;
    };
    return g;
}
// ----- Stone Golem: big walking statue, you ride on its shoulders -----
function mtGolem(d) {
    const g = new THREE.Group(), root = new THREE.Group(), st = new THREE.MeshLambertMaterial({ map: TM(rockT).map, color: 0xb8b4a8 }), st2 = MTL(0x8a8678), moss = MTL(0x4a8a3a), rune = new THREE.MeshBasicMaterial({ color: 0x7affe0 });
    g.add(root);
    const torso = new THREE.Group();
    torso.position.y = 2.55;
    root.add(torso);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 1.05), st), 0, 0, 0, torso).rotation.y = .04;
    add(new THREE.Mesh(new THREE.BoxGeometry(1.2, .5, .9), st2), 0, -.85, 0, torso);
    add(new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .06), rune), 0, .1, .54, torso).rotation.z = PI / 4;
    [[-.55, .55], [.6, .4], [.2, -.3]].forEach(([x, y]) => add(new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 5), moss), x, y, .48, torso).scale.set(1, .6, .4));
    add(new THREE.Mesh(new THREE.BoxGeometry(1.0, .25, 1.0), moss), 0, .72, -.05, torso);
    const head = add(new THREE.Mesh(new THREE.BoxGeometry(.62, .55, .55), st), 0, .2, .75, torso);
    [-1, 1].forEach(sd => add(new THREE.Mesh(new THREE.BoxGeometry(.13, .08, .05), rune), sd * .15, .05, .28, head));
    const arms = [-1, 1].map(sd => {
        const a = new THREE.Group();
        a.position.set(sd * 1.15, .35, 0);
        torso.add(a);
        add(new THREE.Mesh(new THREE.DodecahedronGeometry(.42, 0), st2), 0, 0, 0, a);
        add(new THREE.Mesh(new THREE.BoxGeometry(.5, 1.1, .5), st), 0, -.75, 0, a);
        add(new THREE.Mesh(new THREE.DodecahedronGeometry(.42, 0), st), 0, -1.5, .05, a);
        return a;
    });
    const legs = [-1, 1].map(sd => {
        const l = new THREE.Group();
        l.position.set(sd * .48, 1.55, 0);
        root.add(l);
        add(new THREE.Mesh(new THREE.BoxGeometry(.6, .8, .6), st2), 0, -.4, 0, l);
        const kn = new THREE.Group();
        kn.position.y = -.8;
        l.add(kn);
        add(new THREE.Mesh(new THREE.BoxGeometry(.66, .75, .66), st), 0, -.38, 0, kn);
        add(new THREE.Mesh(new THREE.BoxGeometry(.75, .2, .9), st2), 0, -.7, .1, kn);
        l.kn = kn;
        return l;
    });
    g.ride = 3.35;
    g.anim = (t, mv, jump) => {
        const ph = t * 6.5, A = mv ? 1 : 0;
        legs.forEach((l, i) => { const p = ph + i * PI; l.rotation.x = jump ? (i ? .4 : -.6) : Math.sin(p) * .45 * A; l.kn.rotation.x = jump ? .5 : Math.max(0, -Math.sin(p + .6)) * .6 * A; });
        arms.forEach((a, i) => { a.rotation.x = mv ? -Math.sin(ph + i * PI) * .5 : Math.sin(t * 1.2 + i) * .04; a.rotation.z = (i ? -1 : 1) * .08; });
        torso.rotation.z = mv ? Math.sin(ph) * .05 : 0;
        torso.rotation.y = mv ? Math.sin(ph) * .06 : Math.sin(t * .5) * .03;
        root.position.y = jump ? .2 : mv ? Math.abs(Math.cos(ph)) * .12 : Math.sin(t * 1.4) * .02;
        head.rotation.y = Math.sin(t * .7) * .2;
    };
    return g;
}
// ----- Flying Broom: sparkly broomstick -----
function mtBroom(d) {
    const g = new THREE.Group(), root = new THREE.Group(), wood = MTL(0x8a5a2a), straw = MTL(0xe0c070), band = MTL(0xc03a3a);
    g.add(root);
    const y = .82;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 3.2, 8), wood), 0, y, .35, root).rotation.x = PI / 2;
    add(new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), wood), 0, y, 1.95, root);
    const br = new THREE.Group();
    br.position.set(0, y, -1.25);
    root.add(br);
    add(new THREE.Mesh(new THREE.ConeGeometry(.5, 1.5, 12, 1, true), straw), 0, 0, -.65, br).rotation.x = -PI / 2;
    for (let k = 0; k < 10; k++) {
        const a = k / 10 * PI * 2;
        add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .015, 1.5, 4), straw), Math.cos(a) * .33, Math.sin(a) * .33, -.75, br).rotation.x = PI / 2 + Math.sin(a) * .25;
    }
    add(new THREE.Mesh(new THREE.TorusGeometry(.16, .05, 6, 14), band), 0, 0, .05, br);
    const star = add(new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshBasicMaterial({ color: 0xffe48a })), 0, y + .25, 1.75, root);
    g.ride = 1.0;
    const wp = new THREE.Vector3();
    g.anim = (t, mv) => {
        root.rotation.x = mv ? -.08 + Math.sin(t * 4) * .02 : Math.sin(t * 1.5) * .03;
        root.rotation.z = Math.sin(t * 1.3) * (mv ? .05 : .03);
        br.rotation.y = Math.sin(t * (mv ? 9 : 3)) * .08;
        br.rotation.x = Math.sin(t * (mv ? 7 : 2)) * .05;
        star.rotation.y = t * 3;
        if (Math.random() < (mv ? .5 : .15)) {
            br.getWorldPosition(wp);
            burst(wp, [0xffe48a, 0xff8fc8, 0x9adfff][(Math.random() * 3) | 0], 1, -.1, -.3);
        }
    };
    return g;
}
// ----- Water Elemental: a flowing wave creature with bubbles -----
function mtWater(d) {
    const g = new THREE.Group(), root = new THREE.Group(), water = new THREE.MeshLambertMaterial({ color: 0x3aa0ff, emissive: 0x0a3a6a, transparent: true, opacity: .72 }), deep = new THREE.MeshLambertMaterial({ color: 0x1a6ad0, emissive: 0x062a5a, transparent: true, opacity: .8 }), foam = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x3a5a7a }), glow = new THREE.MeshBasicMaterial({ color: 0xbff8ff });
    g.add(root);
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(.85, 18, 14), water), 0, 1.6, 0, root);
    body.scale.set(.95, .8, 1.45);
    const head = new THREE.Group();
    head.position.set(0, 2.2, 1.2);
    root.add(head);
    add(new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10), water), 0, 0, 0, head).scale.set(1, .95, 1.3);
    [-1, 1].forEach(sd => add(new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), glow), sd * .2, .08, .42, head));
    const mane = [];
    for (let k = 0; k < 7; k++)
        mane.push(add(new THREE.Mesh(new THREE.SphereGeometry(.17 - k * .012, 8, 6), foam), 0, 2.15 + Math.sin(k * .5) * .1 - k * .03, .95 - k * .3, root));
    // swirling water column below instead of legs
    const swirl = new THREE.Group();
    swirl.position.y = .55;
    root.add(swirl);
    add(new THREE.Mesh(new THREE.ConeGeometry(.75, 1.4, 16, 1, true), deep), 0, .1, 0, swirl).rotation.x = PI;
    const rings = [0, 1, 2].map(k => { const r = add(new THREE.Mesh(new THREE.TorusGeometry(.75 - k * .18, .07, 6, 22), foam), 0, -.4 + k * .35, 0, swirl); r.rotation.x = PI / 2; return r; });
    const tail = new THREE.Group();
    tail.position.set(0, 1.6, -1.15);
    root.add(tail);
    add(new THREE.Mesh(new THREE.ConeGeometry(.35, 1.4, 10), water), 0, 0, -.6, tail).rotation.x = -PI / 2 - .3;
    add(new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), foam), 0, -.25, -1.25, tail);
    add(new THREE.Mesh(new THREE.BoxGeometry(.7, .12, .8), MTL(0x1a4a7a, 0x0a2040)), 0, 2.28, -.05, root);
    g.ride = 2.32;
    const wp = new THREE.Vector3();
    g.anim = (t, mv, jump) => {
        root.position.y = .15 + Math.sin(t * (mv ? 5 : 2)) * .1;
        root.rotation.x = mv ? -.07 : 0;
        swirl.rotation.y = t * (mv ? 7 : 3);
        rings.forEach((r, k) => { r.scale.setScalar(1 + Math.sin(t * 4 + k) * .08); });
        body.scale.set(.95 + Math.sin(t * 3) * .03, .8 + Math.sin(t * 3 + 1) * .03, 1.45);
        mane.forEach((m, k) => { m.position.x = Math.sin(t * 5 - k * .8) * .1; m.position.y = 2.15 - k * .03 + Math.sin(t * 6 - k) * .05; });
        tail.rotation.y = Math.sin(t * (mv ? 7 : 2.5)) * .35;
        head.rotation.x = Math.sin(t * 1.5) * .06;
        if (Math.random() < (mv ? .7 : .25)) {
            swirl.getWorldPosition(wp);
            burst(wp, Math.random() < .5 ? 0xbff8ff : 0x3aa0ff, 1, mv ? .8 : .5, -.4);
        }
    };
    return g;
}

function heroSwing(m, sw) {
    if (m.xSlash)
        return m.xSlash(sw);
    m.w.rotation.x = sw > 0 ? -Math.sin(sw / .3 * 3.14) * 1.8 : 0;
}
