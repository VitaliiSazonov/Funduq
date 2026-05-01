import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Font,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface BookingReminderEmailProps {
  hostName: string;
  pendingCount: number;
  baseUrl: string;
}

export default function BookingReminderEmail({
  hostName,
  pendingCount,
  baseUrl,
}: BookingReminderEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Reminder: You have {pendingCount} pending booking request{pendingCount > 1 ? "s" : ""}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Header */}
          <Section style={heroSection}>
            <Text style={heading}>Action Required: Pending Requests</Text>
            <Text style={subheading}>
              Hello {hostName}, you have {pendingCount} booking request{pendingCount > 1 ? "s" : ""} waiting for your response.
            </Text>
          </Section>

          {/* Body Text */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              A guest is waiting to hear back from you. Please log in to your dashboard to approve or decline the request to keep your calendar up to date and provide a great experience for travelers.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/host/bookings`}>
              Go to Dashboard
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you have pending bookings on Funduq.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f7f5f2",
  fontFamily: "Inter, Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
};

const logoSection: React.CSSProperties = {
  padding: "32px 40px 16px",
  textAlign: "center",
};

const logoText: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#C5A059",
  letterSpacing: "4px",
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#eae6df",
  margin: "0 40px",
};

const heroSection: React.CSSProperties = {
  padding: "32px 40px 8px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#1A1A1A",
  margin: "0 0 8px",
};

const subheading: React.CSSProperties = {
  fontSize: "15px",
  color: "#6b6b6b",
  margin: "0",
};

const contentSection: React.CSSProperties = {
  padding: "16px 40px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0",
};

const ctaSection: React.CSSProperties = {
  padding: "24px 40px 32px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#C5A059",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  padding: "24px 40px 32px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "13px",
  color: "#999",
  margin: "0 0 4px",
};

const footerMuted: React.CSSProperties = {
  fontSize: "11px",
  color: "#bbb",
  margin: "0",
};
