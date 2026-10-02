import { describe, expect, it } from "vitest";
import enPublic from "@/messages/en/public.json";
import { makePublicCustomerSchema, makeStaffCustomerSchema } from "@/features/bookings/schemas";

const t = (key: keyof typeof enPublic.validation) => enPublic.validation[key];

describe("public customer schema", () => {
  const schema = makePublicCustomerSchema(t);
  const valid = { name: "Ana", phone: "912345678", email: "ana@example.com" };

  it("accepts a complete customer", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("requires name, phone and email", () => {
    expect(schema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, email: "" }).success).toBe(false);
  });

  it("limits notes to 1000 characters", () => {
    expect(schema.safeParse({ ...valid, notes: "n".repeat(1001) }).success).toBe(false);
  });
});

describe("staff customer schema", () => {
  const schema = makeStaffCustomerSchema(t);

  it("requires at least one contact", () => {
    const result = schema.safeParse({ name: "Ana", phone: "", email: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["phone"]);
  });

  it("accepts phone only or email only", () => {
    expect(schema.safeParse({ name: "Ana", phone: "912345678", email: "" }).success).toBe(true);
    expect(schema.safeParse({ name: "Ana", phone: "", email: "a@b.pt" }).success).toBe(true);
  });
});
