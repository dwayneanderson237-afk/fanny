/*
  Fanny's Bites - UI + content rendering
  - Navigation toggle + scroll reveal
  - Floating icon parallax
  - Hero slider
  - Cart with tray sizes
  - Admin content manager (server-backed)
*/

const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const debugUI = new URLSearchParams(window.location.search).has('debug');
const logUI = (...args) => {
  if (debugUI) {
    // eslint-disable-next-line no-console
    console.log('[ui]', ...args);
  }
};

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('.primary-nav');

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// Scroll reveal
let revealObserver = null;
const setupReveal = () => {
  const revealItems = document.querySelectorAll('.reveal');
  if (!revealItems.length) return;

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
};

const observeReveals = () => {
  if (!revealObserver) return;
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((item) => {
    revealObserver.observe(item);
  });
};

setupReveal();

const updateScrollState = () => {
  if (!body) return;
  body.classList.toggle('scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

// Floating icon parallax
const floatIcons = document.querySelectorAll('.float-icon');
if (floatIcons.length && !reduceMotion) {
  let lastKnownScrollY = 0;
  let ticking = false;

  const updateParallax = () => {
    floatIcons.forEach((icon) => {
      const speed = Number(icon.dataset.speed || 0.2);
      const offset = lastKnownScrollY * speed * 0.15;
      icon.style.setProperty('--scroll-offset', `${offset}px`);
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    lastKnownScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  updateParallax();
}

// Helpers
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const parseNumber = (value) => Number(String(value).replace(/[^0-9.]/g, '')) || 0;
const getMinPrice = (sizes = []) =>
  sizes.reduce((min, size) => (size.price < min ? size.price : min), sizes[0]?.price ?? 0);

// Toast / announcer
let toast = document.querySelector('.toast');
if (!toast) {
  toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  body.appendChild(toast);
}

let announcer = document.querySelector('#cart-announcer');
if (!announcer) {
  announcer = document.createElement('div');
  announcer.className = 'sr-only';
  announcer.id = 'cart-announcer';
  announcer.setAttribute('aria-live', 'polite');
  body.appendChild(announcer);
}

let toastTimer = null;
const announce = (message) => {
  if (announcer) {
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 10);
  }
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
};

// Default content (fallback)
const DEFAULT_CONTENT = {
  site: {
    name: "Fanny's Bites",
    tagline: 'Signature snacks made fresh.',
    description: 'Signature Nigerian snacks made fresh daily.',
  },
  heroSlides: [
    {
      title: 'Signature snacks made fresh.',
      subtitle: 'Crunchy, golden, and ready to share.',
      image:
        'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1800&q=80',
    },
    {
      title: 'Tray sizes for every celebration.',
      subtitle: 'Small, medium, and large trays for any crowd.',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1800&q=80',
    },
    {
      title: 'Order your favorites today.',
      subtitle: 'Fish rolls, egg rolls, meat pies, and more.',
      image:
        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1800&q=80',
    },
  ],
  menu: {
    title: 'Fresh, savory, and ready to savor',
    subtitle: 'Tap any item to see a bigger photo and details.',
  },
  products: [
    {
      id: 'chin-chin',
      name: 'Chin Chin',
      desc: 'Crunchy bite-size dough, lightly spiced and fried to golden perfection.',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
      featured: true,
      recommended: true,
      sizes: [
        { size: 'Small', price: 55, count: null },
        { size: 'Medium', price: 90, count: null },
        { size: 'Large', price: 110, count: null },
      ],
    },
    {
      id: 'fish-roll',
      name: 'Fish Roll',
      desc: 'Flaky pastry roll filled with seasoned fish.',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      featured: true,
      recommended: true,
      sizes: [
        { size: 'Small', price: 60, count: 45 },
        { size: 'Medium', price: 100, count: 80 },
        { size: 'Large', price: 120, count: 90 },
      ],
    },
    {
      id: 'egg-roll',
      name: 'Egg Roll',
      desc: 'Soft, sweet dough wrapped around a seasoned egg center.',
      image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
      featured: true,
      recommended: true,
      sizes: [
        { size: 'Small', price: 80, count: 30 },
        { size: 'Medium', price: 120, count: 45 },
        { size: 'Large', price: 160, count: 60 },
      ],
    },
    {
      id: 'akara',
      name: 'Akara Beans',
      desc: 'Whipped bean fritters with a soft center and crisp edges.',
      image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
      featured: true,
      recommended: true,
      sizes: [
        { size: 'Small', price: 80, count: null },
        { size: 'Medium', price: 120, count: null },
        { size: 'Large', price: 160, count: null },
      ],
    },
    {
      id: 'puff-puff',
      name: 'Puff Puff Balls',
      desc: 'Soft, airy dough balls with a light golden crust.',
      image: 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
      featured: false,
      recommended: false,
      sizes: [
        { size: 'Small', price: 50, count: 50 },
        { size: 'Medium', price: 80, count: 80 },
        { size: 'Large', price: 100, count: 120 },
      ],
    },
    {
      id: 'doughnut',
      name: 'Doughnut Balls',
      desc: 'Pillowy doughnut bites finished with a light sugar dusting.',
      image:
        'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f5f8?auto=format&fit=crop&w=1200&q=80',
      featured: false,
      recommended: false,
      sizes: [
        { size: 'Small', price: 45, count: null },
        { size: 'Medium', price: 70, count: null },
        { size: 'Large', price: 95, count: null },
      ],
    },
    {
      id: 'meat-pie',
      name: 'Meat Pie',
      desc: 'Flaky pastry filled with savory minced meat and spices.',
      image:
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
      featured: false,
      recommended: false,
      sizes: [
        { size: 'Small', price: 90, count: 20 },
        { size: 'Medium', price: 130, count: 35 },
        { size: 'Large', price: 170, count: 50 },
      ],
    },
  ],
  combos: [
    { name: 'Budget Duo', items: ['15 Fishrolls', '15 Eggrolls'], price: 58 },
    { name: 'Classic Duo', items: ['20 Fishrolls', '20 Eggrolls'], price: 77 },
    { name: 'Share Duo', items: ['25 Fishrolls', '25 Eggrolls'], price: 97 },
    {
      name: 'Snack Trio',
      items: ['20 Fishrolls', '20 Eggrolls', '20 Doughnut Balls'],
      price: 92,
    },
    {
      name: 'Savory Trio',
      items: ['20 Fishrolls', '20 Meat Pies', '20 Eggrolls'],
      price: 117,
    },
    {
      name: 'Party Mix',
      items: ['50 Puff Puff Balls', '20 Fishrolls', '20 Meat Pies'],
      price: 97,
    },
  ],
  promos: [
    { title: 'Tray Specials', description: 'Save on medium + large trays every weekend.' },
    { title: 'Family Pack', description: 'Mix any two trays and save $10.' },
    { title: 'Office Delivery', description: 'Book bulk trays 48 hours ahead for office events.' },
  ],
  testimonials: [
    { quote: 'The chin chin is perfectly crunchy. I stock up every week.', name: 'Mia T.' },
    { quote: 'Fish rolls were flaky and flavorful. Big crowd favorite.', name: 'Jordan P.' },
    { quote: 'Akara beans came out hot and fluffy. Loved the texture.', name: 'Lila K.' },
  ],
  about: {
    title: 'Made with love & passion',
    paragraphs: [
      "Fanny's Bites is a neighborhood snack shop focused on warm hospitality, careful technique, and joyful flavors.",
      'Our mission is simple: make chin chin, akara beans, egg rolls, fish rolls, and meat pies fresh each day, and make every visit feel like a treat.',
      'We use quality ingredients, bold spices, and a touch of sweetness to keep every bite balanced and bright.',
    ],
  },
  contact: {
    address: '145 Lemon Lane, Suite B, Sunnyvale',
    phone: '(123) 456-7890',
    map: 'maps.google.com/?q=145+Lemon+Lane+Sunnyvale',
    hours: [
      { label: 'Mon - Fri', value: '7:00 AM - 7:00 PM' },
      { label: 'Sat', value: '8:00 AM - 6:00 PM' },
      { label: 'Sun', value: '8:00 AM - 3:00 PM' },
    ],
    whatsapp: '#',
  },
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'TikTok', href: '#' },
  ],
};

const contentState = {
  data: DEFAULT_CONTENT,
  productsById: {},
};

const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

const fetchAdmin = async (url, options = {}) => {
  try {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
};

const loadContent = async () => {
  const content = (await fetchJson('/api/content')) || DEFAULT_CONTENT;
  contentState.data = content;
  contentState.productsById = Object.fromEntries(
    (content.products || []).map((product) => [product.id, product])
  );
  renderSite(content);
};

// Rendering helpers

const renderHeroSlider = (content) => {
  const slider = document.querySelector('[data-hero-slider]');
  const dotsWrap = document.querySelector('[data-hero-dots]');
  if (!slider) return;

  const slides = content.heroSlides || [];
  slider.innerHTML = slides
    .map(
      (slide, index) => `
      <div class="hero-slide${index === 0 ? ' is-active' : ''}" data-hero-slide="${index}">
        <div class="hero-media">
          <img src="${slide.image}" alt="${slide.title}" loading="eager" decoding="async" />
        </div>
        <div class="hero-content reveal">
          <p class="eyebrow">Signature Snacks</p>
          <h1>${slide.title}</h1>
          <p>${slide.subtitle}</p>
          <div class="hero-actions">
            <a class="btn primary" href="menu.html">View Menu</a>
            <a class="btn ghost" href="cart.html">View Cart</a>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  if (dotsWrap) {
    dotsWrap.innerHTML = slides
      .map(
        (_, index) =>
          `<button class="hero-dot${index === 0 ? ' is-active' : ''}" data-hero-dot="${index}" aria-label="Go to slide ${index + 1}"></button>`
      )
      .join('');
  }

  initHeroSlider(slides.length);
  updateHeroImageFit();
  observeReveals();
};

const updateHeroImageFit = () => {
  const images = document.querySelectorAll('.hero-media img');
  if (!images.length) return;
  images.forEach((img) => {
    const media = img.closest('.hero-media');
    if (!media) return;
    const applyFit = () => {
      const containerRatio = media.clientWidth / media.clientHeight || 1;
      const imageRatio = img.naturalWidth / img.naturalHeight || 1;
      const diff = Math.abs(imageRatio - containerRatio);
      media.classList.toggle('is-contain', diff > 0.25);
    };
    if (img.complete) {
      applyFit();
    } else {
      img.addEventListener('load', applyFit, { once: true });
    }
  });
};

window.addEventListener('resize', () => {
  updateHeroImageFit();
});

let heroInterval = null;
const initHeroSlider = (count) => {
  if (!count) return;
  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  let current = 0;

  const goTo = (index) => {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === index);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === index);
    });
    current = index;
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = Number(dot.dataset.heroDot);
      goTo(target);
    });
  });

  if (!reduceMotion && count > 1) {
    if (heroInterval) window.clearInterval(heroInterval);
    heroInterval = window.setInterval(() => {
      const next = (current + 1) % count;
      goTo(next);
    }, 6500);
  }
};

const renderPromos = (content) => {
  const wrap = document.querySelector('[data-promos]');
  if (!wrap) return;
  wrap.innerHTML = (content.promos || [])
    .map(
      (promo, index) => `
      <div class="promo-card ${index % 3 === 0 ? 'promo-rose' : index % 3 === 1 ? 'promo-lemon' : 'promo-mint'} reveal">
        <h3>${promo.title}</h3>
        <p>${promo.description}</p>
        <a class="btn primary" href="menu.html">View Menu</a>
      </div>
    `
    )
    .join('');
  observeReveals();
};

const renderCombos = (content) => {
  const wraps = document.querySelectorAll('[data-combos]');
  if (!wraps.length) return;
  const cards = (content.combos || [])
    .map(
      (combo) => `
      <article class="combo-card reveal">
        <h3>${combo.name}</h3>
        <ul>
          ${combo.items.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <p class="price">${formatCurrency(combo.price)}</p>
      </article>
    `
    )
    .join('');
  wraps.forEach((wrap) => {
    wrap.innerHTML = cards;
  });
  observeReveals();
};

const renderTestimonials = (content) => {
  const wrap = document.querySelector('[data-testimonials]');
  if (!wrap) return;
  wrap.innerHTML = (content.testimonials || [])
    .map(
      (review, index) => `
      <article class="card review reveal">
        <div class="stars">★★★★★</div>
        <p>"${review.quote}"</p>
        <p class="subtle">— ${review.name}</p>
        ${
          index === 0
            ? `<span class="float-icon small" style="--x: 78%; --y: 10%;" data-speed="0.12">
                <img src="https://openmoji.org/data/color/svg/1F369.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </span>`
            : ''
        }
      </article>
    `
    )
    .join('');
  observeReveals();
};

const buildProductCard = (product, { variant = 'card' } = {}) => `
  <article class="${variant === 'menu' ? 'menu-item' : 'card'} product-card reveal" data-product-card data-product-id="${product.id}" role="button" tabindex="0" aria-label="View sizes for ${product.name}">
    <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" />
    <div class="${variant === 'menu' ? 'menu-body' : 'product-body'}">
      <h3>${product.name}</h3>
      <p class="subtle">Tap to choose a tray size</p>
      <p class="price micro">From ${formatCurrency(getMinPrice(product.sizes || []))}</p>
    </div>
  </article>
`;

const renderProducts = (content) => {
  const featuredWrap = document.querySelector('[data-featured-products]');
  if (featuredWrap) {
    const featured = (content.products || []).filter((product) => product.featured);
    featuredWrap.innerHTML = featured.map((product) => buildProductCard(product)).join('');
  }

  const menuWrap = document.querySelector('[data-menu-products]');
  if (menuWrap) {
    menuWrap.innerHTML = (content.products || [])
      .map((product) => buildProductCard(product, { variant: 'menu' }))
      .join('');
  }

  const recommendedWrap = document.querySelector('[data-recommended-products]');
  if (recommendedWrap) {
    const recommended = (content.products || []).filter((product) => product.recommended);
    recommendedWrap.innerHTML = recommended.map((product) => buildProductCard(product)).join('');
  }

  observeReveals();
};

const renderAbout = (content) => {
  const title = document.querySelector('[data-about-title]');
  const paragraphsWrap = document.querySelector('[data-about-paragraphs]');
  if (title) title.textContent = content.about?.title || title.textContent;
  if (paragraphsWrap && Array.isArray(content.about?.paragraphs)) {
    paragraphsWrap.innerHTML = content.about.paragraphs
      .map((text, index) => `<p class="${index === content.about.paragraphs.length - 1 ? 'subtle' : ''}">${text}</p>`)
      .join('');
  }
};

const renderFooter = (content) => {
  document.querySelectorAll('[data-site-name]').forEach((el) => {
    el.textContent = content.site?.name || el.textContent;
  });
  document.querySelectorAll('[data-site-description]').forEach((el) => {
    el.textContent =
      content.site?.description ||
      'Signature snacks made fresh daily.';
  });
  document.querySelectorAll('[data-contact-address]').forEach((el) => {
    el.textContent = content.contact?.address || el.textContent;
  });
  document.querySelectorAll('[data-contact-map]').forEach((el) => {
    el.textContent = content.contact?.map || el.textContent;
  });
  document.querySelectorAll('[data-contact-phone]').forEach((el) => {
    el.textContent = content.contact?.phone || el.textContent;
  });
  document.querySelectorAll('[data-contact-whatsapp]').forEach((el) => {
    el.setAttribute('href', content.contact?.whatsapp || '#');
  });
  document.querySelectorAll('[data-contact-hours]').forEach((wrap) => {
    if (!Array.isArray(content.contact?.hours)) return;
    wrap.innerHTML = content.contact.hours
      .map((hour) => `<p>${hour.label}: ${hour.value}</p>`)
      .join('');
  });
  document.querySelectorAll('[data-social-links]').forEach((wrap) => {
    if (!Array.isArray(content.socials)) return;
    wrap.innerHTML = content.socials
      .map((social) => `<a href="${social.href}">${social.label}</a>`)
      .join('');
  });
};

const renderSite = (content) => {
  renderHeroSlider(content);
  renderProducts(content);
  renderPromos(content);
  renderCombos(content);
  renderTestimonials(content);
  renderAbout(content);
  const menuTitle = document.querySelector('[data-menu-title]');
  const menuSubtitle = document.querySelector('[data-menu-subtitle]');
  if (menuTitle) {
    menuTitle.textContent = content.menu?.title || menuTitle.textContent;
  }
  if (menuSubtitle) {
    menuSubtitle.textContent = content.menu?.subtitle || menuSubtitle.textContent;
  }
  renderFooter(content);
  setupProductModal();
  updateCartCount();
  renderCart();
};

// Cart logic
const CART_KEY = 'fannys_cart';
const cartCountEls = document.querySelectorAll('.cart-count');
const mainContent = document.querySelector('main');

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const setCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
};

const updateCartCount = () => {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountEls.forEach((el) => {
    el.textContent = String(count);
  });
};

const addToCart = (product, sizeLabelValue) => {
  if (!product) return;
  const size = product.sizes?.find((entry) => entry.size === sizeLabelValue) || product.sizes?.[0];
  if (!size) return;

  const variantId = `${product.id}:${size.size}`;
  const cart = getCart();
  const existing = cart.find((item) => item.variantId === variantId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      variantId,
      name: product.name,
      size: size.size,
      count: size.count ?? null,
      price: size.price,
      image: product.image,
      qty: 1,
    });
  }
  setCart(cart);
  announce(`${product.name} (${size.size}) added to cart.`);
};

let modalReady = false;
// Product modal (used on any page with product cards)
const setupProductModal = () => {
  if (modalReady) return;
  const modal = document.querySelector('.modal');
  if (!modal) return;
  modalReady = true;

  const modalImage = modal.querySelector('#modal-image');
  const modalTitle = modal.querySelector('#modal-title');
  const modalPrice = modal.querySelector('#modal-price');
  const modalDesc = modal.querySelector('#modal-desc');
  const modalSizes = modal.querySelector('[data-modal-sizes]');
  const modalAddBtn = modal.querySelector('[data-modal-add]');
  let modalProduct = null;
  let selectedSize = null;
  let lastFocusedElement = null;

  const getFocusable = () =>
    Array.from(
      modal.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );

  const openModal = (product) => {
    lastFocusedElement = document.activeElement;
    modalProduct = product;

    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalTitle.textContent = product.name;
    modalPrice.textContent = formatCurrency(product.sizes?.[0]?.price ?? 0);
    modalDesc.textContent = product.desc;
    selectedSize = product.sizes?.[0]?.size || null;
    if (modalSizes) {
      modalSizes.innerHTML = '';
      const chips = document.createElement('div');
      chips.className = 'size-chips';
      chips.innerHTML = (product.sizes || [])
        .map((size, index) => {
          const countLabel = size.count ? ` (${size.count} pcs)` : '';
          return `<button class="size-chip${index === 0 ? ' is-active' : ''}" type="button" data-size="${size.size}" title="${size.size} • ${formatCurrency(size.price)}${countLabel}">${size.size}</button>`;
        })
        .join('');
      modalSizes.appendChild(chips);

      const setActiveChip = (value) => {
        chips.querySelectorAll('.size-chip').forEach((chip) => {
          chip.classList.toggle('is-active', chip.dataset.size === value);
        });
      };

      chips.addEventListener('click', (event) => {
        const chip = event.target.closest('.size-chip');
        if (!chip) return;
        const selected = product.sizes?.find((entry) => entry.size === chip.dataset.size);
        if (selected) {
          selectedSize = selected.size;
          modalPrice.textContent = formatCurrency(selected.price);
          setActiveChip(selected.size);
        }
      });
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    if (mainContent) {
      mainContent.setAttribute('aria-hidden', 'true');
    }

    const focusable = getFocusable();
    if (focusable.length) {
      window.setTimeout(() => focusable[0].focus(), 0);
    }
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    if (mainContent) {
      mainContent.removeAttribute('aria-hidden');
    }
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  const openFromCard = (card) => {
    if (!card) return;
    const product = contentState.productsById[card.dataset.productId];
    if (!product) return;
    openModal(product);
  };

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-product-card]');
    if (card) {
      openFromCard(card);
      return;
    }
    if (event.target.dataset.close === 'modal') {
      closeModal();
    }
  });

  if (modalAddBtn) {
    modalAddBtn.addEventListener('click', () => {
      if (!modalProduct) return;
      const sizeValue = selectedSize || modalProduct.sizes?.[0]?.size;
      addToCart(modalProduct, sizeValue);
      closeModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }

    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.matches('[data-product-card]')) {
      event.preventDefault();
      openFromCard(document.activeElement);
    }

    if (event.key === 'Tab' && modal.classList.contains('is-open')) {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
};

// Cart page rendering
const cartList = document.querySelector('[data-cart-items]');
const cartSubtotal = document.querySelector('[data-cart-subtotal]');
const cartTotal = document.querySelector('[data-cart-total]');

const renderCart = () => {
  if (!cartList) return;
  const cart = getCart();
  cartList.innerHTML = '';

  if (!cart.length) {
    cartList.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p class="subtle">Browse the menu and add your favorite snacks.</p>
        <a class="btn primary" href="menu.html">View Menu</a>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = formatCurrency(0);
    if (cartTotal) cartTotal.textContent = formatCurrency(0);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-info">
        <h3>${item.name}</h3>
        <p class="subtle">${item.size} tray${item.count ? ` • ${item.count} pcs` : ''}</p>
        <p class="price">${formatCurrency(item.price)}</p>
      </div>
      <div>
        <div class="cart-controls">
          <button type="button" data-cart-action="dec" data-id="${item.variantId}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-cart-action="inc" data-id="${item.variantId}">+</button>
        </div>
        <div style="margin-top: 0.6rem; text-align: right;">
          <button class="btn ghost" type="button" data-cart-action="remove" data-id="${item.variantId}">Remove</button>
        </div>
      </div>
    `;
    cartList.appendChild(row);
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (cartSubtotal) cartSubtotal.textContent = formatCurrency(subtotal);
  if (cartTotal) cartTotal.textContent = formatCurrency(subtotal);
};

if (cartList) {
  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const cart = getCart();
    const item = cart.find((entry) => entry.variantId === button.dataset.id);
    if (!item) return;
    let message = '';

    if (button.dataset.cartAction === 'inc') {
      item.qty += 1;
      message = `${item.name} quantity increased.`;
    }
    if (button.dataset.cartAction === 'dec') {
      item.qty -= 1;
      if (item.qty <= 0) {
        cart.splice(cart.indexOf(item), 1);
        message = `${item.name} removed from cart.`;
      } else {
        message = `${item.name} quantity decreased.`;
      }
    }
    if (button.dataset.cartAction === 'remove') {
      cart.splice(cart.indexOf(item), 1);
      message = `${item.name} removed from cart.`;
    }

    setCart(cart);
    renderCart();
    if (message) {
      announce(message);
    }
  });
}

// Admin panel (server-backed)
const adminLogin = document.querySelector('[data-admin-login]');
const adminEditor = document.querySelector('[data-admin-editor]');
const adminSaveBtn = document.querySelector('[data-admin-save]');
const adminResetBtn = document.querySelector('[data-admin-reset]');
const adminLogout = document.querySelector('[data-admin-logout]');

const adminState = {
  content: null,
  dashboard: null,
  orders: [],
  inventory: [],
};

const orderRows = document.querySelector('[data-order-rows]');
const orderEmpty = document.querySelector('[data-order-empty]');
const orderSearch = document.querySelector('[data-order-search]');
const orderStatusFilter = document.querySelector('[data-order-status]');
const orderDateFilter = document.querySelector('[data-order-date]');
const orderAddBtn = document.querySelector('[data-order-add]');
const quickStatEls = {
  featured: document.querySelector('[data-quick-stat="featured"]'),
  promos: document.querySelector('[data-quick-stat="promos"]'),
  inventory: document.querySelector('[data-quick-stat="inventory"]'),
};
const statValueEls = {
  orders: document.querySelector('[data-stat-value="orders"]'),
  revenue: document.querySelector('[data-stat-value="revenue"]'),
  inventory: document.querySelector('[data-stat-value="inventory"]'),
};
const statNoteEls = {
  orders: document.querySelector('[data-stat-note="orders"]'),
  revenue: document.querySelector('[data-stat-note="revenue"]'),
};
const statInventoryList = document.querySelector('[data-stat-inventory]');

const orderStatusLabels = [
  { value: 'ready', label: 'Ready' },
  { value: 'prep', label: 'In Prep' },
  { value: 'delivered', label: 'Delivered' },
];

const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const itemsToText = (items = []) =>
  items
    .map((item) => {
      if (!item?.name) return '';
      return item.qty && item.qty !== 1 ? `${item.qty}x ${item.name}` : item.name;
    })
    .filter(Boolean)
    .join(', ');

const parseItemsText = (text = '') =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)\s*x?\s*(.+)$/i);
      if (match) {
        return { qty: Number(match[1]) || 1, name: match[2].trim() };
      }
      return { qty: 1, name: part };
    });

