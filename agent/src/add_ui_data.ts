import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Starting UI-based record creation for Zoyo CRM...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('Logging in to https://zoyo-crm.vercel.app/login ...');
  await page.goto('https://zoyo-crm.vercel.app/login');
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'demo@crm.com');
  await page.fill('input[type="password"]', '654321');
  await page.click('button:has-text("Login")');
  await page.waitForTimeout(3000);

  // ---------------------------------------------------------
  // 2. ADD 3 LEADS VIA UI
  // ---------------------------------------------------------
  console.log('\n👥 Adding 3 Leads via UI...');
  await page.goto('https://zoyo-crm.vercel.app/inbox');
  await page.waitForTimeout(2000);

  const sampleLeads = [
    { business: 'Test Company Alpha Corp', contact: 'Test Rahul Verma', email: 'rahul.alpha@testcompany.com', phone: '9876543210', value: '150000' },
    { business: 'Test Company Beta Tech', contact: 'Test Priya Sharma', email: 'priya.beta@testcompany.com', phone: '9812345678', value: '250000' },
    { business: 'Test Company Gamma Solutions', contact: 'Test Amit Patel', email: 'amit.gamma@testcompany.com', phone: '9988776655', value: '350000' }
  ];

  for (let i = 0; i < sampleLeads.length; i++) {
    const lead = sampleLeads[i];
    console.log(`Creating Lead ${i + 1}: ${lead.business}`);
    await page.click('button:has-text("Add Lead")');
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder="Company Name"]', lead.business);
    await page.fill('input[placeholder="Name"]', lead.contact);
    await page.fill('input[placeholder="Mobile"]', lead.phone);
    await page.fill('input[placeholder="Email"]', lead.email);
    await page.fill('input[placeholder="Value"]', lead.value);

    // Save lead
    await page.click('button:has-text("Save Lead"), button:has-text("Save")');
    await page.waitForTimeout(2500);
  }

  // ---------------------------------------------------------
  // 3. ADD 3 PRODUCTS VIA UI
  // ---------------------------------------------------------
  console.log('\n📦 Adding 3 Products via UI...');
  await page.goto('https://zoyo-crm.vercel.app/products');
  await page.waitForTimeout(2000);

  const sampleProducts = [
    { name: 'Test Product Alpha Suite', rate: '25000', code: 'TP-ALP-01' },
    { name: 'Test Product Beta Analytics', rate: '45000', code: 'TP-BET-02' },
    { name: 'Test Product Gamma Cloud', rate: '75000', code: 'TP-GAM-03' }
  ];

  for (let i = 0; i < sampleProducts.length; i++) {
    const prod = sampleProducts[i];
    console.log(`Creating Product ${i + 1}: ${prod.name}`);
    await page.click('button:has-text("Add Product")');
    await page.waitForTimeout(1000);

    await page.fill('input[placeholder*="Product Name" i], input[name="product_name"]', prod.name);
    await page.fill('input[placeholder*="Rate" i], input[name="rate"]', prod.rate);
    await page.fill('input[placeholder*="Code" i], input[name="product_code"]', prod.code);

    await page.click('button:has-text("Save Product"), button:has-text("Save")');
    await page.waitForTimeout(2500);
  }

  // ---------------------------------------------------------
  // 4. ADD 3 DEALS VIA UI
  // ---------------------------------------------------------
  console.log('\n💼 Adding 3 Deals via UI...');
  await page.goto('https://zoyo-crm.vercel.app/pipeline');
  await page.waitForTimeout(2000);

  const sampleDeals = [
    { display: 'Test Deal Alpha Renewal', company: 'Test Company Alpha Corp', contact: 'Test Rahul Verma', phone: '9876543210', email: 'rahul.alpha@testcompany.com', val: '200000' },
    { display: 'Test Deal Beta Enterprise', company: 'Test Company Beta Tech', contact: 'Test Priya Sharma', phone: '9812345678', email: 'priya.beta@testcompany.com', val: '500000' },
    { display: 'Test Deal Gamma Expansion', company: 'Test Company Gamma Solutions', contact: 'Test Amit Patel', phone: '9988776655', email: 'amit.gamma@testcompany.com', val: '800000' }
  ];

  for (let i = 0; i < sampleDeals.length; i++) {
    const deal = sampleDeals[i];
    console.log(`Creating Deal ${i + 1}: ${deal.display}`);
    await page.click('button:has-text("Add Deal")');
    await page.waitForTimeout(1000);

    // Check modal fields for Deal
    const dealInputs = await page.$$('input');
    if (dealInputs.length >= 2) {
      await page.fill('input[placeholder*="Deal Name" i], input[placeholder*="Display Name" i], input[placeholder*="Name" i]', deal.display).catch(() => {});
      await page.fill('input[placeholder*="Company" i], input[placeholder*="Business" i]', deal.company).catch(() => {});
      await page.fill('input[placeholder*="Value" i]', deal.val).catch(() => {});
    }

    await page.click('button:has-text("Save Deal"), button:has-text("Save")').catch(() => {});
    await page.waitForTimeout(2500);
  }

  // ---------------------------------------------------------
  // 5. ADD 3 ACTIVITIES VIA UI
  // ---------------------------------------------------------
  console.log('\n📅 Adding 3 Activities via UI...');
  await page.goto('https://zoyo-crm.vercel.app/table-activities');
  await page.waitForTimeout(2000);

  for (let i = 1; i <= 3; i++) {
    console.log(`Creating Activity ${i}...`);
    const addBtn = await page.$('button:has-text("Add Activity")');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.fill('input[type="date"]', '2026-09-15').catch(() => {});
      await page.click('button:has-text("Save"), button:has-text("Add Activity")').catch(() => {});
      await page.waitForTimeout(2500);
    }
  }

  console.log('\n========================================');
  console.log('🎉 UI CREATION COMPLETE!');
  console.log('========================================');

  await browser.close();
}

main().catch(console.error);
