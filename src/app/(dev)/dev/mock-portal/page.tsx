import MockPortalContent from "./mock-portal-content";

export default function MockPortalPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Not available in production</p>
      </main>
    );
  }

  return <MockPortalContent />;
}
