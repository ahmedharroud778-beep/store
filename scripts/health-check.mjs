import http from "node:http";
import https from "node:https";

const frontendBase = process.env.HEALTH_FRONTEND_URL || "http://localhost:5173";
const backendBase =
  process.env.HEALTH_BACKEND_URL || `http://localhost:${process.env.PORT || "5000"}`;
const adminPath = process.env.VITE_ADMIN_PATH || "/admin";
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD in env.");
  process.exit(1);
}

function requestText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;

    const request = transport.request(
      target,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode || 0,
            statusText: response.statusMessage || "",
            text: body,
          });
        });
      },
    );

    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function requestJson(url, options = {}) {
  const response = await requestText(url, options);
  const text = response.text;
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} at ${url}\n${text}`);
  }

  return data;
}

async function requestStatus(url) {
  const response = await requestText(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} at ${url}`);
  }
  return response.status;
}

function printStep(label, value) {
  console.log(`[ok] ${label}: ${value}`);
}

async function main() {
  console.log("Running health check...");

  const homeStatus = await requestStatus(`${frontendBase}/`);
  printStep("frontend home", homeStatus);

  const adminStatus = await requestStatus(`${frontendBase}${adminPath}`);
  printStep("frontend admin route", adminStatus);

  const backendHealth = await requestJson(`${backendBase}/admin-api/health`);
  printStep("backend health", JSON.stringify(backendHealth));

  const loginBody = JSON.stringify({ username, password });
  const login = await requestJson(`${frontendBase}/admin-api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: loginBody,
  });

  if (!login?.token) {
    throw new Error("Login succeeded but no token was returned.");
  }
  printStep("admin login", "token received");

  const authHeaders = {
    Authorization: `Bearer ${login.token}`,
  };

  const statsBefore = await requestJson(`${frontendBase}/admin-api/protected/stats`, {
    headers: authHeaders,
  });
  printStep("protected stats", `products=${statsBefore.productsCount}, orders=${statsBefore.ordersCount}`);

  const productsBefore = await requestJson(`${frontendBase}/admin-api/protected/products`, {
    headers: authHeaders,
  });
  printStep("products fetch", `${productsBefore.length} products`);

  const testProduct = {
    name: "Codex Health Check Product",
    price: 19.99,
    image: "https://example.com/health-check-product.jpg",
    category: "Handmade",
    subcategory: "health-check",
    description: "Temporary product used by the automated health check.",
    images: ["https://example.com/health-check-product.jpg"],
    details: {
      material: "test",
      color: "green",
    },
  };

  const created = await requestJson(`${frontendBase}/admin-api/protected/products`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testProduct),
  });
  printStep("product create", `id=${created.id}`);

  const productsAfterCreate = await requestJson(`${frontendBase}/admin-api/protected/products`, {
    headers: authHeaders,
  });
  const createdExists = productsAfterCreate.some((product) => product.id === created.id);
  if (!createdExists) {
    throw new Error("Created product was not found in the protected products list.");
  }
  printStep("product visibility", "created product found");

  const deleteResult = await requestJson(
    `${frontendBase}/admin-api/protected/products/${created.id}`,
    {
      method: "DELETE",
      headers: authHeaders,
    },
  );
  if (!deleteResult?.success) {
    throw new Error("Delete request did not return success.");
  }
  printStep("product delete", "success");

  const productsAfterDelete = await requestJson(`${frontendBase}/admin-api/protected/products`, {
    headers: authHeaders,
  });
  const deletedGone = !productsAfterDelete.some((product) => product.id === created.id);
  if (!deletedGone) {
    throw new Error("Deleted product is still present after delete.");
  }
  printStep("product cleanup", "deleted product removed");

  const checkout = await requestJson(`${frontendBase}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          id: 1,
          name: "Health Check Order Item",
          price: 9.99,
          image: "https://example.com/health-check-order.jpg",
          category: "Test",
          quantity: 1,
        },
      ],
      customer: {
        name: "Health Check",
        email: "health@example.com",
        phone: "000000",
        address: "Tripoli",
        paymentMethod: "cash",
      },
      total: 9.99,
      paymentMethod: "cash",
    }),
  });

  if (!checkout?.success || !checkout?.orderId) {
    throw new Error("Checkout did not return success and orderId.");
  }
  printStep("checkout", `orderId=${checkout.orderId}`);

  const statsAfter = await requestJson(`${frontendBase}/admin-api/protected/stats`, {
    headers: authHeaders,
  });
  printStep("final stats", `products=${statsAfter.productsCount}, orders=${statsAfter.ordersCount}`);

  console.log("Health check passed.");
}

main().catch((error) => {
  console.error("Health check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
