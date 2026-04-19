import { ReactNode } from "react";
import { motion } from "framer-motion";

interface InfoPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const InfoPage = ({ title, subtitle, children }: InfoPageProps) => (
  <main className="pt-24 md:pt-28 pb-16 md:pb-24">
    <div className="container-brand max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-base md:text-lg mb-10">{subtitle}</p>
        )}
        <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
          {children}
        </div>
      </motion.div>
    </div>
  </main>
);

export default InfoPage;
