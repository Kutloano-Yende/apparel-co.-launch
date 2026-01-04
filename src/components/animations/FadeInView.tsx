import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";

interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  once?: boolean;
}

const FadeInView = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.5,
  once = true,
}: FadeInViewProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 40, x: 0 };
      case "down":
        return { y: -40, x: 0 };
      case "left":
        return { x: 40, y: 0 };
      case "right":
        return { x: -40, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialPosition = getInitialPosition();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...initialPosition,
      }}
      animate={{
        opacity: isInView ? 1 : 0,
        x: isInView ? 0 : initialPosition.x,
        y: isInView ? 0 : initialPosition.y,
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInView;
