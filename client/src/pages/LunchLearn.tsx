import SectionPage from "./SectionPage";

export default function LunchLearn() {
  return (
    <SectionPage
      sectionKey="lunch-learn"
      fallbackTitle="Strength Reserve: Why It Matters More Than You Think"
      fallbackBody="Many of us do not notice our strength reserve disappearing until life starts feeling harder than it should. This is not about lifting heavy weights or becoming a 'gym person.' It is about understanding strength as one of the most practical forms of long-term health protection you have. Join us for an upcoming Lunch & Learn to learn more."
      fallbackCta={{ label: "RSVP to Lunch & Learn", href: "mailto:matthew.cyrus@paligentech.com?subject=Lunch%20%26%20Learn%20RSVP" }}
    />
  );
}
