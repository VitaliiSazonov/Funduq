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

interface PropertyApprovedEmailProps {
  hostName: string;
  propertyTitle: string;
  propertyId: string;
  baseUrl: string;
}

export default function PropertyApprovedEmail({
  hostName,
  propertyTitle,
  propertyId,
  baseUrl,
}: PropertyApprovedEmailProps) {
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
      <Preview>Your listing &quot;{propertyTitle}&quot; is now live on Funduq!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={emoji}>🎉</Text>
            <Text style={heading}>Your listing is now live!</Text>
            <Text style={subheading}>
              Congratulations, {hostName} — your property has been reviewed
              and approved by the Funduq team.
            </Text>
          </Section>

          {/* Property Card */}
          <Section style={card}>
            <Text style={cardLabel}>APPROVED LISTING</Text>
            <Text style={cardValue}>{propertyTitle}</Text>
            <Text style={cardMuted}>
              Your property is now visible in our luxury catalogue and ready
              to receive booking requests.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/villas/${propertyId}`}>
              View Your Listing
            </Button>
          </Section>

          {/* Tips */}
          <Section style={tipsSection}>
            <Text style={tipsTitle}>What&apos;s next?</Text>
            <Text style={tipItem}>
              ✦ Ensure your calendar is up to date for accurate availability
            </Text>
            <Text style={tipItem}>
              ✦ Respond to booking requests within 24 hours
            </Text>
            <Text style={tipItem}>
              ✦ Keep your listing details fresh with quality photos
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
  textAlign: "center",
};

const emoji: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 12px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
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
  padding: "24px 40px 16px",
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
  color: "#C5A059",
  margin: "0 0 8px",
};

const cardMuted: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  margin: "0",
  lineHeight: "1.5",
};

const ctaSection: React.CSSProperties = {
  padding: "24px 40px",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#C5A059",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 36px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const tipsSection: React.CSSProperties = {
  backgroundColor: "#faf8f5",
  margin: "0 24px",
  borderRadius: "8px",
  padding: "20px 24px",
};

const tipsTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#1A1A1A",
  margin: "0 0 12px",
};

const tipItem: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b6b6b",
  margin: "0 0 6px",
  lineHeight: "1.5",
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
