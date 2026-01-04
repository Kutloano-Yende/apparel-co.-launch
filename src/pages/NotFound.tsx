import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="pt-24 md:pt-28 pb-16 min-h-screen flex items-center justify-center">
      <div className="container-brand text-center">
        <h1 className="font-display text-8xl md:text-9xl font-bold tracking-tight mb-4">404</h1>
        <p className="text-muted-foreground text-lg mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
