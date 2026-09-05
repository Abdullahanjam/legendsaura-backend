const API_BASE = window.location.origin + "/api";
const token = localStorage.getItem("ls_token");

if (!token) {
  window.location.href = "index.html";
}

let categoriesCache = [];

// ---------- Helpers ----------
function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (res.status === 401) {
    localStorage.removeItem("ls_token");
    window.location.href = "index.html";
    throw new Error("Unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Kuch ghalat ho gaya.");
  return data;
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show" + (isError ? " error" : "");
  setTimeout(() => (toast.className = "toast"), 3000);
}

function formatMoney(amount) {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Navigation ----------
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    item.classList.add("active");
    document.getElementById(`view-${item.dataset.view}`).classList.add("active");
  });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("ls_token");
  localStorage.removeItem("ls_admin");
  window.location.href = "index.html";
});

const adminData = JSON.parse(localStorage.getItem("ls_admin") || "{}");
document.getElementById("adminName").textContent = adminData.username || "Admin";

// ---------- Image upload helper ----------
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload nahi ho saka.");
  return data.url;
}

function wireImageInput(inputId, hiddenId, previewId) {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  const preview = document.getElementById(previewId);
  input.addEventListener("change", async () => {
    if (!input.files[0]) return;
    try {
      showToast("Image upload ho rahi hai...");
      const url = await uploadImage(input.files[0]);
      hidden.value = url;
      preview.src = url;
      preview.classList.add("active");
      showToast("Image upload ho gayi.");
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

// =====================================================
// OVERVIEW
// =====================================================
async function loadOverview() {
  try {
    const stats = await apiFetch("/dashboard/stats", { headers: authHeaders() });
    document.getElementById("statsGrid").innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${stats.totalProducts}</div></div>
      <div class="stat-card"><div class="stat-label">Total Orders</div><div class="stat-value">${stats.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-label">Pending Orders</div><div class="stat-value accent">${stats.pendingOrders}</div></div>
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value accent">${formatMoney(stats.totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Low Stock Items</div><div class="stat-value">${stats.lowStock}</div></div>
    `;

    const recent = stats.recentOrders || [];
    if (recent.length === 0) {
      document.getElementById("recentOrdersTable").innerHTML = `<p class="empty-state">Abhi tak koi order nahi aaya.</p>`;
    } else {
      document.getElementById("recentOrdersTable").innerHTML = `
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            ${recent.map((o) => `
              <tr>
                <td>${escapeHtml(o.orderNumber)}</td>
                <td>${escapeHtml(o.customerName)}</td>
                <td>${formatMoney(o.total)}</td>
                <td><span class="badge badge-${o.status}">${o.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

// =====================================================
// PRODUCTS
// =====================================================
let allProducts = [];

async function loadProducts() {
  try {
    allProducts = await apiFetch("/products");
    renderProducts(allProducts);
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderProducts(products) {
  const container = document.getElementById("productsTable");
  if (products.length === 0) {
    container.innerHTML = `<p class="empty-state">Koi product nahi mila. "Naya Product" button se add karein.</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th></th></tr></thead>
      <tbody>
        ${products.map((p) => {
          const cat = categoriesCache.find((c) => c.id === p.categoryId);
          return `
            <tr>
              <td>${p.image ? `<img class="table-thumb" src="${p.image}" />` : `<div class="table-thumb"></div>`}</td>
              <td>${escapeHtml(p.name)}</td>
              <td>${cat ? escapeHtml(cat.name) : "—"}</td>
              <td>${formatMoney(p.price)}</td>
              <td>${p.stock}</td>
              <td>${p.featured ? "✓" : "—"}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" onclick="editProduct('${p.id}')">Edit</button>
                  <button class="icon-btn" onclick="deleteProduct('${p.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

document.getElementById("productSearch").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  renderProducts(allProducts.filter((p) => p.name.toLowerCase().includes(q)));
});

function populateCategoryDropdown() {
  const select = document.getElementById("productCategory");
  select.innerHTML =
    `<option value="">— Category chunein —</option>` +
    categoriesCache.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

document.getElementById("addProductBtn").addEventListener("click", () => openProductModal());

function openProductModal(product = null) {
  document.getElementById("productModalTitle").textContent = product ? "Product Edit Karein" : "Naya Product";
  document.getElementById("productId").value = product?.id || "";
  document.getElementById("productName").value = product?.name || "";
  document.getElementById("productDescription").value = product?.description || "";
  document.getElementById("productPrice").value = product?.price ?? "";
  document.getElementById("productCompareAtPrice").value = product?.compareAtPrice || "";
  document.getElementById("productStock").value = product?.stock ?? 0;
  document.getElementById("productFeatured").checked = !!product?.featured;
  document.getElementById("productImageUrl").value = product?.image || "";
  const preview = document.getElementById("productImagePreview");
  if (product?.image) {
    preview.src = product.image;
    preview.classList.add("active");
  } else {
    preview.classList.remove("active");
  }
  populateCategoryDropdown();
  document.getElementById("productCategory").value = product?.categoryId || "";
  document.getElementById("productModalOverlay").classList.add("active");
}

function closeProductModal() {
  document.getElementById("productModalOverlay").classList.remove("active");
  document.getElementById("productForm").reset();
}

function editProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (product) openProductModal(product);
}

async function deleteProduct(id) {
  if (!confirm("Kya aap sach me yeh product delete karna chahte hain?")) return;
  try {
    await apiFetch(`/products/${id}`, { method: "DELETE", headers: authHeaders() });
    showToast("Product delete ho gaya.");
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("productId").value;
  const payload = {
    name: document.getElementById("productName").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    price: document.getElementById("productPrice").value,
    compareAtPrice: document.getElementById("productCompareAtPrice").value || 0,
    categoryId: document.getElementById("productCategory").value,
    stock: document.getElementById("productStock").value,
    featured: document.getElementById("productFeatured").checked,
    image: document.getElementById("productImageUrl").value,
  };

  try {
    if (id) {
      await apiFetch(`/products/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
      showToast("Product update ho gaya.");
    } else {
      await apiFetch(`/products`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      showToast("Product add ho gaya.");
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
});

wireImageInput("productImageInput", "productImageUrl", "productImagePreview");

// =====================================================
// CATEGORIES
// =====================================================
async function loadCategories() {
  try {
    categoriesCache = await apiFetch("/categories");
    renderCategories();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderCategories() {
  const container = document.getElementById("categoriesTable");
  if (categoriesCache.length === 0) {
    container.innerHTML = `<p class="empty-state">Koi category nahi hai.</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
      <tbody>
        ${categoriesCache.map((c) => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.slug)}</td>
            <td>
              <div class="row-actions">
                <button class="icon-btn" onclick="editCategory('${c.id}')">Edit</button>
                <button class="icon-btn" onclick="deleteCategory('${c.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());

function openCategoryModal(category = null) {
  document.getElementById("categoryModalTitle").textContent = category ? "Category Edit Karein" : "Nayi Category";
  document.getElementById("categoryId").value = category?.id || "";
  document.getElementById("categoryName").value = category?.name || "";
  document.getElementById("categoryModalOverlay").classList.add("active");
}

function closeCategoryModal() {
  document.getElementById("categoryModalOverlay").classList.remove("active");
  document.getElementById("categoryForm").reset();
}

function editCategory(id) {
  const category = categoriesCache.find((c) => c.id === id);
  if (category) openCategoryModal(category);
}

async function deleteCategory(id) {
  if (!confirm("Kya aap sach me yeh category delete karna chahte hain?")) return;
  try {
    await apiFetch(`/categories/${id}`, { method: "DELETE", headers: authHeaders() });
    showToast("Category delete ho gayi.");
    loadCategories();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById("categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("categoryName").value.trim();
  try {
    if (id) {
      await apiFetch(`/categories/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ name }) });
      showToast("Category update ho gayi.");
    } else {
      await apiFetch(`/categories`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name }) });
      showToast("Category add ho gayi.");
    }
    closeCategoryModal();
    loadCategories();
  } catch (err) {
    showToast(err.message, true);
  }
});

// =====================================================
// ORDERS
// =====================================================
async function loadOrders() {
  try {
    const orders = await apiFetch("/orders", { headers: authHeaders() });
    renderOrders(orders);
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderOrders(orders) {
  const container = document.getElementById("ordersTable");
  if (orders.length === 0) {
    container.innerHTML = `<p class="empty-state">Abhi tak koi order nahi aaya.</p>`;
    return;
  }
  const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  container.innerHTML = `
    <table>
      <thead><tr><th>Order #</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${orders.map((o) => `
          <tr>
            <td>${escapeHtml(o.orderNumber)}</td>
            <td>${escapeHtml(o.customerName)}</td>
            <td>${escapeHtml(o.phone)}</td>
            <td>${o.items.map((i) => escapeHtml(i.name) + " ×" + i.quantity).join(", ")}</td>
            <td>${formatMoney(o.total)}</td>
            <td>
              <select onchange="updateOrderStatus('${o.id}', this.value)" style="background:var(--ink); color:var(--bone); border:1px solid var(--border); border-radius:3px; padding:4px 6px; font-family:inherit;">
                ${statuses.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </td>
            <td><button class="icon-btn" onclick="deleteOrder('${o.id}')">Delete</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`/orders/${id}/status`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }) });
    showToast("Order status update ho gaya.");
    loadOverview();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteOrder(id) {
  if (!confirm("Kya aap sach me yeh order delete karna chahte hain?")) return;
  try {
    await apiFetch(`/orders/${id}`, { method: "DELETE", headers: authHeaders() });
    showToast("Order delete ho gaya.");
    loadOrders();
  } catch (err) {
    showToast(err.message, true);
  }
}

// =====================================================
// SITE CONTENT / SETTINGS
// =====================================================
async function loadSettings() {
  try {
    const settings = await apiFetch("/settings");
    const form = document.getElementById("settingsForm");
    Object.keys(settings).forEach((key) => {
      const field = form.elements[key];
      if (field) field.value = settings[key];
    });
    if (settings.heroImage) {
      document.getElementById("heroImagePreview").src = settings.heroImage;
      document.getElementById("heroImagePreview").classList.add("active");
    }
    if (settings.logoUrl) {
      document.getElementById("logoPreview").src = settings.logoUrl;
      document.getElementById("logoPreview").classList.add("active");
    }
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {};
  Array.from(form.elements).forEach((el) => {
    if (el.name) payload[el.name] = el.value;
  });
  try {
    await apiFetch("/settings", { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    showToast("Site content update ho gaya.");
  } catch (err) {
    showToast(err.message, true);
  }
});

wireImageInput("heroImageInput", "heroImageUrl", "heroImagePreview");
wireImageInput("logoInput", "logoUrl", "logoPreview");

// =====================================================
// ACCOUNT / PASSWORD
// =====================================================
document.getElementById("passwordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const alertBox = document.getElementById("passwordAlert");
  alertBox.innerHTML = "";
  try {
    const data = await apiFetch("/auth/change-password", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        currentPassword: form.currentPassword.value,
        newPassword: form.newPassword.value,
      }),
    });
    alertBox.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
    form.reset();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});

// =====================================================
// INIT
// =====================================================
(async function init() {
  await loadCategories();
  loadOverview();
  loadProducts();
  loadOrders();
  loadSettings();
})();