const formatOrderItems = (items = []) => itemsToText(items);

const generateOrderId = () =>
  `FNY-${Math.floor(1000 + Math.random() * 9000)}`;

const computeTopSeller = (orders = []) => {
  const counts = new Map();
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const name = item.name;
      if (!name) return;
      const current = counts.get(name) || 0;
      counts.set(name, current + (item.qty || 1));
    });
  });
  let top = '';
  let max = 0;
  counts.forEach((count, name) => {
    if (count > max) {
      max = count;
      top = name;
    }
  });
  return top ? { name: top, count: max } : null;
};

const renderAdminStats = () => {
  if (!statValueEls.orders && !statValueEls.revenue && !statValueEls.inventory) return;
  const today = getTodayISO();
  const ordersToday = adminState.orders.filter((order) => order.date === today);
  const revenueToday = ordersToday.reduce((sum, order) => sum + (order.total || 0), 0);
  const topSeller = computeTopSeller(adminState.orders);

  if (statValueEls.orders) statValueEls.orders.textContent = String(ordersToday.length);
  if (statNoteEls.orders) {
    statNoteEls.orders.textContent = `${ordersToday.length} scheduled for today`;
  }
  if (statValueEls.revenue) statValueEls.revenue.textContent = formatCurrency(revenueToday);
  if (statNoteEls.revenue) {
    statNoteEls.revenue.textContent = topSeller
      ? `Top seller: ${topSeller.name}`
      : 'Top seller: —';
  }
  if (statValueEls.inventory) {
    statValueEls.inventory.textContent = `${adminState.inventory.length} Items`;
  }
  if (statInventoryList) {
    statInventoryList.innerHTML = adminState.inventory
      .map((item) => `<li>${item.item} — ${item.level}${item.note ? ` (${item.note})` : ''}</li>`)
      .join('');
  }
};

