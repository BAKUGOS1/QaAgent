import type { QaProfile } from "../../shared/types.js";

export interface QaPlaybook {
  id: string;
  name: string;
  profiles: QaProfile[];
  checks: string[];
}

