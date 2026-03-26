import { detectOpenAI } from "./openai.js";
import { detectGoogle } from "./google.js";
import { detectAWS } from "./aws.js";
import { detectStripe } from "./stripe.js";
import { detectSlack } from "./slack.js";
import { detectGitHub } from "./github.js";
import { detectPrivateKey } from "./privateKey.js";
import { detectGenericSecrets } from "./generic.js";
import { detectTwilio } from "./twilio.js";
import { detectSendGrid } from "./sendgrid.js";
import { detectMailgun } from "./mailgun.js";
import { detectAnthropic } from "./anthropic.js";
import { detectCohere } from "./cohere.js";
import { detectHuggingFace } from "./huggingface.js";
import { detectTelegram } from "./telegram.js";
import { detectNpmToken } from "./npmToken.js";
import { detectGitLab } from "./gitlab.js";

export const DETECTOR_REGISTRY = [
  { key: "openai", run: detectOpenAI },
  { key: "google", run: detectGoogle },
  { key: "aws", run: detectAWS },
  { key: "stripe", run: detectStripe },
  { key: "slack", run: detectSlack },
  { key: "github", run: detectGitHub },
  { key: "gitlab", run: detectGitLab },
  { key: "twilio", run: detectTwilio },
  { key: "sendgrid", run: detectSendGrid },
  { key: "mailgun", run: detectMailgun },
  { key: "anthropic", run: detectAnthropic },
  { key: "cohere", run: detectCohere },
  { key: "huggingface", run: detectHuggingFace },
  { key: "telegram", run: detectTelegram },
  { key: "npm", run: detectNpmToken },
  { key: "private-key", run: detectPrivateKey },
  { key: "generic", run: (content, options) => detectGenericSecrets(content, options) },
];
