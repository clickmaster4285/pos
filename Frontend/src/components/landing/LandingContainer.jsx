import { cn } from "@/utils/cn";

/** Full-width container with consistent horizontal padding for every landing section */
export function LandingContainer({ children, className = "" }) {
  return (
    <div className={cn("landing-container w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16", className)}>
      {children}
    </div>
  );
}

/** Standard section shell with consistent vertical rhythm */
export function LandingSection({ id, children, className = "" }) {
  return (
    <section
      id={id}
      className={cn("py-16 sm:py-20 lg:py-24 scroll-mt-20", className)}
    >
      <LandingContainer>{children}</LandingContainer>
    </section>
  );
}
