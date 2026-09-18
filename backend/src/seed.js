const prisma = require("./db");

const documents = [
  {
    id: "INC-2025-0916-001",
    title: "Order API latency incident - September 16",
    type: "incident",
    date: new Date("2025-09-16T10:30:00Z"),
    version: "orders-api-4.8.0",
    service: "Order API",
    content: `
At 10:30 UTC on September 16, the Order API began showing elevated latency.
p95 latency increased from approximately 450ms to 3.8s.

The issue affected order creation and checkout requests.
Initial investigation showed the problem was concentrated on orders-api version 4.8.0.

The incident began shortly after the 4.8.0 deployment.
Engineers rolled back to version 4.7.3 at 11:18 UTC.
Latency returned to normal within several minutes of the rollback.
    `.trim(),
  },

  {
    id: "DEP-2025-0916-004",
    title: "Order API 4.8.0 deployment notes",
    type: "deployment",
    date: new Date("2025-09-16T10:05:00Z"),
    version: "orders-api-4.8.0",
    service: "Order API",
    content: `
Order API version 4.8.0 was deployed to production at 10:05 UTC.

The release introduced a change to order validation.
The validation path now performs an additional customer-profile lookup.

The deployment completed successfully from the deployment system's perspective.
No deployment errors were reported.
    `.trim(),
  },

  {
    id: "PM-2025-0916-002",
    title: "Order API September 16 postmortem",
    type: "postmortem",
    date: new Date("2025-09-17T14:00:00Z"),
    version: "orders-api-4.8.0",
    service: "Order API",
    content: `
Root cause: version 4.8.0 introduced an additional customer-profile lookup
inside the synchronous order validation path.

The customer-profile database connection pool was undersized for the
additional request volume. This caused connection contention and increased
request latency.

Rollback to orders-api-4.7.3 resolved the immediate issue.

Follow-up actions include moving the profile lookup out of the synchronous
path and increasing database connection-pool capacity.
    `.trim(),
  },

  {
    id: "INC-2025-0721-003",
    title: "Order API latency incident - July 21",
    type: "incident",
    date: new Date("2025-07-21T09:15:00Z"),
    version: "orders-api-4.5.1",
    service: "Order API",
    content: `
The Order API experienced elevated latency on July 21.

p95 latency reached approximately 3.2 seconds.
The issue affected order creation requests.

Investigation found high database connection utilization on the
customer-profile database.

The issue was resolved after reducing concurrent profile lookups.
    `.trim(),
  },

  {
    id: "PM-2025-0721-001",
    title: "Order API July 21 postmortem",
    type: "postmortem",
    date: new Date("2025-07-22T16:00:00Z"),
    version: "orders-api-4.5.1",
    service: "Order API",
    content: `
The July 21 incident was caused by excessive concurrent access to the
customer-profile database.

A profile lookup was executed for every order request.
Under high traffic, the database connection pool became saturated.

The pattern is similar to earlier Order API latency incidents involving
customer-profile database access.
    `.trim(),
  },

  {
    id: "ARCH-ORDER-001",
    title: "Order API architecture",
    type: "architecture",
    date: new Date("2025-06-01T00:00:00Z"),
    version: "v3",
    service: "Order API",
    content: `
The Order API handles order creation and validation.

Customer profile information is stored in the Customer Profile service.
The Order API normally accesses customer profile information through an
internal service interface.

The synchronous request path should avoid unnecessary downstream calls
because downstream latency directly affects checkout latency.
    `.trim(),
  },

  {
    id: "GUIDE-ORDER-DB-001",
    title: "Troubleshooting customer-profile database saturation",
    type: "troubleshooting",
    date: new Date("2025-05-10T00:00:00Z"),
    version: "v2",
    service: "Customer Profile",
    content: `
When customer-profile database connection utilization is high, check:

1. Number of active connections.
2. Connection-pool configuration.
3. Recent changes that added profile lookups.
4. Request concurrency.
5. Whether profile lookups occur synchronously.

If connection utilization remains high after traffic normalization,
compare recent deployments with previous incidents involving profile lookups.
    `.trim(),
  },

  {
    id: "CUST-2025-0916-017",
    title: "Checkout complaints during September 16 incident",
    type: "customer_complaint",
    date: new Date("2025-09-16T11:00:00Z"),
    version: null,
    service: "Checkout",
    content: `
Multiple customers reported that checkout requests were taking several
seconds to complete on September 16.

Customers described the issue as slow checkout rather than failed orders.
The complaints started around the same period as the Order API latency spike.
    `.trim(),
  },
];

async function main() {
  console.log("Seeding documents...");

  for (const document of documents) {
    await prisma.document.upsert({
      where: { id: document.id },
      update: document,
      create: document,
    });
  }

  console.log(`Seeded ${documents.length} documents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });