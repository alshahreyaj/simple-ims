const API_URL = 'http://localhost:4000/api';

export async function getItems() {
  const res = await fetch(`${API_URL}/items`);
  return res.json();
}

export async function createItem(data) {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateItemStock(id, stock) {
  const res = await fetch(`${API_URL}/items/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock })
  });
  return res.json();
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`);
  return res.json();
}

export async function createOrder(data) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function getCustomers() {
  const res = await fetch(`${API_URL}/customers`);
  return res.json();
}

export async function createCustomer(data) {
  const res = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateCustomerDue(id, due) {
  const res = await fetch(`${API_URL}/customers/${id}/due`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ due })
  });
  return res.json();
}

export async function getVendors() {
  const res = await fetch(`${API_URL}/vendors`);
  return res.json();
}

export async function createVendor(data) {
  const res = await fetch(`${API_URL}/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getPurchaseOrders() {
  const res = await fetch(`${API_URL}/purchase-orders`);
  return res.json();
}

export async function createPurchaseOrder(data) {
  const res = await fetch(`${API_URL}/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateItem(id, data) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'DELETE' });
  return res.json();
}

export async function updateOrder(orderId, data) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteCustomer(id) {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function updateCustomer(id, data) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getCustomerSummary(id) {
  const res = await fetch(`${API_URL}/customers/${id}/summary`);
  return res.json();
}

export async function updateVendor(id, data) {
  const res = await fetch(`${API_URL}/vendors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteVendor(id) {
  const res = await fetch(`${API_URL}/vendors/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function updatePurchaseOrder(id, data) {
  const res = await fetch(`${API_URL}/purchase-orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deletePurchaseOrder(id) {
  const res = await fetch(`${API_URL}/purchase-orders/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function payCustomerDue(customerId, amount) {
  const res = await fetch(`${API_URL}/orders/pay-due`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, amount })
  });
  if (!res.ok) throw new Error('Failed to pay due');
  return res.json();
}

export async function payVendorDue(vendorId, amount) {
  const res = await fetch(`${API_URL}/purchase-orders/pay-due`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId, amount })
  });
  if (!res.ok) throw new Error('Failed to pay due');
  return res.json();
} 