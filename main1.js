/* ===============================
   CLASS SẢN PHẨM
================================= */
class Product {
  constructor(id, title, price, image, category, rating, description) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.image = image;
    this.category = category;
    this.rating = rating;
    this.description = description;
  }

  render() {
    return `
      <div class="product-card">
        <img class="product-image" src="${this.image}" alt="${this.title}" onerror="this.style.display='none';">
        <div class="product-title">${this.title}</div>
        <div class="product-price">${this.price}$</div>
        <div class="product-rating">⭐ ${this.rating?.rate || 'Chưa có đánh giá'}</div>
        <a href="detail.html?id=${this.id}" class="buy-btn">Xem chi tiết</a>
      </div>
    `;
  }

  renderDetail() {
    return `
      <div class="product-detail-card">
        <h2 class="detail-title">${this.title}</h2>
        <div class="detail-image-wrapper">
          <img src="${this.image}" alt="${this.title}" class="detail-image" onerror="this.style.display='none';">
        </div>
        <div class="detail-info-group">
          <p class="detail-info-item">
            <span class="info-label">Mã ID:</span>
            <span class="info-value">${this.id}</span>
          </p>
          <p class="detail-info-item">
            <span class="info-label">Giá:</span>
            <span class="info-value">${this.price}$</span>
          </p>
        </div>
        <div class="detail-description">
          <h3>Mô Tả</h3>
          <p>${this.description}</p>
        </div>
        <div class="detail-actions">
          <button id="addCartBtn" productId="${this.id}" class="btn-primary">Thêm vào Giỏ hàng</button>
          <button onclick="window.history.back()" class="btn-secondary">Quay lại</button>
        </div>
      </div>
    `;
  }
}

/* ===============================
   CLASS GIỎ HÀNG
================================= */
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
  }

  addItem(product) {
    const existingItem = this.items.find(item => item.id == product.id);
    if (existingItem) existingItem.quantity++;
    else this.items.push({ ...product, quantity: 1, image: product.image });
    this.save();
    updateCartCount();
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id != id);
    this.save();
    updateCartCount();
  }

  updateQuantity(id, quantity) {
    if (quantity < 1) return this.removeItem(id);
    const item = this.items.find(item => item.id == id);
    if (item) item.quantity = quantity;
    this.save();
    updateCartCount();
  }

  getItems() {
    return this.items;
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  clear() {
    this.items = [];
    this.save();
    updateCartCount();
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

const cart = new Cart();

// ADDED: base URL for API
const API_BASE = 'https://my-json-server.typicode.com/Huylee1504/json-server-data';

/* ===============================
   RENDER HEADER + FOOTER
================================= */
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    cartCount.textContent = cart.getTotalCount();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const headerDiv = document.getElementById("header");
  if (headerDiv) {
    fetch("header.html")
      .then(res => {
        if (!res.ok) throw new Error('Failed to load header');
        return res.text();
      })
      .then(html => {
        headerDiv.innerHTML = html;
        updateCartCount();
        const userLoggedIn = localStorage.getItem("userLoggedIn") === "true";
        const userAvatar = localStorage.getItem("userAvatar");
        const userName = localStorage.getItem("userName") || "";
        const openLogin = document.getElementById("openLogin");

        if (userLoggedIn && openLogin) {
          // nếu đã đăng nhập, hiển thị avatar thay vì link đăng nhập
          openLogin.innerHTML = `<img src="${userAvatar}" alt="${userName}" class="user-avatar" id="userAvatarBtn">`;
          openLogin.href = "#";
        }

        // Khởi tạo lớp login sau khi header đã được chèn
        new LoginOverlay();
      })
      .catch(err => {
        console.error('Header Load Error:', err);
        alert('Không thể tải header.');
      });
  }

  const footerDiv = document.getElementById("footer");
  if (footerDiv) {
    fetch("footer.html")
      .then(res => {
        if (!res.ok) throw new Error('Failed to load footer');
        return res.text();
      })
      .then(html => footerDiv.innerHTML = html)
      .catch(err => {
        console.error('Footer Load Error:', err);
        alert('Không thể tải footer.');
      });
  }

  renderProductPage();
  renderProductDetail();
  renderCartPage();
  renderUserPage();
});

