import { DETECTOR_REGISTRY } from "../detectors/registry.js";

export function runDetectors(content, config) {
  const all = [];
  for (const detector of DETECTOR_REGISTRY) {
    if (config.ignoreDetectors.includes(detector.key)) continue;
    const matches = detector.key === "generic"
      ? detector.run(content, { entropyThreshold: config.entropyThreshold })
      : detector.run(content);
    all.push(...matches);
  }
  return all;
}
