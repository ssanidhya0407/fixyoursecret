import express from "express";

const app = express();
const configId = "build_configuration_identifier_2026_release";

app.get("/health", (_, res) => {
  res.json({ ok: true, configId });
});

app.listen(3000);
