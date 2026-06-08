import type { QaProfile } from "../../shared/types.js";
import type { BrowserAgent } from "../../browser/browser-agent.js";
import type { BrowserState } from "../../shared/types.js";

export interface PlaybookCheck {
  name: string;
  run?: (browser: BrowserAgent, state?: BrowserState) => Promise<string | boolean> | string | boolean;
}

export interface QaPlaybook {
  id: string;
  name: string;
  profiles: QaProfile[];
  checks: Array<string | PlaybookCheck>;
}

