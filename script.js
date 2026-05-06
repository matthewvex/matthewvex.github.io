/* ---------------- LOADER ---------------- */
let dots = 0;
const loadingText = document.getElementById("loading-text");

const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    loadingText.textContent = "Loading" + ".".repeat(dots);
}, 400);

window.addEventListener("load", () => {
    clearInterval(interval);
    const loader = document.getElementById("loader");
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 500);
});


/* ---------------- HERO CINEMATIC SCROLL ---------------- */
window.addEventListener("scroll", () => {
    const hero = document.querySelector(".hero");
    const scrollY = window.scrollY;

    hero.style.opacity = Math.max(1 - scrollY / 400, 0);
    hero.style.transform = `translateY(${scrollY * 0.2}px)`;
});


/* ---------------- DOWN ARROW SCROLL ---------------- */
document.querySelector(".down-arrow").addEventListener("click", () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
});


/* ---------------- SECTION REVEAL ---------------- */
const sections = document.querySelectorAll(".content-section");

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
    },
    { threshold: 0.2 }
);

sections.forEach(sec => observer.observe(sec));


/* ---------------- EXPANDABLE SECTIONS ---------------- */
document.querySelectorAll(".expand-arrow").forEach(arrow => {
    arrow.addEventListener("click", () => {
        const extra = arrow.nextElementSibling;
        arrow.classList.toggle("open");
        extra.classList.toggle("open");

        const video = extra.querySelector(".auton-media");
        if (video) {
            if (arrow.classList.contains("open")) {
                video.load();
                video.play();
            } else {
                video.pause();
                video.currentTime = 0;
            }
        }
    });
});


/* ---------------- MINI DROPDOWNS ---------------- */
document.querySelectorAll(".mini-header").forEach(header => {
    header.addEventListener("click", () => {
        const arrow = header.querySelector(".mini-arrow");
        const extra = header.nextElementSibling;

        arrow.classList.toggle("open");
        extra.classList.toggle("open");
    });
});


/* ---------------- DIM OVERLAY ON CARD HOVER ---------------- */
const dim = document.getElementById("dim-overlay");

document.querySelectorAll(".card-3d").forEach(card => {
    card.addEventListener("mouseenter", () => dim.classList.add("active"));
    card.addEventListener("mouseleave", () => dim.classList.remove("active"));
});


/* ---------------- PARTICLE BACKGROUND ---------------- */
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

let particles = [];
const particleCount = 40;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function spawnParticleWithSpacing(minDist = 60) {
    let x, y, valid = false;
    while (!valid) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        valid = true;

        for (const p of particles) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < minDist) {
                valid = false;
                break;
            }
        }
    }
    return { x, y };
}

class Particle {
    constructor() {
        const pos = spawnParticleWithSpacing(60);
        this.x = pos.x;
        this.y = pos.y;
        this.size = 2 + Math.random() * 6;
        this.depth = Math.random();

        const speed = 0.1 + this.depth * 0.3;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
    }

    update(mouse, scrollSpeed) {
        this.y += scrollSpeed * (0.01 + this.depth * 0.05);

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
            const force = (150 - dist) / 150;
            const nx = dx / dist;
            const ny = dy / dist;

            this.vx += nx * force * (0.5 + this.depth);
            this.vy += ny * force * (0.5 + this.depth);
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.985;
        this.vy *= 0.985;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        const alpha = 0.3 + this.depth * 0.7;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

const mouse = { x: -9999, y: -9999 };
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

let lastScrollY = window.scrollY;
let scrollSpeed = 0;

window.addEventListener("scroll", () => {
    const newY = window.scrollY;
    scrollSpeed = newY - lastScrollY;
    lastScrollY = newY;
});

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => p.update(mouse, scrollSpeed));

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = p1.size + p2.size;

            if (dist > 0 && dist < minDist) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;

                p1.x -= nx * overlap / 2;
                p1.y -= ny * overlap / 2;
                p2.x += nx * overlap / 2;
                p2.y += ny * overlap / 2;

                const rvx = p2.vx - p1.vx;
                const rvy = p2.vy - p1.vy;
                const velAlongNormal = rvx * nx + rvy * ny;

                if (velAlongNormal > 0) continue;

                const impulse = -(2 * velAlongNormal) / 2;
                p1.vx -= impulse * nx;
                p1.vy -= impulse * ny;
                p2.vx += impulse * nx;
                p2.vy += impulse * ny;
            }
        }
    }

    particles.forEach(p => p.draw());
    requestAnimationFrame(animateParticles);
}

animateParticles();


/* ---------------- MAGNETIC ELEMENTS ---------------- */
document.querySelectorAll(".magnetic").forEach(el => {
    const strength = 18;

    el.addEventListener("mousemove", e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    });

    el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
    });
});
