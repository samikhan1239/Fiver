export async function createOrderId(amount, currency) {
  const response = await fetch("/api/order/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create order");
  }
  return data.orderId;
}