export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-angkor text-3xl text-prfc-brown sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">This page doesn't exist or has been removed.</p>
      <a
        href="https://www.pasofoodcooperative.com"
        className="mt-8 rounded-lg bg-prfc-red px-8 py-3 text-lg font-medium text-white hover:bg-prfc-red/90"
      >
        Go to pasofoodcooperative.com
      </a>
    </div>
  );
}
