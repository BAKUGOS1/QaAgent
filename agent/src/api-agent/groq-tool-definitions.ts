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
      name: "get_browser_state",
      description: "Return rich browser state with indexed clickable elements.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "click_by_index",
      description: "Click a visible clickable element by its browser state index.",
      parameters: { type: "object", properties: { index: { type: "number" } }, required: ["index"] }
    }
  },
  {
    type: "function",
    function: {
      name: "click_by_text",
      description: "Click a visible element by text.",
      parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }
    }
  },
  {
    type: "function",
    function: {
      name: "click_by_role",
      description: "Click an element by ARIA role and optional accessible name.",
      parameters: { type: "object", properties: { role: { type: "string" }, name: { type: "string" } }, required: ["role"] }
    }
  },
  {
    type: "function",
    function: {
      name: "click_selector",
      description: "Click a safe selector.",
      parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_selector",
      description: "Fill an input selector with text.",
      parameters: { type: "object", properties: { selector: { type: "string" }, value: { type: "string" } }, required: ["selector", "value"] }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_by_label",
      description: "Fill a visible input by label text.",
      parameters: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_by_placeholder",
      description: "Fill a visible input by placeholder text.",
      parameters: { type: "object", properties: { placeholder: { type: "string" }, value: { type: "string" } }, required: ["placeholder", "value"] }
    }
  },
  {
    type: "function",
    function: {
      name: "fill_by_name",
      description: "Fill a visible input by name attribute.",
      parameters: { type: "object", properties: { name: { type: "string" }, value: { type: "string" } }, required: ["name", "value"] }
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
      name: "wait_for_navigation",
      description: "Wait for the page URL to change after a navigation-triggering action.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "scroll",
      description: "Scroll the page up or down to reveal lazy-loaded or below-fold content.",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["down", "up"], description: "Scroll direction. Default: down." },
          amount: { type: "number", description: "Pixels to scroll. Default: 600." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "select_option",
      description: "Select an option from a <select> dropdown by value or visible label.",
      parameters: {
        type: "object",
        properties: {
          selector: { type: "string", description: "CSS selector for the <select> element." },
          value: { type: "string", description: "Option value or visible label to select." }
        },
        required: ["selector", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "hover",
      description: "Hover over an element to reveal tooltips, dropdowns, or hover states.",
      parameters: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }
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
      description: "Return rich browser state with indexed clickable elements.",
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
      name: "get_api_responses",
      description: "Return captured API response bodies to compare toasts with actual server responses.",
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
      name: "generate_test_data",
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
