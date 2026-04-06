import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  children: ReactNode;
};

export default function Section({ title, children }: SectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}