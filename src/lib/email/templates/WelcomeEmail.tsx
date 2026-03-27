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

interface WelcomeEmailProps {
  firstName: string;
  role: "guest" | "host";
  baseUrl: string;
}

export default function WelcomeEmail({
  firstName,
  role,
  baseUrl,
}: WelcomeEmailProps) {
  const isHost = role === "host";

  const tagline = isHost
    ? "Complete your first listing and reach thousands of guests"
    : "Start exploring luxury villas across the UAE";

  const ctaLabel = isHost ? "Add Your Property" : "Explore Villas";
  const ctaHref = isHost
    ? `${baseUrl}/host/properties/new`
    : `${baseUrl}/villas`;

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
      <Preview>Welcome to Funduq — luxury stays in the UAE</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={welcomeBadge}>✦ Welcome</Text>
            <Text style={heading}>
              Welcome, {firstName}
            </Text>
            <Text style={subheading}>{tagline}</Text>
          </Section>

          {/* Role-specific message */}
          <Section style={messageSection}>
            {isHost ? (
              <Text style={messageText}>
                Thank you for joining Funduq as a property host. Our platform
                connects you with discerning travelers seeking premium
                accommodations in the UAE. List your villa, manage booking
                requests, and grow your hospitality business — all in one place.
              </Text>
            ) : (
              <Text style={messageText}>
                Thank you for joining Funduq. From oceanfront penthouses in
                Dubai Marina to tranquil desert retreats in Abu Dhabi — discover
                handpicked luxury villas for your next escape in the UAE.
              </Text>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={ctaHref}>
              {ctaLabel}
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you created an account on Funduq.
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

const welcomeBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#fdf6e8",
  color: "#C5A059",
  fontSize: "13px",
  fontWeight: 600,
  padding: "4px 12px",
  borderRadius: "20px",
  margin: "0 0 16px",
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
  lineHeight: "1.6",
};

const messageSection: React.CSSProperties = {
  padding: "16px 40px",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4a4a4a",
  lineHeight: "1.7",
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