const updateQuickStats = () => {
  if (!contentState.data) return;
  const featuredCount = (contentState.data.products || []).filter((p) => p.featured).length;
  const promoCount = (contentState.data.promos || []).length;
  if (quickStatEls.featured) quickStatEls.featured.textContent = `${featuredCount} Active`;
  if (quickStatEls.promos) quickStatEls.promos.textContent = `${promoCount} Offers`;
  if (quickStatEls.inventory) quickStatEls.inventory.textContent = `${adminState.inventory.length} Low Stock`;
};

const renderAdminOrders = () => {
  if (!orderRows) return;
  const searchValue = orderSearch?.value.trim().toLowerCase() || '';
  const statusValue = orderStatusFilter?.value || '';
  const dateValue = orderDateFilter?.value || '';

  const filtered = adminState.orders.filter((order) => {
    const matchesSearch =
      !searchValue ||
      order.id.toLowerCase().includes(searchValue) ||
      order.customer.toLowerCase().includes(searchValue) ||
      formatOrderItems(order.items).toLowerCase().includes(searchValue);
    const matchesStatus = !statusValue || order.status === statusValue;
    const matchesDate = !dateValue || order.date === dateValue;
    return matchesSearch && matchesStatus && matchesDate;
  });

  orderRows.innerHTML = '';
  if (!filtered.length) {
    if (orderEmpty) orderEmpty.hidden = false;
    return;
  }
  if (orderEmpty) orderEmpty.hidden = true;

  filtered.forEach((order) => {
    const row = document.createElement('tr');
    row.dataset.orderId = order.id;
    const orderDate = order.date || getTodayISO();
    const orderTotal = Number.isFinite(order.total) ? order.total : 0;
    const statusValue = order.status || 'prep';
    const options = orderStatusLabels
      .map(
        (option) =>
          `<option value="${option.value}" ${statusValue === option.value ? 'selected' : ''}>${option.label}</option>`
      )
      .join('');
    row.innerHTML = `
      <td>#${order.id}</td>
      <td><input type="text" data-order-field="customer" value="${escapeHtml(order.customer || '')}" /></td>
      <td><textarea rows="2" data-order-field="items">${escapeHtml(itemsToText(order.items))}</textarea></td>
      <td><input type="text" data-order-field="pickup" value="${escapeHtml(order.pickup || '')}" /></td>
      <td><input type="date" data-order-field="date" value="${escapeHtml(orderDate)}" /></td>
      <td>
        <select data-order-status-select data-order-id="${order.id}" aria-label="Update status for order ${order.id}">
          ${options}
        </select>
      </td>
      <td><input type="number" step="0.01" data-order-field="total" value="${escapeHtml(orderTotal)}" /></td>
      <td class="admin-actions-cell">
        <button class="btn ghost" type="button" data-order-action="save">Save</button>
        <button class="btn ghost" type="button" data-order-action="delete">Delete</button>
      </td>
    `;
    orderRows.appendChild(row);
  });
};

