// Application State
let cart = JSON.parse(localStorage.getItem('annexus_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('annexus_wishlist')) || [];
let activeCategory = 'all';
let searchQuery = '';
let selectedWeights = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  PRODUCTS.forEach(p => selectedWeights[p.id] = '500g');
  renderProducts();
  updateCartUI();
  updateWishlistUI();
  if (window.lucide) {
    lucide.createIcons();
  }
  initServiceWorker();
});

// Render Product Cards
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noRes = document.getElementById('noResults');
  
  if (!grid) return;

  const filtered = PRODUCTS.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const countEl = document.getElementById('productCount');
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${PRODUCTS.length} items`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (noRes) noRes.classList.remove('hidden');
    return;
  }

  if (noRes) noRes.classList.add('hidden');

  grid.innerHTML = filtered.map(product => {
    const isLiked = wishlist.includes(product.id);
    const currentWeight = selectedWeights[product.id] || '500g';
    const currentPrice = getPriceForWeight(product, currentWeight);

    return `
      <div class="bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
        <div class="relative h-48 bg-stone-100 overflow-hidden cursor-pointer" onclick="openProductModal(${product.id})">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          ${product.badge ? `<span class="absolute top-3 left-3 bg-amber-900/90 backdrop-blur-md text-amber-200 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-700/50">${product.badge}</span>` : ''}
          
          <button onclick="event.stopPropagation(); toggleWishlist(${product.id})" class="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-stone-600 transition-colors shadow-sm">
            <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'text-rose-500 fill-rose-500' : ''}"></i>
          </button>
        </div>

        <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span class="font-semibold text-amber-800">${product.origin}</span>
              <span class="flex items-center gap-1 font-bold text-amber-600">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-500 text-amber-500"></i>
                ${product.rating} (${product.reviews})
              </span>
            </div>

            <h3 onclick="openProductModal(${product.id})" class="font-extrabold text-stone-900 text-base leading-snug cursor-pointer hover:text-amber-800 transition-colors">
              ${product.name}
            </h3>
            <p class="text-stone-500 text-xs mt-1.5 line-clamp-2">${product.description}</p>
          </div>

          <div class="space-y-3">
            <div class="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 text-xs">
              <button onclick="setProductWeight(${product.id}, '250g')" class="flex-1 py-1 rounded-xl font-bold transition-all ${currentWeight === '250g' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}">250g</button>
              <button onclick="setProductWeight(${product.id}, '500g')" class="flex-1 py-1 rounded-xl font-bold transition-all ${currentWeight === '500g' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}">500g</button>
              <button onclick="setProductWeight(${product.id}, '1kg')" class="flex-1 py-1 rounded-xl font-bold transition-all ${currentWeight === '1kg' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}">1kg</button>
            </div>

            <div class="flex items-center justify-between pt-1">
              <div>
                <span class="text-[10px] text-stone-400 uppercase font-bold block">Price (${currentWeight})</span>
                <span class="text-lg font-black text-amber-900">PKR ${currentPrice.toLocaleString()}</span>
              </div>

              <button onclick="addToCart(${product.id})" class="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/10 active:scale-95 transition-all">
                <i data-lucide="plus" class="w-4 h-4"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

function getPriceForWeight(product, weight) {
  if (weight === '250g') return product.price250g;
  if (weight === '1kg') return product.price1kg;
  return product.price500g;
}

function setProductWeight(id, weight) {
  selectedWeights[id] = weight;
  renderProducts();
}

function filterCategory(cat, btnElement) {
  activeCategory = cat;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('bg-amber-800', 'text-white', 'active');
    btn.classList.add('bg-white', 'text-stone-600');
  });
  if (btnElement) {
    btnElement.classList.remove('bg-white', 'text-stone-600');
    btnElement.classList.add('bg-amber-800', 'text-white', 'active');
  }
  renderProducts();
}

function handleSearch(val) {
  searchQuery = val;
  renderProducts();
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  const weight = selectedWeights[id] || '500g';
  const price = getPriceForWeight(product, weight);

  const existingIndex = cart.findIndex(item => item.id === id && item.weight === weight);

  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      weight: weight,
      price: price,
      qty: 1,
      image: product.image
    });
  }

  saveCart();
  updateCartUI();

  const cartBtn = document.getElementById('cartCount');
  if (cartBtn) {
    cartBtn.classList.add('animate-bounce');
    setTimeout(() => cartBtn.classList.remove('animate-bounce'), 1000);
  }
}