/* ===============================
   HIỂN THỊ SẢN PHẨM / DANH MỤC
================================= */
const featured = document.getElementById('featured');
const men = document.getElementById('men');
const women = document.getElementById('women');
const electronic = document.getElementById('electronic');
const allProductsDiv = document.getElementById('allproducts');
const searchInput = document.getElementById('search-input');
const sortPrice = document.getElementById('sort-price');
let allProductsData = [];

function renderProduct(array, container) {
  if (!container) return;
  container.innerHTML = array.map(item => new Product(
    item.id, item.title, item.price, item.image,
    item.category, item.rating, item.description
  ).render()).join('');
}

function renderProductPage() {
  fetch(`${API_BASE}/products`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    })
    .then(data => {
      allProductsData = data;
      if (allProductsDiv) {
        renderProduct(allProductsData, allProductsDiv);
        if (searchInput) searchInput.oninput = () => filterAndSortProducts();
        if (sortPrice) sortPrice.onchange = () => filterAndSortProducts();
      }
      if (featured) {
        renderProduct(data.filter(p => p.rating?.rate > 3).slice(0, 4), featured);
        renderProduct(data.filter(p => p.category === "men's clothing"), men);
        renderProduct(data.filter(p => p.category === "women's clothing"), women);
        renderProduct(data.filter(p => p.category === "electronics"), electronic);
      }
    })
    .catch(err => {
      console.error('Product Fetch Error:', err);
      alert('Có lỗi khi tải sản phẩm: ' + err.message);
    });
}

function filterAndSortProducts() {
  let filtered = [...allProductsData];
  const query = searchInput?.value.toLowerCase() || '';
  if (query) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }
  const sort = sortPrice?.value;
  if (sort === 'asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'desc') filtered.sort((a, b) => b.price - a.price);
  renderProduct(filtered, allProductsDiv);
}

function renderProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const detailContainer = document.getElementById("detail-container");
  if (id && detailContainer) {
    fetch(`${API_BASE}/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product detail');
        return res.json();
      })
      .then(p => {
        if (!p) {
          detailContainer.innerHTML = '<p>Sản phẩm không tồn tại!</p>';
          return;
        }
        const product = new Product(
          p.id, p.title, p.price, p.image, p.category, p.rating, p.description
        );
        detailContainer.innerHTML = product.renderDetail();
        const addBtn = document.getElementById("addCartBtn");
        if (addBtn) {
          addBtn.onclick = () => {
            cart.addItem(p);
            alert('Đã thêm vào giỏ hàng!');
          };
        }
      })
      .catch(err => {
        console.error('Product Detail Fetch Error:', err);
        alert('Có lỗi khi tải chi tiết sản phẩm: ' + err.message);
      });
  }
}

function renderCartPage() {
  const cartContainer = document.getElementById("cart-container");
  if (!cartContainer) return;

  const items = cart.getItems();
  if (items.length === 0) {
    cartContainer.innerHTML = "<p>Giỏ hàng trống!</p>";
    return;
  }

  cartContainer.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr>
          <th>Hình ảnh</th>
          <th>Tên sản phẩm</th>
          <th>Giá</th>
          <th>Số lượng</th>
          <th>Tổng</th>
          <th>Xóa</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td><img src="${item.image}" class="cart-img" alt="${item.title}" onerror="this.style.display='none';"></td>
            <td>${item.title}</td>
            <td>${item.price}$</td>
            <td><input type="number" class="quantity-input" data-id="${item.id}" value="${item.quantity}" min="1"></td>
            <td>${(item.price * item.quantity).toFixed(2)}$</td>
            <td><button class="remove-btn" data-id="${item.id}">🗑️</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="cart-summary">
      <p>Tổng cộng: ${(items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toFixed(2)}$</p>
      <button id="clear-cart">Xóa tất cả</button>
    </div>
  `;

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = () => {
      cart.removeItem(btn.dataset.id);
      renderCartPage();
    };
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.onchange = () => {
      cart.updateQuantity(input.dataset.id, parseInt(input.value));
      renderCartPage();
    };
  });

  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.onclick = () => {
      cart.clear();
      renderCartPage();
    };
  }
}