const loadAdminDashboard = async () => {
  const response = await fetchAdmin('/api/admin/dashboard');
  if (!response.ok || !response.data) return;
  adminState.dashboard = response.data;
  adminState.orders = response.data.orders || [];
  adminState.inventory = response.data.inventory || [];
  renderAdminStats();
  renderAdminOrders();
  updateQuickStats();
  logUI('Admin dashboard loaded', adminState.dashboard);
};

const updateOrderStatus = async (orderId, status) => {
  const response = await fetchAdmin(`/api/admin/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok || !response.data?.ok) {
    announce(response.data?.error || 'Order update failed.');
    return;
  }
  const target = adminState.orders.find((order) => order.id === orderId);
  if (target) target.status = status;
  renderAdminOrders();
  announce('Order updated.');
};

const saveOrderRow = async (row) => {
  const orderId = row.dataset.orderId;
  const updated = {
    customer: row.querySelector('[data-order-field="customer"]')?.value.trim() || '',
    pickup: row.querySelector('[data-order-field="pickup"]')?.value.trim() || '',
    date: row.querySelector('[data-order-field="date"]')?.value || '',
    status: row.querySelector('[data-order-status-select]')?.value || 'ready',
    total: parseNumber(row.querySelector('[data-order-field="total"]')?.value || 0),
    items: parseItemsText(row.querySelector('[data-order-field="items"]')?.value || ''),
  };

  const response = await fetchAdmin(`/api/admin/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });

  if (!response.ok || !response.data?.ok) {
    announce(response.data?.error || 'Order update failed.');
    return;
  }
  const target = adminState.orders.find((order) => order.id === orderId);
  if (target) Object.assign(target, updated);
  renderAdminStats();
  renderAdminOrders();
  announce('Order saved.');
};

const deleteOrderRow = async (orderId) => {
  const response = await fetchAdmin(`/api/admin/orders/${orderId}`, {
    method: 'DELETE',
  });
  if (!response.ok || !response.data?.ok) {
    announce(response.data?.error || 'Delete failed.');
    return;
  }
  adminState.orders = adminState.orders.filter((order) => order.id !== orderId);
  renderAdminStats();
  renderAdminOrders();
  updateQuickStats();
  announce('Order removed.');
};

const addNewOrder = async () => {
  const today = getTodayISO();
  const draft = {
    id: generateOrderId(),
    customer: 'New Customer',
    items: [{ name: 'Chin Chin', qty: 1 }],
    pickup: '12:00 PM',
    status: 'prep',
    date: today,
    total: 0,
  };
  const response = await fetchAdmin('/api/admin/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  if (!response.ok || !response.data?.ok) {
    announce(response.data?.error || 'Unable to create order.');
    return;
  }
  adminState.orders.unshift(response.data.order);
  renderAdminStats();
  renderAdminOrders();
  announce('Order added.');
};

const applyProductFilter = () => {
  if (!adminEditor) return;
  const filter = adminEditor.querySelector('[data-admin-filter="featured"]');
  const cards = adminEditor.querySelectorAll('[data-admin-product]');
  if (!filter) return;
  cards.forEach((card) => {
    const isFeatured = card.dataset.featured === 'true';
    card.classList.toggle('is-hidden', filter.checked && !isFeatured);
  });
};

const flashSection = (section) => {
  if (!section) return;
  section.classList.add('admin-flash');
  window.setTimeout(() => section.classList.remove('admin-flash'), 1400);
};

const scrollToAdminSection = (key) => {
  if (!adminEditor) return;
  const section = adminEditor.querySelector(`[data-admin-section="${key}"]`);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  flashSection(section);
};

const setAdminLocked = (locked) => {
  if (!adminLogin) return;
  body.classList.toggle('admin-locked', locked);
  adminLogin.hidden = !locked;
};

