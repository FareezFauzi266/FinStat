import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = [
  { name: 'Income', subs: [
    { name: 'Salary' },
    { name: 'Side Hustle' },
    { name: 'Freelance' },
    { name: 'Dividends' },
    { name: 'Interest' },
    { name: 'Grants/Aid' },
    { name: 'Other' }
  ]},
  { name: 'Living Expenses', subs: [
    { name: 'Rent' },
    { name: 'Utilities' },
    { name: 'Internet' },
    { name: 'Phone' },
    { name: 'Insurance' },
    { name: 'Groceries' },
    { name: 'Household' },
    { name: 'Streaming' },
    { name: 'Software' }
  ]},
  { name: 'Transport', subs: [
    { name: 'Bike/Car Fuel' },
    { name: 'Bike/Car Maintenance' },
    { name: 'Bike/Car Repair' },
    { name: 'Bike/Car Parking' },
    { name: 'Bike/Car Toll' },
    { name: 'Public Transport' },
    { name: 'Taxi/Ridehailing' }
  ]},
  { name: 'Medical & Health', subs: [
    { name: 'Doctor General' },
    { name: 'Doctor Specialist' },
    { name: 'Dentist' },
    { name: 'Supplements' },
    { name: 'Health Insurance' },
    { name: 'Medication' }
  ]},
  { name: 'Lifestyle & Leisure', subs: [
    { name: 'Coffee' },
    { name: 'Restaurant' },
    { name: 'Snacks/Fast Food' },
    { name: 'Gym' },
    { name: 'Fitness/Supplies' },
    { name: 'Sports Equipment' },
    { name: 'Gadgets/Tech' },
    { name: 'Games' },
    { name: 'Clothes' },
    { name: 'Accessories' },
    { name: 'Furnishing' },
    { name: 'Vacation' },
    { name: 'Flights' },
    { name: 'Accommodation' },
    { name: 'Recreational Activities' }
  ]},
  { name: 'Financial', subs: [
    { name: 'Loan Repayment' },
    { name: 'Credit Card' },
    { name: 'Interest Charges' },
    { name: 'Donation' },
    { name: 'Emergency' },
    { name: 'Stocks/ETF' },
    { name: 'Retirement' }
  ]},
  { name: 'Other', subs: [
    { name: 'Bank Transfer (Not Reported)' },
    { name: 'Cash Withdraw (Not Reported)' },
    { name: 'Unstated' }
  ]}
];

async function main() {
  for (const cat of data) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name }
    });
    for (const sub of cat.subs) {
      await prisma.subcategory.upsert({
        where: { name_categoryId: { name: sub.name, categoryId: created.id } },
        update: {},
        create: { name: sub.name, categoryId: created.id }
      });
    }
  }
}

main().then(() => {
  console.log('Seed completed');
}).catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
}); 