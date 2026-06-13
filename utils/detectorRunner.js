import { DETECTOR_REGISTRY } from "../detectors/registry.js";
import { buildCustomDetectors } from "../detectors/custom.js";

export function runDetectors(content, config) {
  const all = [];
  for (const detector of DETECTOR_REGISTRY) {
    if (config.ignoreDetectors.includes(detector.key)) continue;
    const matches = detector.key === "generic"
      ? detector.run(content, { entropyThreshold: config.entropyThreshold })
      : detector.run(content);
    all.push(...matches);
  }
  for (const detector of buildCustomDetectors(config.customRules)) {
    if (config.ignoreDetectors.includes(detector.key)) continue;
    all.push(...detector.run(content));
  }
  return all;
}
