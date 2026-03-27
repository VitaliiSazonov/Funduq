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

interface PropertySuspendedEmailProps {
  hostName: string;
  propertyTitle: string;
}

export default function PropertySuspendedEmail({
  hostName,
  propertyTitle,
}: PropertySuspendedEmailProps) {
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
      <Preview>Important update about your Funduq listing</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={heading}>Important update about your listing</Text>
            <Text style={subheading}>
              Dear {hostName}, we&apos;re reaching out regarding your property
              on Funduq.
            </Text>
          </Section>

          {/* Property Card */}
          <Section style={card}>
            <Text style={cardLabel}>AFFECTED LISTING</Text>
            <Text style={cardValue}>{propertyTitle}</Text>
          </Section>

          {/* Message */}
          <Section style={messageSection}>
            <Text style={messageText}>
              Your listing has been temporarily suspended by our moderation
              team. This action was taken to ensure all properties on Funduq
              meet our quality and safety standards.
            </Text>
            <Text style={messageText}>
              This does not affect your account. We encourage you to reach out
              to our support team to understand the specific reasons and work
              towards getting your listing reinstated.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href="mailto:support@funduq.com">
              Contact Support
            </Button>
          </Section>

          {/* Reassurance */}
          <Section style={reassurance}>
            <Text style={reassuranceText}>
              We value your partnership and are here to help resolve this
              promptly. Our support team typically responds within 24 hours.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you are a property host on Funduq.
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
  margin: "0 0 12px",
};

const subheading: React.CSSProperties = {
  fontSize: "15px",
  color: "#6b6b6b",
  margin: "0",
  lineHeight: "1.6",
};

const card: React.CSSProperties = {
  padding: "24px 40px 8px",
};

const cardLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#999",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const cardValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#1A1A1A",
  margin: "0",
};

const messageSection: React.CSSProperties = {
  padding: "16px 40px",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a4a4a",
  margin: "0 0 14px",
  lineHeight: "1.65",
};

const ctaSection: React.CSSProperties = {
  padding: "8px 40px 24px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#1A1A1A",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 36px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const reassurance: React.CSSProperties = {
  padding: "0 40px 24px",
};

const reassuranceText: React.CSSProperties = {
  fontSize: "13px",
  color: "#888",
  margin: "0",
  lineHeight: "1.5",
  fontStyle: "italic",
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
