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

interface BookingConfirmedEmailProps {
  guestName: string;
  propertyTitle: string;
  locationEmirate: string;
  locationDistrict: string;
  checkIn: string;
  checkOut: string;
  baseUrl: string;
}

export default function BookingConfirmedEmail({
  guestName,
  propertyTitle,
  locationEmirate,
  locationDistrict,
  checkIn,
  checkOut,
  baseUrl,
}: BookingConfirmedEmailProps) {
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
      <Preview>Your stay at {propertyTitle} is confirmed ✓</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Success Badge */}
          <Section style={heroSection}>
            <Text style={successBadge}>✓ Confirmed</Text>
            <Text style={heading}>
              Your stay is confirmed, {guestName}!
            </Text>
            <Text style={subheading}>
              Get ready for an unforgettable experience
            </Text>
          </Section>

          {/* Property Info */}
          <Section style={card}>
            <Text style={cardLabel}>PROPERTY</Text>
            <Text style={cardValue}>{propertyTitle}</Text>
            <Text style={locationText}>
              {locationDistrict}, {locationEmirate}
            </Text>
          </Section>

          {/* Stay Details */}
          <Section style={card}>
            <Text style={cardLabel}>YOUR STAY</Text>
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={detailLabel}>Check-in</td>
                  <td style={detailValue}>{checkIn}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Check-out</td>
                  <td style={detailValue}>{checkOut}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Info */}
          <Section style={infoSection}>
            <Text style={infoText}>
              Your host will contact you directly — check your bookings page for
              contact details.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/guest/bookings`}>
              View My Booking
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Funduq · Luxury Stays in the UAE
            </Text>
            <Text style={footerMuted}>
              You received this because you made a booking on Funduq.
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

const successBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#e8f5e9",
  color: "#2e7d32",
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
};

const card: React.CSSProperties = {
  padding: "16px 40px",
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
  fontSize: "16px",
  fontWeight: 600,
  color: "#1A1A1A",
  margin: "0 0 4px",
};

const locationText: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  margin: "0",
};

const detailsTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const detailLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  padding: "6px 0",
};

const detailValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1A1A1A",
  padding: "6px 0",
  textAlign: "right",
};

const infoSection: React.CSSProperties = {
  padding: "8px 40px 0",
};

const infoText: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  backgroundColor: "#faf8f5",
  padding: "16px",
  borderRadius: "6px",
  borderLeft: "3px solid #C5A059",
  margin: "0",
  lineHeight: "1.6",
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
