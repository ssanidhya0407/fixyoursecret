import test from "node:test";
import assert from "node:assert/strict";
import { detectGenericSecrets } from "../detectors/generic.js";

function reports(value) {
  const content = `const token = "${value}";`;
  return detectGenericSecrets(content).some((f) => f.rule === "generic-high-entropy");
}

test("reports pure-alphanumeric high-entropy secrets (no symbols)", () => {
  // Real API keys are frequently 31+ chars of mixed-case base62 with no
  // separators. These must not be excused as code identifiers.
  for (const secret of [
    "Zx9KmPq2RtVw8LnB4cDeFgHj6sUvWx0YpAbCdEf",
    "k3Jh8sNm2pQr9TvWxZaBcDeFgHiJkLmNoPqRsTuV",
    "a7Bz9KmPqRtVwLnB4cDeFgHj6sUvWx0YpQrStUvWx",
  ]) {
    assert.ok(reports(secret), `expected to report ${secret}`);
  }
});

test("still ignores long language-derived code identifiers", () => {
  // Vowel-rich, low per-character entropy: these are names, not secrets.
  for (const ident of [
    "getUserConfigurationFromRemoteServerCacheLayer",
    "handleIncomingWebSocketConnectionRequestHandler",
    "useMemoizedCallbackForExpensiveComputationValue",
    "MAXIMUM_ALLOWED_CONCURRENT_CONNECTIONS_LIMIT",
  ]) {
    assert.ok(!reports(ident), `expected to ignore ${ident}`);
  }
});

test("still ignores hex content hashes", () => {
  for (const hash of [
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4",
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  ]) {
    assert.ok(!reports(hash), `expected to ignore ${hash}`);
  }
});
