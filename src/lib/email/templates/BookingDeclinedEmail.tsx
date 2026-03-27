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

interface BookingDeclinedEmailProps {
  guestName: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  baseUrl: string;
}

export default function BookingDeclinedEmail({
  guestName,
  propertyTitle,
  checkIn,
  checkOut,
  baseUrl,
}: BookingDeclinedEmailProps) {
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
      <Preview>Update on your booking request for {propertyTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Header */}
          <Section style={heroSection}>
            <Text style={heading}>
              Hi {guestName},
            </Text>
            <Text style={subheading}>
              We have an update on your booking request
            </Text>
          </Section>

          {/* Message */}
          <Section style={messageSection}>
            <Text style={messageText}>
              Unfortunately, <strong>{propertyTitle}</strong> is not available
              for your selected dates ({checkIn} – {checkOut}).
            </Text>
            <Text style={encourageText}>
              Don&apos;t worry — the UAE has hundreds of stunning luxury villas
              waiting for you. We&apos;re confident you&apos;ll find the perfect
              stay.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/villas`}>
              Find Similar Villas
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you made a booking request on Funduq.
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

const messageSection: React.CSSProperties = {
  padding: "16px 40px",
};

const messageText: React.CSSProperties = {
  fontSize: "15px",
  color: "#1A1A1A",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const encourageText: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
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
