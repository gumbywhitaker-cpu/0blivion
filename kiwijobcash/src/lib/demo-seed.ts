import "server-only";
import { prisma } from "@/lib/db";

const FIRST_NAMES = [
  "John",
  "Sarah",
  "Mike",
  "Emma",
  "David",
  "Grace",
  "James",
  "Olivia",
  "Liam",
  "Ava",
  "Noah",
  "Sophie",
  "Jack",
  "Chloe",
  "Ryan",
  "Ella",
  "Ben",
  "Mia",
  "Tom",
  "Lucy",
];
const LAST_NAMES = [
  "Smith",
  "Wilson",
  "Brown",
  "Taylor",
  "Anderson",
  "Thomas",
  "White",
  "Clarke",
  "Robinson",
  "Walker",
  "Hall",
  "King",
  "Wright",
  "Green",
  "Baker",
];
const COMPANIES = [
  "ABC Property Management",
  "Harbourview Rentals",
  "Kelburn Holdings",
  "Seaside Apartments",
  "Northgate Retail",
  null,
  null,
  null,
];
const CITIES = ["Wellington", "Lower Hutt", "Porirua", "Upper Hutt", "Petone"];
const JOB_TITLES = [
  "Bathroom leak repair",
  "Hot water cylinder replacement",
  "Kitchen tap installation",
  "Blocked drain clearing",
  "Full bathroom renovation",
  "Gas fitting compliance check",
  "Toilet suite replacement",
  "Burst pipe emergency repair",
  "Spouting and drainage repair",
  "Rental property plumbing inspection",
];
const JOB_TYPES = ["Repair", "Installation", "Maintenance", "Renovation", "Inspection"];
const LEAD_SOURCES = ["Website", "Referral", "Google", "Facebook", "Repeat customer", "Phone"];
const EXPENSE_CATEGORIES = ["Materials", "Fuel", "Vehicle", "Tools", "Insurance", "Admin"];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

/**
 * Seeds a business with a realistic fictional dataset — "Dave's Plumbing" —
 * for demo mode. Every record is clearly fictional and scoped to the given
 * businessId; nothing here touches real customer data.
 */