/* ===============================
   RENDER USER PAGE
================================= */
function renderUserPage() {
  const userNameSpan = document.getElementById('userName');
  const userEmailSpan = document.getElementById('userEmail');
  const userAvatarImg = document.getElementById('userAvatar');
  const logoutBtn = document.getElementById('logoutBtn');

  if (userNameSpan && userEmailSpan && userAvatarImg) {
    const userLoggedIn = localStorage.getItem("userLoggedIn") === "true";
    if (!userLoggedIn) {
      window.location.href = "bai2.html";
      return;
    }

    const userName = localStorage.getItem("userName") || 'Không xác định';
    const userEmail = localStorage.getItem("userEmail") || 'Không xác định';
    const userAvatar = localStorage.getItem("userAvatar");

    userNameSpan.textContent = userName;
    userEmailSpan.textContent = userEmail;
    userAvatarImg.src = userAvatar;

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userAvatar');
        alert('Đã đăng xuất!');
        window.location.href = "bai2.html";
      };
    }
  }
}

/* ===============================
   CLASS LOGIN OVERLAY
================================= */
class LoginOverlay {
  constructor() {
    this.overlay = document.getElementById("loginOverlay");
    this.closeBtn = document.getElementById("closeLogin");
    this.email = document.getElementById("email");
    this.password = document.getElementById("password");
    this.role = document.getElementById("roleSelect");
    this.loginBtn = document.getElementById("loginBtn");
    this.error = document.getElementById("loginError");

    if (this.overlay) {
      this.init();
    }
  }

  init() {
    if (this.closeBtn) this.closeBtn.onclick = () => this.hide();
    const openBtn = document.getElementById("openLogin");
    if (openBtn) {
      openBtn.onclick = (e) => {
        e.preventDefault();
        this.show();
      };
    }
    if (this.loginBtn) this.loginBtn.onclick = () => this.login();
  }

  show() {
    if (this.overlay) this.overlay.classList.remove("hidden");
  }

  hide() {
    if (this.overlay) this.overlay.classList.add("hidden");
    if (this.email) this.email.value = '';
    if (this.password) this.password.value = '';
    if (this.error) this.error.textContent = '';
  }

  login() {
    const email = (this.email?.value || '').trim();
    const pass = (this.password?.value || '').trim();
    const role = (this.role?.value) || 'user';

    if (!email || !pass) {
      if (this.error) this.error.textContent = "⚠️ Vui lòng nhập đầy đủ thông tin!";
      return;
    }

    fetch(`${API_BASE}/${role}s`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch accounts');
        return res.json();
      })
      .then(list => {
        const found = list.find(acc => acc.email === email && acc.password === pass);
        if (found) {
          if (role === "admin") {
            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminName", found.name);
            alert("Đăng nhập admin thành công!");
            window.location.href = "admin.html";
          } else {
            localStorage.setItem("userLoggedIn", "true");
            localStorage.setItem("userName", found.name);
            localStorage.setItem("userEmail", found.email);
            localStorage.setItem("userAvatar", found.avatar || 'img/placeholder.jpg');
            alert("Đăng nhập user thành công!");
            this.hide();

            // reload để cập nhật header/overlay
            window.location.reload();

            // overlay hiển thị thông tin người dùng (an toàn: chỉ chạy nếu các phần tử tồn tại)
            setTimeout(() => {
              const avatarBtn = document.getElementById("userAvatarBtn");
              const overlay = document.getElementById("profileOverlay");
              const avatar = document.getElementById("profileAvatar");
              const nameSpan = document.getElementById("profileName");
              const emailSpan = document.getElementById("profileEmail");
              const logoutBtn = document.getElementById("logoutBtn");

              if (avatarBtn && overlay) {
                avatarBtn.addEventListener("mouseenter", () => {
                  const userName = localStorage.getItem("userName");
                  const userEmail = localStorage.getItem("userEmail");
                  const userAvatar = localStorage.getItem("userAvatar");
                  if (nameSpan) nameSpan.textContent = userName;
                  if (emailSpan) emailSpan.textContent = userEmail;
                  if (avatar) avatar.src = userAvatar;
                  overlay.classList.remove("hidden");
                });

                overlay.addEventListener("mouseleave", () => {
                  overlay.classList.add("hidden");
                });
              }

              if (logoutBtn) {
                logoutBtn.onclick = () => {
                  localStorage.removeItem("userLoggedIn");
                  localStorage.removeItem("userName");
                  localStorage.removeItem("userEmail");
                  localStorage.removeItem("userAvatar");
                  alert("Đã đăng xuất!");
                  window.location.reload();
                };
              }
            }, 500);
          }
        } else {
          if (this.error) this.error.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
        }
      })
      .catch(err => {
        console.error('Login Fetch Error:', err);
        alert('Có lỗi khi đăng nhập: ' + err.message);
      });
  }
}

