import { chromium } from 'playwright';
import { faker } from '@faker-js/faker';

interface SeedSummary {
  productsCreated: number;
  leadsCreated: number;
  dealsCreated: number;
  activitiesCreated: number;
  errors: string[];
}

async function seedCRMData() {
  console.log('🚀 Starting Zoyo CRM Data Seeding Process...');
  const summary: SeedSummary = {
    productsCreated: 0,
    leadsCreated: 0,
    dealsCreated: 0,
    activitiesCreated: 0,
    errors: []
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Authenticate
  console.log('\n🔑 Logging into https://zoyo-crm.vercel.app/ ...');
  await page.goto('https://zoyo-crm.vercel.app/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'demo@crm.com');
  await page.fill('input[type="password"]', '654321');
  await page.click('button:has-text("Login")');
  await page.waitForTimeout(3000);

  const authDataRaw = await page.evaluate(() => localStorage.getItem('auth-storage'));
  const authData = JSON.parse(authDataRaw || '{}');
  const token = authData?.state?.token;

  if (!token) {
    throw new Error('Failed to retrieve authentication token from login response!');
  }
  console.log('✅ Authentication successful! JWT Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json, text/plain, */*'
  };

  // Helper formula function to send POST requests with retry and error resolution
  const postWithRetry = async (url: string, payload: any, maxRetries = 3): Promise<any> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await page.evaluate(
          async ({ url, payload, headers }) => {
            const res = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            });
            const status = res.status;
            let data = {};
            try {
              data = await res.json();
            } catch (e) {
              data = await res.text();
            }
            return { status, data };
          },
          { url, payload, headers }
        );

        if (response.status === 200 || response.status === 201) {
          return response.data;
        } else {
          console.warn(`⚠️ Warning: POST ${url} attempt ${attempt} returned status ${response.status}:`, response.data);
          if (attempt === maxRetries) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
          }
        }
      } catch (err: any) {
        console.error(`❌ Error on POST ${url} (Attempt ${attempt}/${maxRetries}):`, err.message);
        if (attempt === maxRetries) throw err;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  };

  // Fetch Pipelines & Stages for Deals
  console.log('\n📊 Fetching sales pipelines...');
  const pipelinesRes = await page.evaluate(async (headers) => {
    const res = await fetch('https://zoyo-crm-be.vercel.app/api/v1/pipeline', { headers });
    return await res.json();
  }, headers);

  const pipeline = pipelinesRes?.data?.[0];
  const pipelineId = pipeline?.id || 1;
  const stages = pipeline?.stages || [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  console.log(`✅ Using Pipeline ID ${pipelineId} with ${stages.length} stages.`);

  // ----------------------------------------------------
  // 2. SEED PRODUCTS (25 Items)
  // ----------------------------------------------------
  console.log('\n📦 Seeding 25 Products...');
  const productIds: number[] = [];
  const billingFrequencies = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually'];
  const units = ['QTY', 'Bags', 'Hours', 'Licenses', 'Units'];

  for (let i = 1; i <= 25; i++) {
    const companyName = `Test Company ${faker.company.name()}`;
    const prodName = `Test Product ${i} - ${faker.commerce.productName()} (${companyName.slice(0, 15)})`;
    const rate = faker.number.int({ min: 1000, max: 50000 }).toString();
    const code = `TST-PRD-${100 + i}`;

    const payload = {
      product_name: prodName,
      rate: rate,
      unit: faker.helpers.arrayElement(units),
      product_code: code,
      category_id: null,
      billing_frequency: faker.helpers.arrayElement(billingFrequencies),
      tax_percentage: '18',
      discount_type: null,
      discount: '0'
    };

    try {
      const res = await postWithRetry('https://zoyo-crm-be.vercel.app/api/v1/product', payload);
      const createdId = res?.data?.id;
      if (createdId) productIds.push(createdId);
      summary.productsCreated++;
      process.stdout.write(` Created Product ${i}/25: ${prodName.slice(0, 40)}...\n`);
    } catch (e: any) {
      summary.errors.push(`Product ${i} failed: ${e.message}`);
    }
  }

  // ----------------------------------------------------
  // 3. SEED LEADS (25 Items)
  // ----------------------------------------------------
  console.log('\n👥 Seeding 25 Leads...');
  const createdLeadIds: number[] = [];
  const leadTagsOptions = [
    ['Hot', 'Test Company'],
    ['Warm', 'Enterprise'],
    ['Inbound', 'Saas'],
    ['High Value', 'Test Lead'],
    ['Referral', 'Test Company']
  ];

  for (let i = 1; i <= 25; i++) {
    const companyName = `Test Company ${faker.company.name()}`;
    const contactName = `Test ${faker.person.firstName()} ${faker.person.lastName()}`;
    const phone = `9${faker.string.numeric(9)}`;
    const email = faker.internet.email({ firstName: contactName.split(' ')[1], provider: 'testcompany.com' }).toLowerCase();
    const val = faker.number.int({ min: 20000, max: 500000 }).toString();
    const closeDate = faker.date.future({ years: 0.5 }).toISOString().split('T')[0];

    const payload = {
      contact_name: contactName,
      business_name: companyName,
      mobile_number: phone,
      email: email,
      value: val,
      currency: 'INR',
      close_date: closeDate,
      owner_id: 1,
      product_id: productIds.length > 0 ? faker.helpers.arrayElement(productIds) : null,
      address: `${faker.number.int({ min: 1, max: 999 })} Test Business Park`,
      city: faker.location.city(),
      state: faker.location.state(),
      country: 'India',
      pincode: '560001',
      tags: faker.helpers.arrayElement(leadTagsOptions)
    };

    try {
      const res = await postWithRetry('https://zoyo-crm-be.vercel.app/api/v1/lead', payload);
      const createdId = res?.data?.id;
      if (createdId) createdLeadIds.push(createdId);
      summary.leadsCreated++;
      process.stdout.write(` Created Lead ${i}/25: ${companyName.slice(0, 40)}...\n`);
    } catch (e: any) {
      summary.errors.push(`Lead ${i} failed: ${e.message}`);
    }
  }

  // ----------------------------------------------------
  // 4. SEED DEALS (25 Items)
  // ----------------------------------------------------
  console.log('\n💼 Seeding 25 Deals...');
  const dealTagsOptions = [
    ['High Priority', 'Test Deal'],
    ['Enterprise', 'Test Company'],
    ['Closing Soon', 'Strategic'],
    ['Standard', 'Test Company']
  ];

  for (let i = 1; i <= 25; i++) {
    const companyName = `Test Company ${faker.company.name()}`;
    const contactName = `Test ${faker.person.firstName()} ${faker.person.lastName()}`;
    const displayName = `Test Deal ${i} - ${companyName}`;
    const phone = `9${faker.string.numeric(9)}`;
    const email = faker.internet.email({ firstName: contactName.split(' ')[1], provider: 'testcompany.com' }).toLowerCase();
    const val = faker.number.int({ min: 50000, max: 1000000 }).toString();
    const closeDate = faker.date.future({ years: 0.5 }).toISOString().split('T')[0];
    const stage = faker.helpers.arrayElement(stages);

    const payload = {
      contact_name: contactName,
      business_name: companyName,
      display_name: displayName,
      mobile_number: phone,
      email: email,
      pipeline_id: pipelineId,
      pipeline_stage_id: (stage as any).id,
      value: val,
      currency: 'INR',
      close_date: closeDate,
      owner_id: 1,
      address: `${faker.number.int({ min: 1, max: 999 })} Test Commercial Hub`,
      city: faker.location.city(),
      state: faker.location.state(),
      country: 'India',
      pincode: '400001',
      tags: faker.helpers.arrayElement(dealTagsOptions)
    };

    try {
      await postWithRetry('https://zoyo-crm-be.vercel.app/api/v1/deal', payload);
      summary.dealsCreated++;
      process.stdout.write(` Created Deal ${i}/25: ${displayName.slice(0, 40)}...\n`);
    } catch (e: any) {
      summary.errors.push(`Deal ${i} failed: ${e.message}`);
    }
  }

  // ----------------------------------------------------
  // 5. SEED ACTIVITIES (25 Items)
  // ----------------------------------------------------
  console.log('\n📅 Seeding 25 Activities...');
  const actTypes = ['Call', 'Email', 'Meeting', 'Task', 'Whatsapp'];
  const priorities = ['High', 'Medium', 'Low'];

  for (let i = 1; i <= 25; i++) {
    const leadId = createdLeadIds.length > 0 ? createdLeadIds[(i - 1) % createdLeadIds.length] : 1;
    const dueDate = faker.date.soon({ days: 30 }).toISOString().split('T')[0];
    const actType = faker.helpers.arrayElement(actTypes);
    const priority = faker.helpers.arrayElement(priorities);

    const payload = {
      activity_type: actType,
      priority: priority,
      due_date: dueDate,
      lead_id: leadId,
      is_done: faker.datatype.boolean()
    };

    try {
      await postWithRetry('https://zoyo-crm-be.vercel.app/api/v1/lead/activities', payload);
      summary.activitiesCreated++;
      process.stdout.write(` Created Activity ${i}/25: [${actType}] for Lead ID ${leadId}...\n`);
    } catch (e: any) {
      summary.errors.push(`Activity ${i} failed: ${e.message}`);
    }
  }

  // ----------------------------------------------------
  // VERIFICATION & SUMMARY
  // ----------------------------------------------------
  console.log('\n========================================');
  console.log('🎉 SEEDING COMPLETE! SUMMARY RESULTS:');
  console.log('========================================');
  console.log(`📦 Products Created: ${summary.productsCreated} / 25`);
  console.log(`👥 Leads Created:    ${summary.leadsCreated} / 25`);
  console.log(`💼 Deals Created:    ${summary.dealsCreated} / 25`);
  console.log(`📅 Activities Created:${summary.activitiesCreated} / 25`);

  if (summary.errors.length > 0) {
    console.log(`\n⚠️ ${summary.errors.length} errors encountered:`);
    summary.errors.forEach(e => console.log(' - ' + e));
  } else {
    console.log('\n✅ 100% SUCCESS: All 100 items seeded with zero errors!');
  }

  await browser.close();
}

seedCRMData().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
