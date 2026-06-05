import type { QaProfile } from "../../shared/types.js";
import type { QaPlaybook } from "./playbook-types.js";
import { smokePlaybook } from "./smoke.playbook.js";
import { authPlaybook } from "./auth.playbook.js";
import { formsPlaybook } from "./forms.playbook.js";
import { crudPlaybook } from "./crud.playbook.js";
import { searchFilterSortPlaybook } from "./search-filter-sort.playbook.js";
import { tablePaginationPlaybook } from "./table-pagination.playbook.js";
import { uploadDownloadPlaybook } from "./upload-download.playbook.js";
import { navigationPlaybook } from "./navigation.playbook.js";
import { responsivePlaybook } from "./responsive.playbook.js";
import { accessibilityBasicPlaybook } from "./accessibility-basic.playbook.js";
import { performanceBasicPlaybook } from "./performance-basic.playbook.js";
import { securityBasicPlaybook } from "./security-basic.playbook.js";
import { errorStatesPlaybook } from "./error-states.playbook.js";

export const allPlaybooks: QaPlaybook[] = [
  smokePlaybook,
  authPlaybook,
  formsPlaybook,
  crudPlaybook,
  searchFilterSortPlaybook,
  tablePaginationPlaybook,
  uploadDownloadPlaybook,
  navigationPlaybook,
  responsivePlaybook,
  accessibilityBasicPlaybook,
  performanceBasicPlaybook,
  securityBasicPlaybook,
  errorStatesPlaybook
];

export function playbooksForProfile(profile: QaProfile): QaPlaybook[] {
  return allPlaybooks.filter((playbook) => playbook.profiles.includes(profile));
}

