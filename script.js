/* ---------------- HELPERS ---------------- */
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

/* ---------------- LOADER ---------------- */
const loadingText = $("#loading-text");
let dots = 0;

const loadingInterval = setInterval(() => {
    if (!loadingText) return;

    dots = (dots + 1) % 4;
    loadingText.textContent = "Loading" + ".".repeat(dots);
}, 400);

window.addEventListener("load", () => {
    clearInterval(loadingInterval);

    const loader = $("#loader");
    if (!loader) return;

    loader.style.opacity = "0";

    setTimeout(() => {
        loader.style.display = "none";
    }, 500);
});

/* ---------------- HERO CINEMATIC SCROLL ---------------- */
const hero = $(".hero");

window.addEventListener("scroll", () => {
    if (!hero) return;

    const scrollY = window.scrollY;
    const fade = Math.max(1 - scrollY / 430, 0);

    hero.style.opacity = fade;
    hero.style.transform = `translateY(${scrollY * 0.18}px)`;
});

/* ---------------- DOWN ARROW SCROLL ---------------- */
const downArrow = $(".down-arrow");

if (downArrow) {
    downArrow.addEventListener("click", () => {
        const content = $("#content");

        window.scrollTo({
            top: content ? content.offsetTop : window.innerHeight,
            behavior: "smooth"
        });
    });
}

/* ---------------- SECTION REVEAL ---------------- */
const revealItems = $$(".content-section, .contact-section");

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
            }
        });
    },
    { threshold: 0.18 }
);

revealItems.forEach(item => observer.observe(item));

/* ---------------- EXPANDABLE SECTIONS ---------------- */
$$(".expand-arrow").forEach(arrow => {
    arrow.addEventListener("click", () => {
        const card = arrow.closest(".text");
        const extra = card ? card.querySelector(".extra-content") : null;

        if (!extra) return;

        arrow.classList.toggle("open");
        extra.classList.toggle("open");

        const video = extra.querySelector("video");

        if (!video) return;

        if (extra.classList.contains("open")) {
            video.play().catch(() => {
                // Prevents console errors if autoplay is blocked.
            });
        } else {
            video.pause();
            video.currentTime = 0;
        }
    });
});

/* ---------------- MINI DROPDOWNS ---------------- */
$$(".mini-header").forEach(header => {
    header.addEventListener("click", () => {
        const arrow = header.querySelector(".mini-arrow");
        const extra = header.nextElementSibling;

        if (!arrow || !extra) return;

        arrow.classList.toggle("open");
        extra.classList.toggle("open");
    });
});

/* ---------------- DIM OVERLAY ON CARD HOVER ---------------- */
const dim = $("#dim-overlay");

if (dim) {
    $$(".card-3d").forEach(card => {
        card.addEventListener("mouseenter", () => dim.classList.add("active"));
        card.addEventListener("mouseleave", () => dim.classList.remove("active"));
    });
}

/* ---------------- PARTICLE BACKGROUND ---------------- */
const canvas = $("#particle-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

let particles = [];
const particleCount = 42;

function resizeCanvas() {
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function spawnParticleWithSpacing(minDist = 58) {
    if (!canvas) return { x: 0, y: 0 };

    let x = 0;
    let y = 0;
    let attempts = 0;

    while (attempts < 80) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;

        const valid = particles.every(p => {
            const dx = x - p.x;
            const dy = y - p.y;
            return Math.sqrt(dx * dx + dy * dy) >= minDist;
        });

        if (valid) break;

        attempts++;
    }

    return { x, y };
}

class Particle {
    constructor() {
        const pos = spawnParticleWithSpacing();

        this.x = pos.x;
        this.y = pos.y;
        this.size = 2 + Math.random() * 5;
        this.depth = Math.random();

        const speed = 0.08 + this.depth * 0.26;

        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
    }

    update(mouse, scrollSpeed) {
        if (!canvas) return;

        this.y += scrollSpeed * (0.01 + this.depth * 0.04);

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1 && dist < 145) {
            const force = (145 - dist) / 145;
            const nx = dx / dist;
            const ny = dy / dist;

            this.vx += nx * force * (0.42 + this.depth);
            this.vy += ny * force * (0.42 + this.depth);
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
        if (!ctx) return;

        const alpha = 0.18 + this.depth * 0.42;

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

if (canvas && ctx) {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

const mouse = {
    x: -9999,
    y: -9999
};

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

function resolveParticleCollisions() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = p1.size + p2.size + 2;

            if (dist <= 0 || dist >= minDist) continue;

            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            const rvx = p2.vx - p1.vx;
            const rvy = p2.vy - p1.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal > 0) continue;

            const impulse = -velAlongNormal;

            p1.vx -= impulse * nx;
            p1.vy -= impulse * ny;
            p2.vx += impulse * nx;
            p2.vy += impulse * ny;
        }
    }
}

function animateParticles() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => particle.update(mouse, scrollSpeed));
    resolveParticleCollisions();
    particles.forEach(particle => particle.draw());

    scrollSpeed *= 0.9;

    requestAnimationFrame(animateParticles);
}

animateParticles();
