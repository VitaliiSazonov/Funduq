import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Font,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface BookingRequestEmailProps {
  guestName: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  totalNights: number;
  estimatedPrice: string;
  baseUrl: string;
}

export default function BookingRequestEmail({
  guestName,
  propertyTitle,
  checkIn,
  checkOut,
  totalGuests,
  totalNights,
  estimatedPrice,
  baseUrl,
}: BookingRequestEmailProps) {
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
      <Preview>New booking request for {propertyTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>FUNDUQ</Text>
          </Section>

          <Hr style={divider} />

          {/* Header */}
          <Section style={heroSection}>
            <Text style={heading}>New Booking Request</Text>
            <Text style={subheading}>
              A guest wants to stay at your property
            </Text>
          </Section>

          {/* Property */}
          <Section style={card}>
            <Text style={cardLabel}>PROPERTY</Text>
            <Text style={cardValue}>{propertyTitle}</Text>
          </Section>

          {/* Guest */}
          <Section style={card}>
            <Text style={cardLabel}>GUEST</Text>
            <Section style={{ display: "flex", alignItems: "center" }}>
              <Img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=C5A059&color=fff&size=40&bold=true`}
                width="40"
                height="40"
                alt={guestName}
                style={avatar}
              />
              <Text style={guestNameText}>{guestName}</Text>
            </Section>
          </Section>

          {/* Stay Details */}
          <Section style={card}>
            <Text style={cardLabel}>STAY DETAILS</Text>
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
                <tr>
                  <td style={detailLabel}>Guests</td>
                  <td style={detailValue}>{totalGuests}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Duration</td>
                  <td style={detailValue}>
                    {totalNights} night{totalNights !== 1 ? "s" : ""}
                  </td>
                </tr>
                <tr>
                  <td style={detailLabel}>Est. Total</td>
                  <td style={detailValueGold}>{estimatedPrice}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${baseUrl}/host/bookings`}>
              Review Request
            </Button>
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
  margin: "0",
};

const avatar: React.CSSProperties = {
  borderRadius: "50%",
  verticalAlign: "middle",
  marginRight: "12px",
};

const guestNameText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#1A1A1A",
  margin: "0",
  display: "inline",
  verticalAlign: "middle",
};

const detailsTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const detailLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b6b6b",
  padding: "6px 0",
  verticalAlign: "top",
};

const detailValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1A1A1A",
  padding: "6px 0",
  textAlign: "right",
};

const detailValueGold: React.CSSProperties = {
  ...detailValue,
  color: "#C5A059",
  fontSize: "16px",
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
