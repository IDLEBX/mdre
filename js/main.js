import * as THREE from 'three';

// ---------- 3D SCENE SETUP ----------
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03010c);
scene.fog = new THREE.FogExp2(0x03010c, 0.012);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 11);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0x221c3a);
scene.add(ambient);
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(2, 3, 4);
scene.add(mainLight);
const backPurple = new THREE.PointLight(0x9a4eff, 0.7);
backPurple.position.set(-1, 2, -5);
scene.add(backPurple);
const fillLight = new THREE.PointLight(0x6a3ef0, 0.5);
fillLight.position.set(2, 1, 3);
scene.add(fillLight);

// Central 3D Object: Torus Knot
const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.28, 180, 24, 3, 4);
const knotMat = new THREE.MeshStandardMaterial({ color: 0xc388ff, emissive: 0x541c8c, emissiveIntensity: 0.6, metalness: 0.75, roughness: 0.25 });
const knot = new THREE.Mesh(knotGeo, knotMat);
scene.add(knot);

// Orbiting Spheres
const orbGroup = new THREE.Group();
const orbCount = 32;
for (let i = 0; i < orbCount; i++) {
    const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const matSphere = new THREE.MeshStandardMaterial({ color: 0xd6aaff, emissive: 0x8844dd, emissiveIntensity: 0.4 });
    const sphere = new THREE.Mesh(sphereGeo, matSphere);
    const angle = (i / orbCount) * Math.PI * 2;
    const radius = 1.65;
    sphere.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.8, Math.sin(angle) * 0.5);
    orbGroup.add(sphere);
}
scene.add(orbGroup);

// Particle Starfield
const particleCount = 2200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    particlePositions[i*3] = (Math.random() - 0.5) * 65;
    particlePositions[i*3+1] = (Math.random() - 0.5) * 38;
    particlePositions[i*3+2] = (Math.random() - 0.5) * 45 - 18;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMatGlow = new THREE.PointsMaterial({ color: 0xb28eff, size: 0.07, transparent: true, opacity: 0.7 });
const stars = new THREE.Points(particleGeo, particleMatGlow);
scene.add(stars);

// Decorative Rings
const ringGeo = new THREE.TorusGeometry(1.9, 0.045, 128, 400);
const ringMatPurple = new THREE.MeshStandardMaterial({ color: 0xb774ff, emissive: 0x5d2cb0 });
const ringMain = new THREE.Mesh(ringGeo, ringMatPurple);
ringMain.rotation.x = Math.PI / 2.4;
scene.add(ringMain);

const ringGeo2 = new THREE.TorusGeometry(2.3, 0.038, 128, 500);
const ringMatWhite = new THREE.MeshStandardMaterial({ color: 0xefe5ff, emissive: 0x8a5ae0 });
const ringWhite = new THREE.Mesh(ringGeo2, ringMatWhite);
ringWhite.rotation.z = 0.7;
ringWhite.rotation.x = 1.1;
scene.add(ringWhite);

// Animation Loop
let timeAnim = 0;
function animate3D() {
    requestAnimationFrame(animate3D);
    timeAnim += 0.009;
    knot.rotation.x += 0.007;
    knot.rotation.y += 0.01;
    knot.rotation.z += 0.005;
    orbGroup.rotation.y += 0.003;
    orbGroup.rotation.x = Math.sin(timeAnim * 0.5) * 0.2;
    ringMain.rotation.z += 0.004;
    ringMain.rotation.x = Math.sin(timeAnim * 0.3) * 0.2;
    ringWhite.rotation.y += 0.002;
    ringWhite.rotation.x = Math.cos(timeAnim * 0.4) * 0.15;
    stars.rotation.y += 0.0003;
    stars.rotation.x += 0.0002;
    camera.position.x += (0 - camera.position.x) * 0.02;
    camera.lookAt(0, 0.2, 0);
    renderer.render(scene, camera);
}
animate3D();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- API INTEGRATION (BreachVIP) ----------
const API_ENDPOINT = '/api/search';

async function searchBreach(term, fields, wildcard, caseSensitive, categoriesMinecraft) {
    const payload = {
        term: term,
        fields: fields,
        wildcard: wildcard,
        case_sensitive: caseSensitive,
        categories: categoriesMinecraft ? ["minecraft"] : null
    };
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        let msg = `Server error ${response.status}`;
        if (response.status === 429) msg = "Rate limited (15/min). Please wait a moment.";
        if (response.status === 400) msg = "Invalid request: verify term & fields.";
        throw new Error(msg);
    }
    const data = await response.json();
    return data.results || [];
}

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const termInput = document.getElementById('searchTerm');
const fieldsSelect = document.getElementById('fieldsSelect');
const wildcardChk = document.getElementById('wildcardFlag');
const caseSensitiveChk = document.getElementById('caseSensitiveFlag');
const minecraftCatChk = document.getElementById('minecraftCat');
const resultsDiv = document.getElementById('resultsContainer');

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

