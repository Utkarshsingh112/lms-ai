import Link from "next/link";

export const metadata = { title: "Page not found" };

const NotFound = () => (
  <main className="items-center justify-center pt-20 text-center">
    <h1>We couldn&apos;t find that page</h1>
    <p className="text-muted-foreground">
      The link may be broken, or the companion may have been removed.
    </p>
    <div className="flex justify-center gap-4">
      <Link href="/companions" className="btn-primary">
        Browse companions
      </Link>
      <Link href="/" className="btn-signin">
        Go home
      </Link>
    </div>
  </main>
);

export default NotFound;
