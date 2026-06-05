#!/usr/bin/env bash
set -euo pipefail
npm run agent:codex -- --task-file "${1:-agent/tasks/example-task.json}" --headed
