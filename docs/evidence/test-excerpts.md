# Omazon — Sprint 1 Test Excerpts

| Item | Value |
|---|---|
| Document | `docs/evidence/test-excerpts.md` |
| Sprint | 1 (Deliverable 1, Part F) |
| Date | 2026-11-07 |
| Related | `backend/tests/orders.create.test.ts`, `backend/tests/orders.access.test.ts`, `docs/sprints/sprint-1/features.md` §6 |

The Sprint 1 contract asks for two annotated excerpts: a domain rule (concurrent last unit) and an access restriction (cross-customer read). Both run against the real PostgreSQL test database; neither mocks the data access layer.

## 1. Domain rule — TEST-24, two customers ordering the last unit

Source: `backend/tests/orders.create.test.ts` (TEST-24), asserted against AC-24 and BR-05.

```ts
const lastUnitId = await menuItemId("Mango Sticky Rice");

for (let attempt = 0; attempt < 10; attempt += 1) {
  await testPrisma.orderStatusHistory.deleteMany();
  await testPrisma.orderItem.deleteMany();
  await testPrisma.order.deleteMany();
  await testPrisma.menuItem.update({
    where: { id: lastUnitId },
    data: { stockQty: 1, isAvailable: true },
  });

  const body = { items: [{ menuItemId: lastUnitId, quantity: 1 }] };
  const [first, second] = await Promise.all([
    postOrder(cookieOne, body),
    postOrder(cookieTwo, body),
  ]);

  const statuses = [first.status, second.status].sort((a, b) => a - b);
  expect(statuses, `attempt ${attempt + 1}`).toEqual([201, 409]);

  const rejected = first.status === 409 ? first : second;
  expect(rejected.body.error.code).toBe("ITEM_UNAVAILABLE");

  expect(
    (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: lastUnitId } })).stockQty
  ).toBe(0);
  expect(
    await testPrisma.orderItem.count({ where: { menuItemId: lastUnitId } })
  ).toBe(1);
}
```

**What it proves.** Two requests race for the last unit and exactly one wins: the pair of statuses is always `201` and `409`, stock lands on `0` (never negative), and only one order line references the item. The loop runs ten times, so a lucky interleaving cannot make the test pass by accident. The guarantee comes from a conditional stock update inside the order transaction plus a `stockQty >= 0` CHECK constraint in the schema.

## 2. Access restriction — TEST-27, serving another customer's order

Source: `backend/tests/orders.access.test.ts` (TEST-27), asserted against AC-27, BR-07 and NFR-02.

```ts
const forbidden = await request(app)
  .get(`/api/orders/${order.id}`)
  .set("Cookie", otherCookie);

expect(forbidden.status).toBe(403);
expect(forbidden.body.error.code).toBe("FORBIDDEN");
expect(Object.keys(forbidden.body)).toEqual(["error"]);
expect(JSON.stringify(forbidden.body)).not.toContain("orderNumber");
expect(JSON.stringify(forbidden.body)).not.toContain("totalSatang");

const ownerView = await request(app)
  .get(`/api/orders/${order.id}`)
  .set("Cookie", ownerCookie);
expect(ownerView.status).toBe(200);
expect(ownerView.body.order.id).toBe(order.id);

const missing = await request(app)
  .get("/api/orders/99999")
  .set("Cookie", ownerCookie);
expect(missing.status).toBe(404);

const malformed = await request(app)
  .get("/api/orders/abc")
  .set("Cookie", ownerCookie);
expect(malformed.status).toBe(400);

const anonymous = await request(app).get(`/api/orders/${order.id}`);
expect(anonymous.status).toBe(401);
```

**What it proves.** Authorisation is checked against the session user, not a client-supplied id: a second customer gets `403 FORBIDDEN` with an error object and no order data at all, the owner gets `200`, and the boundary cases (`404`, `400`, `401`) stay distinct. The response-body assertions make a partial leak — a field such as `orderNumber` or `totalSatang` slipping into an error — fail the test.

## 3. Related evidence

- TEST-43 (`backend/tests/routes.access.test.ts`) repeats the 401/403 table over every registered route, so a new endpoint that forgets its guard fails the suite.
- TEST-40 (`backend/tests/orders.operator.test.ts`) applies the same concurrency idea to operator acceptance, with a synchronisation barrier across ten runs.
- Raw terminal output for both features is in `docs/evidence/` and indexed in `docs/evidence/README.md`.