const renderAdminEditor = (content) => {
  if (!adminEditor) return;
  const slideCards = (content.heroSlides || [])
    .map(
      (slide) => `
      <div class="admin-card" data-admin-slide>
        <div class="admin-grid">
          <label class="admin-field">Title
            <input type="text" data-field="title" value="${slide.title}" />
          </label>
          <label class="admin-field">Subtitle
            <input type="text" data-field="subtitle" value="${slide.subtitle}" />
          </label>
          <label class="admin-field">Image URL
            <input type="url" data-field="image" value="${slide.image}" />
          </label>
        </div>
        <div class="admin-upload">
          <label class="btn ghost">
            Upload Image
            <input type="file" accept="image/*" data-upload-input hidden />
          </label>
          <span class="admin-upload-status" data-upload-status></span>
        </div>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="slide">Remove Slide</button>
        </div>
      </div>
    `
    )
    .join('');

  const productCards = (content.products || [])
    .map(
      (product) => `
      <div class="admin-card" data-admin-product data-product-id="${product.id}" data-featured="${product.featured}" data-recommended="${product.recommended}">
        <div class="admin-grid">
          <label class="admin-field">Product ID
            <input type="text" data-field="id" value="${product.id}" />
          </label>
          <label class="admin-field">Name
            <input type="text" data-field="name" value="${product.name}" />
          </label>
          <label class="admin-field">Image URL
            <input type="url" data-field="image" value="${product.image}" />
          </label>
        </div>
        <div class="admin-upload">
          <label class="btn ghost">
            Upload Image
            <input type="file" accept="image/*" data-upload-input hidden />
          </label>
          <span class="admin-upload-status" data-upload-status></span>
        </div>
        <label class="admin-field">Description
          <textarea rows="3" data-field="desc">${product.desc}</textarea>
        </label>
        <div class="admin-grid">
          ${['Small', 'Medium', 'Large']
            .map((sizeLabel) => {
              const size = product.sizes?.find((entry) => entry.size === sizeLabel) || {
                price: 0,
                count: '',
              };
              return `
                <label class="admin-field">${sizeLabel} Price
                  <input type="number" step="0.01" data-size="${sizeLabel}" data-field="price" value="${size.price}" />
                </label>
                <label class="admin-field">${sizeLabel} Count
                  <input type="number" data-size="${sizeLabel}" data-field="count" value="${size.count ?? ''}" />
                </label>
              `;
            })
            .join('')}
        </div>
        <div class="admin-inline">
          <label class="admin-field">
            <input type="checkbox" data-field="featured" ${product.featured ? 'checked' : ''} />
            Featured
          </label>
          <label class="admin-field">
            <input type="checkbox" data-field="recommended" ${product.recommended ? 'checked' : ''} />
            Recommended
          </label>
          <button class="btn ghost" type="button" data-admin-remove="product">Remove Product</button>
        </div>
      </div>
    `
    )
    .join('');

  const comboCards = (content.combos || [])
    .map(
      (combo) => `
      <div class="admin-card" data-admin-combo>
        <div class="admin-grid">
          <label class="admin-field">Combo Name
            <input type="text" data-field="name" value="${combo.name}" />
          </label>
          <label class="admin-field">Price
            <input type="number" step="0.01" data-field="price" value="${combo.price}" />
          </label>
        </div>
        <label class="admin-field">Items (one per line)
          <textarea rows="3" data-field="items">${combo.items.join('\n')}</textarea>
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="combo">Remove Combo</button>
        </div>
      </div>
    `
    )
    .join('');

  const promoCards = (content.promos || [])
    .map(
      (promo) => `
      <div class="admin-card" data-admin-promo>
        <label class="admin-field">Title
          <input type="text" data-field="title" value="${promo.title}" />
        </label>
        <label class="admin-field">Description
          <textarea rows="2" data-field="description">${promo.description}</textarea>
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="promo">Remove Promo</button>
        </div>
      </div>
    `
    )
    .join('');

  const testimonialCards = (content.testimonials || [])
    .map(
      (testimonial) => `
      <div class="admin-card" data-admin-testimonial>
        <label class="admin-field">Quote
          <textarea rows="2" data-field="quote">${testimonial.quote}</textarea>
        </label>
        <label class="admin-field">Name
          <input type="text" data-field="name" value="${testimonial.name}" />
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="testimonial">Remove Testimonial</button>
        </div>
      </div>
    `
    )
    .join('');

  const socialCards = (content.socials || [])
    .map(
      (social) => `
      <div class="admin-card" data-admin-social>
        <label class="admin-field">Label
          <input type="text" data-field="label" value="${social.label}" />
        </label>
        <label class="admin-field">URL
          <input type="url" data-field="href" value="${social.href}" />
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="social">Remove Social</button>
        </div>
      </div>
    `
    )
    .join('');

  const hoursCards = (content.contact?.hours || [])
    .map(
      (hour) => `
      <div class="admin-card" data-admin-hour>
        <div class="admin-grid">
          <label class="admin-field">Label
            <input type="text" data-field="label" value="${hour.label}" />
          </label>
          <label class="admin-field">Hours
            <input type="text" data-field="value" value="${hour.value}" />
          </label>
        </div>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="hour">Remove Row</button>
        </div>
      </div>
    `
    )
    .join('');

  adminEditor.innerHTML = `
    <section class="admin-section" data-admin-section="site">
      <h3>Site Info</h3>
      <label class="admin-field">Site Name
        <input type="text" data-site-field="name" value="${content.site?.name || ''}" />
      </label>
      <label class="admin-field">Site Description
        <input type="text" data-site-field="description" value="${content.site?.description || ''}" />
      </label>
    </section>

    <section class="admin-section" data-admin-section="slides">
      <h3>Hero Slides</h3>
      <p class="admin-muted">Edit the rotating hero messages and images.</p>
      <div class="admin-list" data-admin-list="slides">
        ${slideCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="slide">Add Slide</button>
      </div>
    </section>

    <section class="admin-section" data-admin-section="products">
      <h3>Products & Sizes</h3>
      <p class="admin-muted">Update prices, counts, and images. All products show Small/Medium/Large trays.</p>
      <div class="admin-inline">
        <label class="admin-field">
          <input type="checkbox" data-admin-filter="featured" />
          Show featured only
        </label>
      </div>
      <div class="admin-list" data-admin-list="products">
        ${productCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="product">Add Product</button>
      </div>
    </section>

    <section class="admin-section" data-admin-section="combos">
      <h3>Combo Trays</h3>
      <div class="admin-list" data-admin-list="combos">
        ${comboCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="combo">Add Combo</button>
      </div>
    </section>

    <section class="admin-section" data-admin-section="promos">
      <h3>Promotions</h3>
      <div class="admin-list" data-admin-list="promos">
        ${promoCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="promo">Add Promo</button>
      </div>
    </section>

    <section class="admin-section" data-admin-section="testimonials">
      <h3>Testimonials</h3>
      <div class="admin-list" data-admin-list="testimonials">
        ${testimonialCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="testimonial">Add Testimonial</button>
      </div>
    </section>

    <section class="admin-section" data-admin-section="about">
      <h3>About Section</h3>
      <label class="admin-field">Title
        <input type="text" data-about-field="title" value="${content.about?.title || ''}" />
      </label>
      <label class="admin-field">Paragraphs (one per line)
        <textarea rows="4" data-about-field="paragraphs">${(content.about?.paragraphs || []).join('\n')}</textarea>
      </label>
    </section>

    <section class="admin-section" data-admin-section="menu">
      <h3>Menu Intro</h3>
      <label class="admin-field">Menu Title
        <input type="text" data-menu-field="title" value="${content.menu?.title || ''}" />
      </label>
      <label class="admin-field">Menu Subtitle
        <input type="text" data-menu-field="subtitle" value="${content.menu?.subtitle || ''}" />
      </label>
    </section>

    <section class="admin-section" data-admin-section="contact">
      <h3>Contact Details</h3>
      <div class="admin-grid">
        <label class="admin-field">Address
          <input type="text" data-contact-field="address" value="${content.contact?.address || ''}" />
        </label>
        <label class="admin-field">Phone
          <input type="text" data-contact-field="phone" value="${content.contact?.phone || ''}" />
        </label>
        <label class="admin-field">Map Link
          <input type="text" data-contact-field="map" value="${content.contact?.map || ''}" />
        </label>
        <label class="admin-field">WhatsApp Link
          <input type="text" data-contact-field="whatsapp" value="${content.contact?.whatsapp || ''}" />
        </label>
      </div>
      <div class="admin-list" data-admin-list="hours">
        ${hoursCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="hour">Add Hours Row</button>
      </div>
    </section>

    <section class="admin-section">
      <h3>Social Links</h3>
      <div class="admin-list" data-admin-list="socials">
        ${socialCards}
      </div>
      <div class="admin-inline">
        <button class="btn ghost" type="button" data-admin-add="social">Add Social Link</button>
      </div>
    </section>
  `;
};

