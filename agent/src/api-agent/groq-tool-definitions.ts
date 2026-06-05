export const groqTools = [
  {
    type: "function",
    function: {
      name: "open_url",
      description: "Open a URL in the shared Playwright browser.",
      parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }
    }
  },
  {
    type: "function",
    function: {
      name: "click",
      description: "Click a safe selector.",
      parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_input",
      description: "Fill an input selector with text.",
      parameters: { type: "object", properties: { selector: { type: "string" }, value: { type: "string" } }, required: ["selector", "value"] }
    }
  },
  {
    type: "function",
    function: {
      name: "press_key",
      description: "Press a key on a selector.",
      parameters: { type: "object", properties: { selector: { type: "string" }, key: { type: "string" } }, required: ["selector", "key"] }
    }
  },
  {
    type: "function",
    function: {
      name: "wait",
      description: "Wait for milliseconds.",
      parameters: { type: "object", properties: { ms: { type: "number" } }, required: ["ms"] }
    }
  },
  {
    type: "function",
    function: {
      name: "take_screenshot",
      description: "Take a screenshot.",
      parameters: { type: "object", properties: { label: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_page_text",
      description: "Return visible page text.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_page_state",
      description: "Return URL, title, buttons, inputs, and text sample.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_console_errors",
      description: "Return captured console errors.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_network_errors",
      description: "Return captured network errors.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "create_random_lead_data",
      description: "Create Indian-style CRM lead data.",
      parameters: { type: "object", properties: { count: { type: "number" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Stop and generate the QA report.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "remember_site_note",
      description: "Save a non-sensitive note about the site.",
      parameters: { type: "object", properties: { note: { type: "string" } }, required: ["note"] }
    }
  }
] as const;
