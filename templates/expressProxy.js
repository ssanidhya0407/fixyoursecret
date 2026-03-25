export function expressProxyTemplate() {
  return `const express = require("express");

const app = express();
app.use(express.json());

app.post("/api/ai", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const payload = {
      model: req.body?.model || "gpt-4.1-mini",
      messages: req.body?.messages || []
    };

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Proxy request failed", details: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Secretlint proxy running on http://localhost:" + port);
});
`;
}
