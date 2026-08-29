/**
 * ShinnySkin Shopify OS 2.0 Theme JavaScript
 */

(function () {
  'use strict';

  // --- Cart Drawer Manager ---
  const CartDrawer = {
    drawer: document.getElementById('CartDrawer'),
    itemsContainer: document.getElementById('CartDrawerItems'),
    subtotalElem: document.getElementById('CartDrawerSubtotal'),
    itemCountBadges: document.querySelectorAll('#CartDrawerItemCount, #HeaderCartCount'),
    shippingBarText: document.querySelector('.js-shipping-message'),
    shippingProgressBar: document.getElementById('ShippingProgressBar'),

    init() {
      this.bindEvents();
    },

    bindEvents() {
      // Open cart drawer triggers
      document.querySelectorAll('[data-cart-drawer-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });

      // Close cart drawer triggers
      document.querySelectorAll('[data-drawer-close]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      });

      // Close on ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Quick Add to Cart Buttons
      document.addEventListener('click', (e) => {
        const quickAddBtn = e.target.closest('.js-quick-add-btn');
        if (quickAddBtn) {
          e.preventDefault();
          const variantId = quickAddBtn.dataset.variantId;
          if (variantId) {
            this.addItem(variantId, 1, quickAddBtn);
          }
        }

        // Cart Drawer Quantity Buttons
        const qtyBtn = e.target.closest('.js-cart-qty-btn');
        if (qtyBtn) {
          e.preventDefault();
          const key = qtyBtn.dataset.key;
          const action = qtyBtn.dataset.action;
          const currentQty = parseInt(qtyBtn.parentElement.querySelector('span').textContent.trim()) || 1;
          const newQty = action === 'increase' ? currentQty + 1 : Math.max(0, currentQty - 1);
          this.updateQuantity(key, newQty);
        }

        // Cart Drawer Remove Button
        const removeBtn = e.target.closest('.js-cart-remove');
        if (removeBtn) {
          e.preventDefault();
          const key = removeBtn.dataset.key;
          this.updateQuantity(key, 0);
        }
      });
    },

    isOpen() {
      return this.drawer && this.drawer.classList.contains('is-open');
    },

    open() {
      if (!this.drawer) return;
      this.drawer.classList.add('is-open');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
    },

    close() {
      if (!this.drawer) return;
      this.drawer.classList.remove('is-open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
    },

    async addItem(variantId, quantity = 1, buttonElem = null) {
      if (buttonElem) {
        buttonElem.disabled = true;
        buttonElem.innerHTML = `<span class="inline-block animate-spin">⏳</span> Agregando...`;
      }

      try {
        const response = await fetch(window.ShopifyTheme.routes.cart_add_url + '.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: quantity })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        await this.refresh();
        this.open();
      } catch (err) {
        console.error('Error adding to cart:', err);
        alert('Hubo un error al agregar el producto. Por favor intenta de nuevo.');
      } finally {
        if (buttonElem) {
          buttonElem.disabled = false;
          buttonElem.innerHTML = `<span>${window.ShopifyTheme.strings.addToCart || 'Agregar al Carrito'}</span>`;
        }
      }
    },

    async updateQuantity(key, quantity) {
      try {
        const response = await fetch(window.ShopifyTheme.routes.cart_change_url + '.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: quantity })
        });

        if (!response.ok) throw new Error('Failed to update cart quantity');
        await this.refresh();
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    },

    async refresh() {
      try {
        const response = await fetch(window.ShopifyTheme.routes.cart_url + '.js');
        const cart = await response.json();
        this.render(cart);
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    },

    formatMoney(cents) {
      const format = window.ShopifyTheme.moneyFormat || '${{amount}}';
      const amount = (cents / 100).toFixed(2);
      return format.replace('{{amount}}', amount).replace('{{amount_no_decimals}}', Math.round(cents / 100));
    },

    render(cart) {
      // Update badge counts
      document.querySelectorAll('#CartDrawerItemCount, #HeaderCartCount').forEach((badge) => {
        badge.textContent = cart.item_count;
        if (cart.item_count > 0) {
          badge.classList.remove('hidden');
        }
      });

      // Update Free Shipping Bar
      const thresholdCents = (window.ShopifyTheme.strings.freeShippingThreshold || 50) * 100;
      const progressPercent = Math.min(100, Math.round((cart.total_price / thresholdCents) * 100));

      if (this.shippingProgressBar) {
        this.shippingProgressBar.style.width = `${progressPercent}%`;
      }

      if (this.shippingBarText) {
        if (cart.total_price >= thresholdCents) {
          this.shippingBarText.textContent = window.ShopifyTheme.strings.freeShippingUnlocked || '🎉 ¡Felicidades! Tienes ENVÍO GRATIS asegurado';
        } else {
          const remainingCents = thresholdCents - cart.total_price;
          const template = window.ShopifyTheme.strings.freeShippingProgress || '¡Agrega [amount] más para obtener ENVÍO GRATIS!';
          this.shippingBarText.textContent = template.replace('[amount]', this.formatMoney(remainingCents));
        }
      }

      // Update Items Area
      if (!this.itemsContainer) return;

      if (cart.item_count === 0) {
        this.itemsContainer.innerHTML = `
          <div class="cart-drawer__empty text-center py-16 px-4">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF0F4] flex items-center justify-center text-[#E86B91]">
              <svg class="icon icon-cart" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <p class="text-base font-semibold text-gray-800 mb-2">Tu carrito está actualmente vacío</p>
            <p class="text-xs text-gray-500 mb-6">Descubre nuestra línea de depilación permanente y cuidado facial.</p>
            <button type="button" class="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#333333] transition-colors" data-drawer-close>
              Explorar Productos
            </button>
          </div>
        `;
        const footer = document.getElementById('CartDrawerFooter');
        if (footer) footer.style.display = 'none';
      } else {
        const footer = document.getElementById('CartDrawerFooter');
        if (footer) footer.style.display = 'block';

        let html = '';
        cart.items.forEach((item) => {
          html += `
            <div class="cart-drawer__item flex gap-4 pb-4 border-b border-gray-100 last:border-0" data-line-item-key="${item.key}">
              <div class="w-20 h-20 rounded-xl bg-[#FFF8FA] border border-[#F3E2E8] flex-shrink-0 overflow-hidden">
                <img src="${item.featured_image ? item.featured_image.url : ''}" alt="${item.title}" class="w-full h-full object-contain p-1" width="80" height="80">
              </div>
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#E86B91]">
                      <a href="${item.url}">${item.product_title}</a>
                    </h4>
                    <button type="button" class="js-cart-remove text-gray-400 hover:text-red-500 transition-colors p-1" data-key="${item.key}" aria-label="Eliminar">
                      ✕
                    </button>
                  </div>
                  ${item.variant_title ? `<p class="text-[11px] text-gray-500 mt-0.5">${item.variant_title}</p>` : ''}
                </div>
                <div class="flex items-center justify-between mt-3">
                  <div class="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                    <button type="button" class="js-cart-qty-btn px-2.5 py-1 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold" data-action="decrease" data-key="${item.key}">-</button>
                    <span class="px-2 text-xs font-semibold text-gray-900">${item.quantity}</span>
                    <button type="button" class="js-cart-qty-btn px-2.5 py-1 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold" data-action="increase" data-key="${item.key}">+</button>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-bold text-gray-900">${this.formatMoney(item.final_line_price)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        this.itemsContainer.innerHTML = html;

        if (this.subtotalElem) {
          this.subtotalElem.textContent = this.formatMoney(cart.total_price);
        }
      }
    }
  };

  // --- Modals Manager (Video & Search) ---
  const ModalsManager = {
    videoModal: document.getElementById('ThemeVideoModal'),
    videoIframe: document.getElementById('ThemeVideoIframe'),
    searchModal: document.getElementById('ThemeSearchModal'),

    init() {
      // Video triggers
      document.querySelectorAll('[data-video-url]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const url = btn.dataset.videoUrl;
          this.openVideo(url);
        });
      });

      // Video close
      if (this.videoModal) {
        this.videoModal.addEventListener('click', (e) => {
          if (e.target === this.videoModal || e.target.closest('[data-modal-close]')) {
            this.closeVideo();
          }
        });
      }

      // Search triggers
      document.querySelectorAll('[data-search-trigger]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openSearch();
        });
      });

      if (this.searchModal) {
        this.searchModal.addEventListener('click', (e) => {
          if (e.target === this.searchModal || e.target.closest('[data-search-close]')) {
            this.closeSearch();
          }
        });
      }
    },

    openVideo(url) {
      if (!this.videoModal || !this.videoIframe) return;
      this.videoIframe.src = url;
      this.videoModal.classList.add('modal-active');
      document.body.classList.add('overflow-hidden');
    },

    closeVideo() {
      if (!this.videoModal || !this.videoIframe) return;
      this.videoIframe.src = '';
      this.videoModal.classList.remove('modal-active');
      document.body.classList.remove('overflow-hidden');
    },

    openSearch() {
      if (!this.searchModal) return;
      this.searchModal.classList.add('modal-active');
      const input = this.searchModal.querySelector('input');
      if (input) setTimeout(() => input.focus(), 100);
      document.body.classList.add('overflow-hidden');
    },

    closeSearch() {
      if (!this.searchModal) return;
      this.searchModal.classList.remove('modal-active');
      document.body.classList.remove('overflow-hidden');
    }
  };

  // --- Horizontal Carousel Controller ---
  const CarouselController = {
    init() {
      document.querySelectorAll('[data-carousel-container]').forEach((container) => {
        const slider = container.querySelector('[data-carousel-track]');
        const prevBtn = container.querySelector('[data-carousel-prev]');
        const nextBtn = container.querySelector('[data-carousel-next]');

        if (!slider) return;

        const scrollAmount = 320;

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          });
        }

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
          });
        }
      });
    }
  };

  // --- Floating Discount Badge Copy ---
  const DiscountBadge = {
    init() {
      const badge = document.getElementById('FloatingDiscountBadge');
      if (!badge) return;

      const button = badge.querySelector('button');
      const tooltip = document.getElementById('DiscountCopiedTooltip');

      if (button) {
        button.addEventListener('click', () => {
          const code = button.dataset.discountCode || 'SHINNY10';
          navigator.clipboard.writeText(code).then(() => {
            if (tooltip) {
              tooltip.classList.remove('hidden');
              setTimeout(() => {
                tooltip.classList.add('hidden');
              }, 3000);
            }
          });
        });
      }
    }
  };

  // --- Mobile Navigation Drawer ---
  const MobileNav = {
    init() {
      const toggle = document.querySelector('[data-mobile-menu-toggle]');
      const drawer = document.getElementById('MobileMenuDrawer');
      const closeBtn = document.querySelector('[data-mobile-menu-close]');

      if (!toggle || !drawer) return;

      toggle.addEventListener('click', () => {
        drawer.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          drawer.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        });
      }
    }
  };

  // Initialize all components on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    CartDrawer.init();
    ModalsManager.init();
    CarouselController.init();
    DiscountBadge.init();
    MobileNav.init();
  });
})();
