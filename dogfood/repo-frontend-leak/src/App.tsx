export async function ask(messages: any[]) {
  return fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", messages })
  });
}