const collectAdminContent = () => {
  if (!adminEditor) return null;

  const slides = Array.from(adminEditor.querySelectorAll('[data-admin-slide]')).map((card) => ({
    title: card.querySelector('[data-field="title"]').value.trim(),
    subtitle: card.querySelector('[data-field="subtitle"]').value.trim(),
    image: card.querySelector('[data-field="image"]').value.trim(),
  }));

  const products = Array.from(adminEditor.querySelectorAll('[data-admin-product]')).map((card) => {
    const id = card.querySelector('[data-field="id"]').value.trim();
    const name = card.querySelector('[data-field="name"]').value.trim();
    const desc = card.querySelector('[data-field="desc"]').value.trim();
    const image = card.querySelector('[data-field="image"]').value.trim();
    const featured = card.querySelector('[data-field="featured"]').checked;
    const recommended = card.querySelector('[data-field="recommended"]').checked;
    const sizes = ['Small', 'Medium', 'Large'].map((label) => {
      const priceInput = card.querySelector(`[data-size="${label}"][data-field="price"]`);
      const countInput = card.querySelector(`[data-size="${label}"][data-field="count"]`);
      return {
        size: label,
        price: parseNumber(priceInput?.value),
        count: countInput?.value ? parseNumber(countInput.value) : null,
      };
    });
    return { id, name, desc, image, featured, recommended, sizes };
  });

  const combos = Array.from(adminEditor.querySelectorAll('[data-admin-combo]')).map((card) => ({
    name: card.querySelector('[data-field="name"]').value.trim(),
    price: parseNumber(card.querySelector('[data-field="price"]').value),
    items: card
      .querySelector('[data-field="items"]')
      .value.split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  }));

  const promos = Array.from(adminEditor.querySelectorAll('[data-admin-promo]')).map((card) => ({
    title: card.querySelector('[data-field="title"]').value.trim(),
    description: card.querySelector('[data-field="description"]').value.trim(),
  }));

  const testimonials = Array.from(adminEditor.querySelectorAll('[data-admin-testimonial]')).map(
    (card) => ({
      quote: card.querySelector('[data-field="quote"]').value.trim(),
      name: card.querySelector('[data-field="name"]').value.trim(),
    })
  );

  const aboutTitle = adminEditor.querySelector('[data-about-field="title"]').value.trim();
  const aboutParagraphs = adminEditor
    .querySelector('[data-about-field="paragraphs"]')
    .value.split('\n')
    .map((text) => text.trim())
    .filter(Boolean);

  const menuTitle = adminEditor.querySelector('[data-menu-field="title"]').value.trim();
  const menuSubtitle = adminEditor.querySelector('[data-menu-field="subtitle"]').value.trim();
  const siteName = adminEditor.querySelector('[data-site-field="name"]').value.trim();
  const siteDescription = adminEditor
    .querySelector('[data-site-field="description"]')
    .value.trim();

  const contact = {
    address: adminEditor.querySelector('[data-contact-field="address"]').value.trim(),
    phone: adminEditor.querySelector('[data-contact-field="phone"]').value.trim(),
    map: adminEditor.querySelector('[data-contact-field="map"]').value.trim(),
    whatsapp: adminEditor.querySelector('[data-contact-field="whatsapp"]').value.trim(),
    hours: Array.from(adminEditor.querySelectorAll('[data-admin-hour]')).map((card) => ({
      label: card.querySelector('[data-field="label"]').value.trim(),
      value: card.querySelector('[data-field="value"]').value.trim(),
    })),
  };

  const socials = Array.from(adminEditor.querySelectorAll('[data-admin-social]')).map((card) => ({
    label: card.querySelector('[data-field="label"]').value.trim(),
    href: card.querySelector('[data-field="href"]').value.trim(),
  }));

  return {
    ...contentState.data,
    site: {
      ...(contentState.data.site || {}),
      name: siteName,
      description: siteDescription,
    },
    heroSlides: slides,
    products,
    combos,
    promos,
    testimonials,
    about: { title: aboutTitle, paragraphs: aboutParagraphs },
    menu: { title: menuTitle, subtitle: menuSubtitle },
    contact,
    socials,
  };
};

const addAdminCard = (type) => {
  if (!adminEditor) return;
  const list = adminEditor.querySelector(`[data-admin-list="${type}s"]`) ||
    adminEditor.querySelector(`[data-admin-list="${type}"]`);
  if (!list) return;

  let cardHtml = '';
  if (type === 'slide') {
    cardHtml = `
      <div class="admin-card" data-admin-slide>
        <div class="admin-grid">
          <label class="admin-field">Title
            <input type="text" data-field="title" value="New slide title" />
          </label>
          <label class="admin-field">Subtitle
            <input type="text" data-field="subtitle" value="Short subtitle" />
          </label>
          <label class="admin-field">Image URL
            <input type="url" data-field="image" value="" />
          </label>
        </div>
        <div class="admin-upload">
          <label class="btn ghost">
            Upload Image
            <input type="file" accept="image/*" data-upload-input hidden />
          </label>
          <span class="admin-upload-status" data-upload-status></span>
        </div>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="slide">Remove Slide</button>
        </div>
      </div>
    `;
  }
  if (type === 'combo') {
    cardHtml = `
      <div class="admin-card" data-admin-combo>
        <div class="admin-grid">
          <label class="admin-field">Combo Name
            <input type="text" data-field="name" value="New Combo" />
          </label>
          <label class="admin-field">Price
            <input type="number" step="0.01" data-field="price" value="0" />
          </label>
        </div>
        <label class="admin-field">Items (one per line)
          <textarea rows="3" data-field="items"></textarea>
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="combo">Remove Combo</button>
        </div>
      </div>
    `;
  }
  if (type === 'promo') {
    cardHtml = `
      <div class="admin-card" data-admin-promo>
        <label class="admin-field">Title
          <input type="text" data-field="title" value="New Promo" />
        </label>
        <label class="admin-field">Description
          <textarea rows="2" data-field="description"></textarea>
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="promo">Remove Promo</button>
        </div>
      </div>
    `;
  }
  if (type === 'testimonial') {
    cardHtml = `
      <div class="admin-card" data-admin-testimonial>
        <label class="admin-field">Quote
          <textarea rows="2" data-field="quote"></textarea>
        </label>
        <label class="admin-field">Name
          <input type="text" data-field="name" value="" />
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="testimonial">Remove Testimonial</button>
        </div>
      </div>
    `;
  }
  if (type === 'social') {
    cardHtml = `
      <div class="admin-card" data-admin-social>
        <label class="admin-field">Label
          <input type="text" data-field="label" value="" />
        </label>
        <label class="admin-field">URL
          <input type="url" data-field="href" value="" />
        </label>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="social">Remove Social</button>
        </div>
      </div>
    `;
  }
  if (type === 'hour') {
    cardHtml = `
      <div class="admin-card" data-admin-hour>
        <div class="admin-grid">
          <label class="admin-field">Label
            <input type="text" data-field="label" value="" />
          </label>
          <label class="admin-field">Hours
            <input type="text" data-field="value" value="" />
          </label>
        </div>
        <div class="admin-inline">
          <button class="btn ghost" type="button" data-admin-remove="hour">Remove Row</button>
        </div>
      </div>
    `;
  }
  if (type === 'product') {
    cardHtml = `
      <div class="admin-card" data-admin-product data-product-id="new-product" data-featured="false" data-recommended="false">
        <div class="admin-grid">
          <label class="admin-field">Product ID
            <input type="text" data-field="id" value="new-product" />
          </label>
          <label class="admin-field">Name
            <input type="text" data-field="name" value="New Product" />
          </label>
          <label class="admin-field">Image URL
            <input type="url" data-field="image" value="" />
          </label>
        </div>
        <div class="admin-upload">
          <label class="btn ghost">
            Upload Image
            <input type="file" accept="image/*" data-upload-input hidden />
          </label>
          <span class="admin-upload-status" data-upload-status></span>
        </div>
        <label class="admin-field">Description
          <textarea rows="3" data-field="desc"></textarea>
        </label>
        <div class="admin-grid">
          ${['Small', 'Medium', 'Large']
            .map(
              (sizeLabel) => `
              <label class="admin-field">${sizeLabel} Price
                <input type="number" step="0.01" data-size="${sizeLabel}" data-field="price" value="0" />
              </label>
              <label class="admin-field">${sizeLabel} Count
                <input type="number" data-size="${sizeLabel}" data-field="count" value="" />
              </label>
            `
            )
            .join('')}
        </div>
        <div class="admin-inline">
          <label class="admin-field">
            <input type="checkbox" data-field="featured" />
            Featured
          </label>
          <label class="admin-field">
            <input type="checkbox" data-field="recommended" />
            Recommended
          </label>
          <button class="btn ghost" type="button" data-admin-remove="product">Remove Product</button>
        </div>
      </div>
    `;
  }

  if (cardHtml) {
    list.insertAdjacentHTML('beforeend', cardHtml);
  }
};