searchBtn.addEventListener('click', async () => {
    const term = termInput.value.trim();
    if (!term) {
        resultsDiv.innerHTML = `<div class="glass-card p-5 text-center" style="color:#ff9999"><i class="fas fa-times-circle"></i> Please enter a search term</div>`;
        return;
    }
    const selectedFields = Array.from(fieldsSelect.selectedOptions).map(opt => opt.value);
    if (selectedFields.length === 0) {
        resultsDiv.innerHTML = `<div class="glass-card p-5 text-center" style="color:#ff9999"><i class="fas fa-ban"></i> Select at least one field to search</div>`;
        return;
    }
    if (selectedFields.length > 10) {
        resultsDiv.innerHTML = `<div class="glass-card p-5 text-center" style="color:#ff9999"><i class="fas fa-exclamation-triangle"></i> Maximum 10 fields allowed</div>`;
        return;
    }
    resultsDiv.innerHTML = `<div class="glass-card p-8 text-center"><i class="fas fa-spinner fa-pulse text-3xl" style="color:#b77eff"></i><p class="mt-3">Querying breach database...</p></div>`;
    try {
        const results = await searchBreach(term, selectedFields, wildcardChk.checked, caseSensitiveChk.checked, minecraftCatChk.checked);
        if (!results.length) {
            resultsDiv.innerHTML = `<div class="glass-card p-6 text-center"><i class="fas fa-inbox"></i> No matches found. Try wildcards like *@domain.com</div>`;
            return;
        }
        let html = `<div><div class="text-sm" style="color:#c8aeff; margin-bottom:0.75rem;"><i class="fas fa-chart-line"></i> ⚡ ${results.length} records retrieved</div>`;
        results.forEach(res => {
            let categoriesDisplay = '';
            if (res.categories) {
                if (Array.isArray(res.categories)) categoriesDisplay = res.categories.join(', ');
                else categoriesDisplay = res.categories;
            } else categoriesDisplay = 'generic';
            const sourcePretty = escapeHtml(res.source || 'unknown');
            const catsPretty = escapeHtml(categoriesDisplay);
            let extraData = { ...res };
            delete extraData.source;
            delete extraData.categories;
            const preview = JSON.stringify(extraData, null, 2).slice(0, 380);
            html += `<div class="result-item">
                        <div class="flex justify-between flex-wrap items-center gap-2">
                            <span class="font-bold" style="color:#c388ff; font-size:1.1rem;"><i class="fas fa-skull"></i> ${sourcePretty}</span>
                            <span class="badge-result">📁 ${catsPretty}</span>
                        </div>
                        <div class="text-gray-300 text-sm mt-2 font-mono break-all" style="background:rgba(0,0,0,0.3); padding:0.5rem; border-radius:1rem;">${escapeHtml(preview)}</div>
                     </div>`;
        });
        html += `</div>`;
        resultsDiv.innerHTML = html;
    } catch (err) {
        console.error(err);
        resultsDiv.innerHTML = `<div class="glass-card p-6 text-center" style="color:#ff8888"><i class="fas fa-skull-crosswalk"></i> ${err.message || "Search failed. Check API connectivity."}</div>`;
    }
});

// ---------- AUTH MODAL LOGIC ----------
const modal = document.getElementById('authModal');
const openBtn = document.getElementById('openAuthBtn');
const closeModalBtn = document.getElementById('closeModal');
const loginTab = document.getElementById('loginTabBtn');
const registerTab = document.getElementById('registerTabBtn');
const loginDiv = document.getElementById('loginForm');
const registerDiv = document.getElementById('registerForm');
const doLogin = document.getElementById('doLoginBtn');
const doRegister = document.getElementById('doRegisterBtn');

let currentUser = localStorage.getItem('idlebx_user') || null;

function updateAuthButton() {
    if (currentUser) {
        openBtn.innerHTML = `<i class="fas fa-user-check mr-1"></i><span>${currentUser}</span>`;
    } else {
        openBtn.innerHTML = `<i class="fas fa-user-astronaut mr-1"></i><span>Account</span>`;
    }
}
updateAuthButton();

openBtn.onclick = () => modal.classList.remove('hidden');
closeModalBtn.onclick = () => modal.classList.add('hidden');
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

loginTab.onclick = () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginDiv.classList.remove('hidden');
    registerDiv.classList.add('hidden');
};
registerTab.onclick = () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerDiv.classList.remove('hidden');
    loginDiv.classList.add('hidden');
};

doLogin.onclick = () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { alert("Enter email or username"); return; }
    const username = email.split('@')[0];
    localStorage.setItem('idlebx_user', username);
    currentUser = username;
    updateAuthButton();
    modal.classList.add('hidden');
    alert(`✨ Welcome back, ${username}! Access granted.`);
};

doRegister.onclick = () => {
    const name = document.getElementById('regName').value.trim();
    const regEmail = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    if (!name || !regEmail || pass.length < 3) { alert("Please fill name, email and password (min 3 chars)"); return; }
    localStorage.setItem('idlebx_user', name);
    currentUser = name;
    updateAuthButton();
    modal.classList.add('hidden');
    alert(`✅ Account created! Welcome ${name}`);
};

// Pre-select default fields
Array.from(fieldsSelect.options).forEach(opt => {
    if (opt.value === 'email' || opt.value === 'username') opt.selected = true;
});
termInput.placeholder = "example: *@gmail.com, john?doe, test@*.io";
termInput.value = "*.com";
