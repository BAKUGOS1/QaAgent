param(
  [string]$TaskFile = "agent/tasks/example-task.json"
)
npm run agent:codex -- --task-file $TaskFile --headed
