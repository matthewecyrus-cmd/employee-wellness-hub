import SectionPage from "./SectionPage";

export default function HealthCoaching() {
  return (
    <SectionPage
      sectionKey="health-coaching"
      fallbackTitle="1-on-1 Support to Focus on the Healthiest Next Step"
      fallbackBody="Did you know? Men are often less likely to talk about health concerns, schedule preventive care, or ask for support early — but small steps now can prevent bigger problems later. Don't wait for an injury or burnout to address your well-being. Use June to: Schedule your annual physical and preventive screenings, find an in-network primary care provider, re-focus on a small daily habit you have wanted to change. Health coaching is available to help you sort through making a plan that fits your schedule, your work, and your life."
      fallbackCta={{ label: "Schedule a Health Coaching Session", href: "mailto:matthew.cyrus@paligentech.com?subject=Health%20Coaching%20Session%20Request" }}
    />
  );
}