export async function seedDemoData(businessId: string) {
  const customers = [];
  for (let i = 0; i < 20; i++) {
    const name = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`;
    const totalJobs = i % 5 === 0 ? 0 : (i % 6) + 1;
    const avgJob = 400 + (i % 7) * 220;
    const status =
      i % 9 === 0 ? "AT_RISK" : i % 6 === 0 ? "DORMANT" : i % 11 === 0 ? "VIP" : "ACTIVE";
    const lastJobDate = totalJobs > 0 ? daysAgo(i % 6 === 0 ? 220 + i * 3 : 3 + i * 4) : null;
    const c = await prisma.customer.create({
      data: {
        businessId,
        name,
        companyName: pick(COMPANIES, i),
        email: `${name.toLowerCase().replace(" ", ".")}@example.co.nz`,
        phone: `021 ${100 + i} ${1000 + i * 7}`,
        city: pick(CITIES, i),
        customerStatus: status,
        lifetimeValue: totalJobs * avgJob,
        totalJobs,
        lastJobDate,
        lastContactDate: lastJobDate,
      },
    });
    customers.push(c);
  }

  // Leads — mix of fresh, stale, won, lost
  for (let i = 0; i < 10; i++) {
    const customer = i < 4 ? customers[i] : null;
    const name = customer ? customer.name : `${pick(FIRST_NAMES, i + 5)} ${pick(LAST_NAMES, i + 8)}`;
    const value = 350 + (i % 6) * 300;
    const status = i < 2 ? "WON" : i === 2 ? "LOST" : i < 6 ? "NEW" : "CONTACTED";
    await prisma.lead.create({
      data: {
        businessId,
        customerId: customer?.id,
        name,
        email: `${name.toLowerCase().replace(" ", ".")}@example.co.nz`,
        phone: `022 ${200 + i} ${2000 + i * 9}`,
        source: pick(LEAD_SOURCES, i),
        description: pick(JOB_TITLES, i),
        estimatedValue: value,
        status,
        priority: value >= 1000 ? "HIGH" : value >= 500 ? "MEDIUM" : "LOW",
        createdAt: daysAgo(i === 5 ? 1 : 2 + i * 2),
        lastContactedAt: status === "CONTACTED" ? daysAgo(1 + i) : null,
      },
    });
  }

  // Quotes — hot, warm, cold, accepted, declined
  const quotes = [];
  for (let i = 0; i < 10; i++) {
    const customer = customers[(i * 2) % customers.length];
    const amount = 500 + (i % 8) * 450;
    const status =
      i < 2 ? "ACCEPTED" : i === 2 ? "DECLINED" : i < 5 ? "SENT" : i < 8 ? "FOLLOW_UP" : "VIEWED";
    const issueDate = daysAgo(i < 2 ? 15 : i === 2 ? 10 : i < 5 ? 2 : i < 8 ? 9 : 5);
    const q = await prisma.quote.create({
      data: {
        businessId,
        customerId: customer.id,
        quoteNumber: `Q-${String(i + 1).padStart(4, "0")}`,
        description: pick(JOB_TITLES, i + 2),
        amount,
        issueDate,
        status,
        acceptedAt: status === "ACCEPTED" ? daysAgo(i) : undefined,
        declinedAt: status === "DECLINED" ? daysAgo(i) : undefined,
      },
    });
    quotes.push(q);
  }

  // Invoices — paid, overdue, partially paid
  for (let i = 0; i < 10; i++) {
    const customer = customers[(i * 3 + 1) % customers.length];
    const amount = 300 + (i % 7) * 260;
    const isOverdue = i < 3;
    const isPaid = i >= 3 && i < 7;
    const dueDate = isOverdue ? daysAgo((i + 1) * 6) : isPaid ? daysAgo(20 - i) : daysFromNow(7 + i);
    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        customerId: customer.id,
        invoiceNumber: `INV-${String(i + 1).padStart(4, "0")}`,
        amount,
        issueDate: daysAgo(isOverdue ? (i + 1) * 6 + 14 : isPaid ? 34 - i : 3),
        dueDate,
        status: isOverdue ? "OVERDUE" : isPaid ? "PAID" : "SENT",
        paidDate: isPaid ? daysAgo(18 - i) : undefined,
        daysOverdue: isOverdue ? (i + 1) * 6 : 0,
      },
    });
    if (isPaid) {
      await prisma.payment.create({
        data: {
          businessId,
          invoiceId: invoice.id,
          customerId: customer.id,
          amount,
          method: i % 2 === 0 ? "BANK_TRANSFER" : "CARD",
          paymentDate: daysAgo(18 - i),
        },
      });
    }
  }

  // Jobs — completed with cost/profit data, feeding Profit Radar
  for (let i = 0; i < 15; i++) {
    const customer = customers[(i * 5) % customers.length];
    const revenue = 400 + (i % 9) * 300;
    const labour = Math.round(revenue * 0.35);
    const material = Math.round(revenue * 0.2);
    const completed = i < 12;
    await prisma.job.create({
      data: {
        businessId,
        customerId: customer.id,
        jobNumber: `JOB-${String(i + 1).padStart(4, "0")}`,
        title: pick(JOB_TITLES, i + 4),
        jobType: pick(JOB_TYPES, i),
        status: completed ? "COMPLETED" : i < 14 ? "BOOKED" : "IN_PROGRESS",
        scheduledDate: daysAgo(completed ? 40 - i * 2 : -3 - i),
        completedDate: completed ? daysAgo(38 - i * 2) : null,
        quotedAmount: revenue,
        actualRevenue: completed ? revenue : null,
        labourCost: completed ? labour : 0,
        materialCost: completed ? material : 0,
        otherCost: completed ? Math.round(revenue * 0.05) : 0,
        grossProfit: completed ? revenue - labour - material - Math.round(revenue * 0.05) : null,
        grossMargin: completed
          ? Math.round(((revenue - labour - material - Math.round(revenue * 0.05)) / revenue) * 100)
          : null,
      },
    });
  }

  // Expenses
  for (let i = 0; i < 20; i++) {
    await prisma.expense.create({
      data: {
        businessId,
        category: pick(EXPENSE_CATEGORIES, i),
        description: `${pick(EXPENSE_CATEGORIES, i)} purchase`,
        amount: 40 + (i % 10) * 35,
        date: daysAgo(i * 2),
        supplier: i % 3 === 0 ? "Mico Plumbing Supplies" : i % 3 === 1 ? "PlaceMakers" : "BP Fuel",
      },
    });
  }
}
