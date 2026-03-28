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

export interface PassportRejectedEmailProps {
  guestName: string;
  baseUrl: string;
  reason?: string;
}

export default function PassportRejectedEmail({
  guestName,
  baseUrl,
  reason,
}: PassportRejectedEmailProps) {
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
      <Preview>Your identity document needs to be re-submitted on Funduq.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={emoji}>📋</Text>
            <Text style={heading}>Document Not Accepted</Text>
            <Text style={subheading}>
              Hi {guestName}, our team was unable to verify your identity from
              the document you submitted. This could be due to a blurry image,
              an unsupported format, or an incomplete document.
            </Text>
          </Section>

          {/* Info Card */}
          <Section style={card}>
            <Text style={cardLabel}>WHAT TO DO</Text>
            {reason && (
              <Text style={reasonText}>
                <strong>Reason:</strong> {reason}
              </Text>
            )}
            <Text style={cardMuted}>
              Please upload a clear, readable photo or scan of your passport,
              national ID, or Emirates ID. Accepted formats are JPG, PNG, or
              PDF (max 10 MB).
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/`}>
              Re-Submit Document
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you submitted identity verification on Funduq.
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

const cardMuted: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  margin: "0",
  lineHeight: "1.5",
};

const reasonText: React.CSSProperties = {
  fontSize: "14px",
  color: "#dc2626",
  margin: "0 0 12px",
  lineHeight: "1.5",
  padding: "10px 14px",
  backgroundColor: "rgba(239, 68, 68, 0.06)",
  borderRadius: "6px",
  border: "1px solid rgba(239, 68, 68, 0.12)",
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