const uploadAdminImage = async (file, statusEl, targetInput) => {
  if (!file || !targetInput) return;
  if (statusEl) statusEl.textContent = 'Uploading...';
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      if (statusEl) statusEl.textContent = data?.error || 'Upload failed.';
      return;
    }
    targetInput.value = data.url;
    if (statusEl) statusEl.textContent = 'Uploaded!';
  } catch {
    if (statusEl) statusEl.textContent = 'Upload failed.';
  }
};

const setupAdmin = async () => {
  if (!adminEditor || !adminLogin) return;
  const loginForm = adminLogin.querySelector('form');
  const loginError = adminLogin.querySelector('[data-login-error]');

  const me = await fetchAdmin('/api/admin/me');
  if (me.ok && me.data?.user) {
    setAdminLocked(false);
    const contentResponse = await fetchAdmin('/api/admin/content');
    if (contentResponse.ok && contentResponse.data) {
      adminState.content = contentResponse.data;
      contentState.data = contentResponse.data;
      renderAdminEditor(contentResponse.data);
      applyProductFilter();
      updateQuickStats();
      loadAdminDashboard();
    }
  } else {
    setAdminLocked(true);
    if (!me.ok && me.status === 0 && loginError) {
      loginError.textContent =
        'Admin server not detected. Start the site with "npm run dev" and open http://localhost:5173/admin.html.';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = loginForm.querySelector('[name="username"]').value.trim();
      const passwordField = loginForm.querySelector('[name="password"]');
      const password = passwordField ? passwordField.value : '';
      if (!username) {
        if (loginError) loginError.textContent = 'Please enter a username.';
        return;
      }
      const response = await fetchAdmin('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordField ? { username, password } : { username }),
      });

      if (response.ok && response.data?.ok) {
        setAdminLocked(false);
        if (loginError) loginError.textContent = '';
        const contentResponse = await fetchAdmin('/api/admin/content');
        if (contentResponse.ok && contentResponse.data) {
          adminState.content = contentResponse.data;
          contentState.data = contentResponse.data;
          renderAdminEditor(contentResponse.data);
          applyProductFilter();
          updateQuickStats();
          loadAdminDashboard();
        }
      } else if (loginError) {
        loginError.textContent =
          response.data?.error ||
          (response.status === 0
            ? 'Admin server not detected. Start the site with "npm run dev" and open http://localhost:5173/admin.html.'
            : 'Login failed.');
      }
    });
  }

  if (adminLogout) {
    adminLogout.addEventListener('click', async () => {
      await fetchAdmin('/api/admin/logout', { method: 'POST' });
      setAdminLocked(true);
    });
  }

  if (adminEditor) {
    adminEditor.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-admin-add]');
      if (addButton) {
        addAdminCard(addButton.dataset.adminAdd);
        return;
      }
      const removeButton = event.target.closest('[data-admin-remove]');
      if (removeButton) {
        const card = removeButton.closest('.admin-card');
        if (card) card.remove();
      }
    });

    adminEditor.addEventListener('change', (event) => {
      const uploadInput = event.target.closest('[data-upload-input]');
      if (!uploadInput) return;
      const file = uploadInput.files?.[0];
      if (!file) return;
      const card = uploadInput.closest('.admin-card');
      const targetInput = card?.querySelector('[data-field="image"]');
      const statusEl = card?.querySelector('[data-upload-status]');
      uploadAdminImage(file, statusEl, targetInput);
      uploadInput.value = '';
    });

    adminEditor.addEventListener('change', (event) => {
      const filterToggle = event.target.closest('[data-admin-filter="featured"]');
      if (filterToggle) {
        applyProductFilter();
        return;
      }
      const featuredToggle = event.target.closest('[data-field="featured"]');
      const recommendedToggle = event.target.closest('[data-field="recommended"]');
      if (featuredToggle || recommendedToggle) {
        const card = event.target.closest('[data-admin-product]');
        if (!card) return;
        card.dataset.featured = String(
          card.querySelector('[data-field="featured"]')?.checked || false
        );
        card.dataset.recommended = String(
          card.querySelector('[data-field="recommended"]')?.checked || false
        );
        applyProductFilter();
      }
    });
  }

  if (adminSaveBtn) {
    adminSaveBtn.addEventListener('click', async () => {
      const updated = collectAdminContent();
      if (!updated) return;
      const result = await fetchAdmin('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (result.ok) {
        contentState.data = updated;
        contentState.productsById = Object.fromEntries(
          (updated.products || []).map((product) => [product.id, product])
        );
        announce('Content saved.');
        updateQuickStats();
      } else {
        announce('Save failed. Please try again.');
      }
    });
  }

  if (adminResetBtn) {
    adminResetBtn.addEventListener('click', async () => {
      const result = await fetchAdmin('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_CONTENT),
      });
      if (result.ok) {
        adminState.content = DEFAULT_CONTENT;
        contentState.data = DEFAULT_CONTENT;
        contentState.productsById = Object.fromEntries(
          DEFAULT_CONTENT.products.map((product) => [product.id, product])
        );
        renderAdminEditor(DEFAULT_CONTENT);
        announce('Content reset.');
        updateQuickStats();
      }
    });
  }

  if (orderRows) {
    orderRows.addEventListener('change', (event) => {
      const select = event.target.closest('[data-order-status-select]');
      if (!select) return;
      updateOrderStatus(select.dataset.orderId, select.value);
    });

    orderRows.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-order-action]');
      if (!actionBtn) return;
      const row = actionBtn.closest('tr');
      if (!row) return;
      const orderId = row.dataset.orderId;
      if (actionBtn.dataset.orderAction === 'save') {
        saveOrderRow(row);
      }
      if (actionBtn.dataset.orderAction === 'delete') {
        deleteOrderRow(orderId);
      }
    });
  }

  if (orderSearch) {
    orderSearch.addEventListener('input', renderAdminOrders);
  }
  if (orderStatusFilter) {
    orderStatusFilter.addEventListener('change', renderAdminOrders);
  }
  if (orderDateFilter) {
    orderDateFilter.addEventListener('change', renderAdminOrders);
  }

  if (orderAddBtn) {
    orderAddBtn.addEventListener('click', () => {
      addNewOrder();
    });
  }

  document.querySelectorAll('[data-admin-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.adminAction;
      if (action === 'featured') {
        scrollToAdminSection('products');
        const filter = adminEditor?.querySelector('[data-admin-filter="featured"]');
        if (filter) {
          filter.checked = true;
          applyProductFilter();
        }
        return;
      }
      if (action === 'promos') {
        scrollToAdminSection('promos');
        return;
      }
      if (action === 'inventory') {
        const section = document.querySelector('[data-admin-section="dashboard"]');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          flashSection(section);
        }
      }
    });
  });
};

setupAdmin();
loadContent();