function updateCartQty(index, change) {
  cart[index].qty += change;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('annexus_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const cartItemsList = document.getElementById('cartItemsList');
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const countEl = document.getElementById('cartCount');
  const mobileCountEl = document.getElementById('mobileCartCount');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');

  if (countEl) countEl.textContent = totalCount;
  if (mobileCountEl) mobileCountEl.textContent = totalCount;
  if (subtotalEl) subtotalEl.textContent = `PKR ${subtotal.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `PKR ${subtotal.toLocaleString()}`;

  if (!cartItemsList) return;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="text-center py-12 text-stone-400">
        <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-3 text-stone-300"></i>
        <p class="text-sm font-semibold text-stone-600">Your basket is currently empty.</p>
        <p class="text-xs text-stone-400 mt-1">Select healthy nuts and dry fruits to get started!</p>
      </div>
    `;
  } else {
    cartItemsList.innerHTML = cart.map((item, index) => `
      <div class="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
        <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-xl border border-stone-200">
        <div class="flex-grow min-w-0">
          <h4 class="font-extrabold text-stone-900 text-xs truncate">${item.name}</h4>
          <p class="text-[11px] text-amber-800 font-bold mt-0.5">${item.weight} • PKR ${item.price.toLocaleString()}</p>
          
          <div class="flex items-center gap-2 mt-2">
            <button onclick="updateCartQty(${index}, -1)" class="w-6 h-6 rounded-lg bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xs font-bold text-stone-700">-</button>
            <span class="text-xs font-extrabold text-stone-900">${item.qty}</span>
            <button onclick="updateCartQty(${index}, 1)" class="w-6 h-6 rounded-lg bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-xs font-bold text-stone-700">+</button>
          </div>
        </div>
        <div class="text-right">
          <span class="font-extrabold text-xs text-stone-900">PKR ${(item.price * item.qty).toLocaleString()}</span>
          <button onclick="updateCartQty(${index}, -${item.qty})" class="block text-rose-500 text-[10px] mt-2 hover:underline">Remove</button>
        </div>
      </div>
    `).join('');
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

function toggleCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) modal.classList.toggle('hidden');
}

function toggleWishlistModal() {
  renderWishlistModal();
  const modal = document.getElementById('wishlistModal');
  if (modal) modal.classList.toggle('hidden');
}

function toggleWishlist(id) {
  const index = wishlist.indexOf(id);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(id);
  }
  localStorage.setItem('annexus_wishlist', JSON.stringify(wishlist));
  updateWishlistUI();
  renderProducts();
}

function updateWishlistUI() {
  const countEl = document.getElementById('wishlistCount');
  if (!countEl) return;
  countEl.textContent = wishlist.length;
  if (wishlist.length > 0) {
    countEl.classList.remove('hidden');
  } else {
    countEl.classList.add('hidden');
  }
}

function renderWishlistModal() {
  const container = document.getElementById('wishlistItemsList');
  if (!container) return;

  const items = PRODUCTS.filter(p => wishlist.includes(p.id));

  if (items.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No saved items yet.</p>`;
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="flex items-center justify-between bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
      <div class="flex items-center gap-3">
        <img src="${p.image}" class="w-10 h-10 object-cover rounded-xl">
        <div>
          <h4 class="font-bold text-xs text-stone-900">${p.name}</h4>
          <span class="text-[11px] text-amber-800 font-bold">PKR ${p.price500g} (500g)</span>
        </div>
      </div>
      <button onclick="addToCart(${p.id}); toggleWishlistModal(); toggleCartModal();" class="px-3 py-1.5 bg-amber-800 text-white rounded-xl text-xs font-bold">Buy</button>
    </div>
  `).join('');
}

function openProductModal(id) {
  const p = PRODUCTS.find(item => item.id === id);
  if (!p) return;

  document.getElementById('modalImg').src = p.image;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalOrigin').textContent = `Origin: ${p.origin}`;
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalBadge').textContent = p.badge || "100% Natural";

  document.getElementById('nutrCal').textContent = p.calories;
  document.getElementById('nutrProt').textContent = p.protein;
  document.getElementById('nutrCarb').textContent = p.carbs;
  document.getElementById('nutrFat').textContent = p.fat;

  document.getElementById('modalBenefits').innerHTML = p.benefits.map(b => `
    <li class="flex items-center gap-2 text-stone-700">
      <i data-lucide="check-circle2" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
      <span>${b}</span>
    </li>
  `).join('');

  document.getElementById('productModal').classList.remove('hidden');
  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Your shopping cart is empty!");
    return;
  }

  const name = document.getElementById('custName').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !address) {
    alert("Please provide your name and delivery address for shipping.");
    return;
  }

  let message = `🛒 *NEW ORDER - ANNEXUS MART*\n`;
  message += `-----------------------------------\n`;
  message += `👤 *Customer:* ${name}\n`;
  message += `📍 *Address:* ${address}\n`;
  message += `-----------------------------------\n\n`;
  message += `📦 *ORDER ITEMS:*\n`;

  cart.forEach((item, idx) => {
    message += `${idx + 1}. *${item.name}*\n   - Weight: ${item.weight}\n   - Qty: ${item.qty}\n   - Subtotal: PKR ${(item.price * item.qty).toLocaleString()}\n\n`;
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  message += `-----------------------------------\n`;
  message += `💰 *TOTAL AMOUNT:* PKR ${total.toLocaleString()}\n`;
  message += `-----------------------------------\n`;
  message += `Please confirm my order and provide delivery dispatch time!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappNum = "923215344656";
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}

// Service Worker & PWA Installation Logic
let deferredPrompt;

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered Successfully:', reg.scope))
      .catch(err => console.log('Service Worker Registration Failed:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.classList.remove('hidden');
  });
}

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choice) => {
    if (choice.outcome === 'accepted') {
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) installBtn.classList.add('hidden');
    }
    deferredPrompt = null;
  });
}