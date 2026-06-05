import type { BrowserAgent } from "./browser-agent.js";
import type { CredentialsRef, LoginConfig } from "../shared/types.js";

export interface SmartLoginResult {
  attempted: boolean;
  status: "Skipped" | "Pass" | "Fail";
  message: string;
}

export async function smartLogin(
  browser: BrowserAgent,
  credentials?: CredentialsRef,
  login?: LoginConfig
): Promise<SmartLoginResult> {
  if (!login?.enabled) return { attempted: false, status: "Skipped", message: "Login disabled." };
  const email = credentials?.emailEnv ? process.env[credentials.emailEnv] : credentials?.email;
  const password = credentials?.passwordEnv ? process.env[credentials.passwordEnv] : credentials?.password;
  if (!email || !password) {
    return { attempted: false, status: "Fail", message: "Login enabled but email/password env values are missing." };
  }
  if (login.loginUrl) await browser.openUrl(login.loginUrl);
  const emailSelector = login.emailSelector || "input[type='email'], input[name*='email' i], input[placeholder*='email' i]";
  const passwordSelector = login.passwordSelector || "input[type='password'], input[name*='password' i], input[placeholder*='password' i]";
  const submitSelector = login.submitSelector || "button[type='submit'], input[type='submit'], button:has-text('Login'), button:has-text('Sign in')";
  await browser.fill(emailSelector, email);
  await browser.fill(passwordSelector, password);
  await browser.click(submitSelector);
  await browser.wait(1500);
  const state = await browser.saveBrowserState();
  const successByUrl = login.successUrlIncludes ? state.url.includes(login.successUrlIncludes) : true;
  const successByText = login.successTextIncludes ? state.textSample.includes(login.successTextIncludes) : true;
  return successByUrl && successByText
    ? { attempted: true, status: "Pass", message: "Login completed." }
    : { attempted: true, status: "Fail", message: "Login submitted but success condition was not met." };
}