/* ===============================
   CLASS ADMIN UI
================================= */
class AdminUI {
  constructor() {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    if (!adminLoggedIn) {
      window.location.href = "bai2.html";
      return;
    }

    this.tabs = document.querySelectorAll('.admin-nav button');
    this.tabContents = document.querySelectorAll('.tab');
    this.productTable = document.getElementById('productTable')?.querySelector('tbody');
    this.userTable = document.getElementById('userTable')?.querySelector('tbody');
    this.addProductBtn = document.getElementById('addProductBtn');
    this.addUserBtn = document.getElementById('addUserBtn');
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalForm = document.getElementById('modalForm');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.logoutBtn = document.getElementById('logoutBtn');

    this.init();
  }

  init() {
    if (!this.productTable || !this.userTable) return;

    this.tabs.forEach(tab => {
      tab.onclick = () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      };
    });

    if (this.addProductBtn) {
      this.addProductBtn.onclick = () => this.openModal('product', 'add');
    } else {
      console.warn('Element with id "addProductBtn" not found.');
    }

    if (this.addUserBtn) {
      this.addUserBtn.onclick = () => this.openModal('user', 'add');
    } else {
      console.warn('Element with id "addUserBtn" not found.');
    }

    if (this.closeModalBtn) {
      this.closeModalBtn.onclick = () => this.closeModal();
    } else {
      console.error('Element with id "closeModalBtn" not found.');
    }

