import type { QaPlaybook } from "./playbook-types.js";

export const uploadDownloadPlaybook: QaPlaybook = {
  id: "upload-download",
  name: "Upload And Download",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Upload control visible",
    "Allowed file type behavior",
    "Rejected file type behavior",
    "Download action only for safe files",
    "Progress/error state"
  ]
};

