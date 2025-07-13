const scene = new THREE.Scene();

// Planet data
const planetData = [
  { name: "Mercury", size: 0.3, distance: 4, color: 0xaaaaff, speed: 0.02 },
  { name: "Venus", size: 0.5, distance: 6, color: 0xffaa00, speed: 0.015 },
  { name: "Earth", size: 0.6, distance: 8, color: 0x2266ff, speed: 0.01 },
  { name: "Mars", size: 0.4, distance: 10, color: 0xff3300, speed: 0.008 },
  { name: "Jupiter", size: 1.2, distance: 13, color: 0xffcc99, speed: 0.006 },
  { name: "Saturn", size: 1.0, distance: 16, color: 0xffeeaa, speed: 0.004 },
  { name: "Uranus", size: 0.8, distance: 19, color: 0x66ccff, speed: 0.002 },
  { name: "Neptune", size: 0.7, distance: 22, color: 0x3333ff, speed: 0.001 }
];

const maxDistance = Math.max(...planetData.map(p => p.distance)) + 2;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 40, maxDistance * 2);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(0, 0, 0);
scene.add(ambientLight, pointLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

function addStars() {
  const starGeo = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 1000; i++) {
    positions.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff });
  scene.add(new THREE.Points(starGeo, starMat));
}
addStars();

const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED = null;

function createOrbitRing(radius) {
  const segments = 200;
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    vertices.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
}

const planets = [];
planetData.forEach((data) => {
  const orbitRing = createOrbitRing(data.distance);
  scene.add(orbitRing);

  const planetGroup = new THREE.Object3D();
  scene.add(planetGroup);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(data.size, 32, 32),
    new THREE.MeshStandardMaterial({ color: data.color })
  );
  mesh.name = data.name;
  mesh.position.x = data.distance;
  planetGroup.add(mesh);

  const planet = { ...data, mesh, angle: Math.random() * Math.PI * 2, group: planetGroup };
  planets.push(planet);

  const controlDiv = document.createElement("div");
  controlDiv.innerHTML = `${data.name}: <input type="range" min="0" max="0.05" step="0.001" value="${data.speed}" id="${data.name}"/>`;
  document.getElementById("controls").appendChild(controlDiv);

  document.getElementById(data.name).addEventListener("input", (e) => {
    planet.speed = parseFloat(e.target.value);
  });
});

let paused = false;
document.getElementById("toggle-animation").addEventListener("click", () => {
  paused = !paused;
  document.getElementById("toggle-animation").textContent = paused ? "Resume" : "Pause";
});

document.getElementById("toggle-theme").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("light-mode");
  renderer.setClearColor(isDark ? 0x999999 : 0x000000);
});

// Hamburger menu toggle
const menuToggle = document.getElementById("menu-toggle");
const controlsContainer = document.getElementById("controls");

menuToggle.addEventListener("click", () => {
  controlsContainer.classList.toggle("collapsed");
});

// Close hamburger menu when clicking outside
window.addEventListener("click", (event) => {
  const isClickInside = menuToggle.contains(event.target) || controlsContainer.contains(event.target);
  if (!isClickInside && !controlsContainer.classList.contains("collapsed")) {
    controlsContainer.classList.add("collapsed");
  }
});

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  tooltip.style.left = `${e.clientX + 15}px`;
  tooltip.style.top = `${e.clientY + 15}px`;
});

window.addEventListener("click", () => {
  if (INTERSECTED) {
    const pos = INTERSECTED.position;
    camera.position.set(pos.x * 1.5, pos.y * 1.5 + 5, pos.z * 1.5);
  }
});

function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    planets.forEach((planet) => {
      planet.angle += planet.speed;
      planet.mesh.position.set(
        Math.cos(planet.angle) * planet.distance,
        0,
        Math.sin(planet.angle) * planet.distance
      );
    });
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.group.children[0]));
  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (INTERSECTED && INTERSECTED !== mesh) INTERSECTED.scale.set(1, 1, 1);
    INTERSECTED = mesh;
    tooltip.innerText = mesh.name;
    tooltip.style.display = "block";
    INTERSECTED.scale.set(1.2, 1.2, 1.2);
  } else {
    if (INTERSECTED) INTERSECTED.scale.set(1, 1, 1);
    INTERSECTED = null;
    tooltip.style.display = "none";
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