    if (this.logoutBtn) {
      this.logoutBtn.onclick = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminName');
        alert('Đã đăng xuất admin!');
        window.location.href = "bai2.html";
      };
    }
    this.loadProducts();
    this.loadUsers();
  };

  loadProducts() {
    fetch(`${API_BASE}/products`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(products => {
        this.productTable.innerHTML = products.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td>${p.price}</td>
            <td>${p.category}</td>
            <td><img src="${p.image}" width="50" alt="${p.title}" onerror="this.style.display='none';"></td>
            <td>
              <button class="edit-btn" data-id="${p.id}" data-type="product">✏️</button>
              <button class="delete-btn" data-id="${p.id}" data-type="product">🗑️</button>
            </td>
          </tr>
        `).join('');
        this.addAdminEvents();
      })
      .catch(err => {
        console.error('Products Load Error:', err);
        alert('Có lỗi khi tải danh sách sản phẩm: ' + err.message);
      });
  }

  loadUsers() {
    fetch(`${API_BASE}/users`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(users => {
        this.userTable.innerHTML = users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>
              <button class="edit-btn" data-id="${u.id}" data-type="user">✏️</button>
              <button class="delete-btn" data-id="${u.id}" data-type="user">🗑️</button>
            </td>
          </tr>
        `).join('');
        this.addAdminEvents();
      })
      .catch(err => {
        console.error('Users Load Error:', err);
        alert('Có lỗi khi tải danh sách người dùng: ' + err.message);
      });
  }

  addAdminEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => this.openModal(btn.dataset.type, 'edit', btn.dataset.id);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => this.deleteItem(btn.dataset.type, btn.dataset.id);
    });
  }

  openModal(type, action, id = null) {
    this.modalTitle.textContent = `${action === 'add' ? 'Thêm' : 'Sửa'} ${type === 'product' ? 'Sản phẩm' : 'Người dùng'}`;
    this.modalForm.innerHTML = type === 'product' ? `
      <input type="text" id="title" placeholder="Tên sản phẩm" required>
      <input type="number" id="price" placeholder="Giá" step="0.01" required>
      <input type="text" id="category" placeholder="Danh mục" required>
      <input type="text" id="image" placeholder="URL ảnh">
      <textarea id="description" placeholder="Mô tả"></textarea>
      <button type="submit">${action === 'add' ? 'Thêm' : 'Cập nhật'}</button>
    ` : `
      <input type="text" id="name" placeholder="Tên" required>
      <input type="email" id="email" placeholder="Email" required>
      <input type="text" id="phone" placeholder="Điện thoại" required>
      <input type="password" id="password" placeholder="Mật khẩu" required>
      <button type="submit">${action === 'add' ? 'Thêm' : 'Cập nhật'}</button>
    `;
    this.modal.classList.remove('hidden');

    if (action === 'edit') {
      fetch(`${API_BASE}/${type}s/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch item');
          return res.json();
        })
        .then(data => {
          if (!data) {
            alert('Không tìm thấy dữ liệu!');
            this.closeModal();
            return;
          }
          if (type === 'product') {
            document.getElementById('title').value = data.title;
            document.getElementById('price').value = data.price;
            document.getElementById('category').value = data.category;
            document.getElementById('image').value = data.image;
            document.getElementById('description').value = data.description;
          } else {
            document.getElementById('name').value = data.name;
            document.getElementById('email').value = data.email;
            document.getElementById('phone').value = data.phone;
            document.getElementById('password').value = data.password;
          }
        })
        .catch(err => {
          console.error('Modal Fetch Error:', err);
          alert('Có lỗi khi tải dữ liệu: ' + err.message);
        });
    }

    this.modalForm.onsubmit = (e) => {
      e.preventDefault();
      const data = type === 'product' ? {
        title: document.getElementById('title').value,
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value
      } : {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        avatar: 'img/placeholder.jpg'
      };

      const url = `${API_BASE}/${type}s${action === 'add' ? '' : '/' + id}`;
      const method = action === 'add' ? 'POST' : 'PUT';

      fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to save data');
          return res.json();
        })
        .then(() => {
          alert(`${type === 'product' ? 'Sản phẩm' : 'Người dùng'} đã được ${action === 'add' ? 'thêm' : 'cập nhật'}!`);
          this.reload(type);
        })
        .catch(err => {
          console.error('Save Data Error:', err);
          alert('Có lỗi khi lưu dữ liệu: ' + err.message);
        });
      this.closeModal();
    };
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.modalForm.innerHTML = '';
  }

  deleteItem(type, id) {
    if (confirm(`Xác nhận xóa ${type === 'product' ? 'sản phẩm' : 'người dùng'}?`)) {
      fetch(`${API_BASE}/${type}s/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete item');
          return res.json();
        })
        .then(() => {
          alert(`${type === 'product' ? 'Sản phẩm' : 'Người dùng'} đã được xóa!`);
          this.reload(type);
        })
        .catch(err => {
          console.error('Delete Error:', err);
          alert('Có lỗi khi xóa dữ liệu: ' + err.message);
        });
    }
  }

  reload(type) {
    if (type === 'product') this.loadProducts();
    else this.loadUsers();
  }
}

/* ===============================
   KHỞI CHẠY
================================= */
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".admin-container")) {
    new AdminUI();
  }
});