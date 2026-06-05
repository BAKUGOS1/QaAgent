export const commonSelectors = {
  email: [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[placeholder*="email" i]'
  ],
  password: [
    'input[type="password"]',
    'input[name*="password" i]',
    'input[placeholder*="password" i]'
  ],
  submit: [
    'button[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Submit")'
  ]
};
