import { redirect } from "next/navigation";

// Backend emails link to /book/{slug}; the booking page lives at /b/{slug}.
export default async function BookRedirect({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  redirect(`/b/${encodeURIComponent(businessSlug)}`);
}
