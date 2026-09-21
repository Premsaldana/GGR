import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToStream } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontFamily: 'Helvetica', 
    fontSize: 9, 
    color: '#1D2422', 
    backgroundColor: '#ffffff' 
  },
  // --- Header ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1.5px solid #233B35',
    paddingBottom: 15,
    marginBottom: 20
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#233B35',
    marginBottom: 2
  },
  brandSub: {
    fontSize: 9,
    color: '#718779',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B75E3C',
    textTransform: 'uppercase',
    textAlign: 'right',
    marginBottom: 4
  },
  voucherMeta: {
    fontSize: 9,
    color: '#55675D',
    textAlign: 'right',
    marginBottom: 2
  },

  // --- Intro ---
  introText: {
    fontSize: 10,
    color: '#55675D',
    marginBottom: 20,
    lineHeight: 1.4
  },

  // --- Grid / Cards ---
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    border: '1px solid #E8E1D6',
    backgroundColor: '#FFFCF6',
    borderRadius: 4,
    padding: 10
  },
  detailsCol: {
    width: '24%',
  },
  detailsLabel: {
    fontSize: 8,
    color: '#718779',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4
  },
  detailsValue: {
    fontSize: 10,
    color: '#1D2422',
    fontWeight: 'bold'
  },
  detailsSub: {
    fontSize: 8,
    color: '#718779',
    marginTop: 2
  },

  // --- Tables ---
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#233B35',
    borderBottom: '1px solid #233B35',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #E8E1D6',
    paddingBottom: 4,
    marginBottom: 6,
  },
  thText: {
    fontSize: 8,
    color: '#718779',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: '1px solid #F5F1E9'
  },
  tdText: {
    fontSize: 9,
    color: '#1D2422'
  },
  
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },

  // --- Totals ---
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20
  },
  totalsBox: {
    width: '45%',
    backgroundColor: '#FFFCF6',
    border: '1px solid #E8E1D6',
    padding: 10,
    borderRadius: 4
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  totalLabel: {
    color: '#55675D',
    fontSize: 9
  },
  totalValue: {
    color: '#1D2422',
    fontSize: 9,
    fontWeight: 'bold'
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTop: '1px solid #E8E1D6'
  },
  grandTotalLabel: {
    color: '#B75E3C',
    fontSize: 11,
    fontWeight: 'bold'
  },
  grandTotalValue: {
    color: '#B75E3C',
    fontSize: 11,
    fontWeight: 'bold'
  },
  amountInWords: {
    fontSize: 8,
    color: '#718779',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 4
  },

  // --- Payment Summary ---
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  paymentBox: {
    width: '48%',
    border: '1px solid #E8E1D6',
    padding: 10,
    borderRadius: 4
  },

  // --- Policies ---
  policySection: {
    backgroundColor: '#FFFCF6',
    border: '1px solid #E8E1D6',
    padding: 10,
    borderRadius: 4
  },
  policyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  policyItem: {
    width: '48%',
    marginBottom: 6
  },
  policyHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#233B35',
    marginBottom: 2
  },
  policyText: {
    fontSize: 7.5,
    color: '#55675D',
    lineHeight: 1.3
  },

  // --- Footer ---
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1px solid #E8E1D6',
    paddingTop: 10
  },
  footerText: {
    fontSize: 8,
    color: '#718779',
    marginBottom: 2
  }
});

interface InvoicePDFProps {
  invoice: any;
  snapshot: any;
  payments: any[];
}

const InvoiceDocument = ({ invoice, snapshot, payments }: InvoicePDFProps) => {
  const lineItems = snapshot?.input?.lineItems || snapshot?.lineItems || [];
  const resData = snapshot || {};
  
  const additionalPaid = payments.reduce((acc, p) => acc + p.amountMinorUnits, 0);
  const balance = Math.max(0, invoice.totalMinorUnits - additionalPaid);
  const overpayment = additionalPaid > invoice.totalMinorUnits ? additionalPaid - invoice.totalMinorUnits : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandName}>Goa Garden Resort</Text>
            <Text style={styles.brandSub}>Private Pool Villa • Colva, South Goa</Text>
          </View>
          <View>
            <Text style={styles.voucherTitle}>Booking Voucher</Text>
            <Text style={styles.voucherMeta}>Ref: {invoice.invoiceNumber}</Text>
            <Text style={styles.voucherMeta}>Issued: {new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Intro */}
        <Text style={styles.introText}>
          Dear {resData.guestName || 'Guest'},{'\n'}
          Thank you for choosing Goa Garden Resort. We are delighted to confirm your booking. Please review your stay details and voucher summary below. We look forward to welcoming you.
        </Text>

        {/* Reservation Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsLabel}>Property</Text>
            <Text style={styles.detailsValue}>{resData.unitDisplayName || 'Unit'}</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsLabel}>Check-In</Text>
            <Text style={styles.detailsValue}>{resData.checkInDate || '—'}</Text>
            <Text style={styles.detailsSub}>at 1:00 PM</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsLabel}>Check-Out</Text>
            <Text style={styles.detailsValue}>{resData.checkOutDate || '—'}</Text>
            <Text style={styles.detailsSub}>at 11:00 AM</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsLabel}>Guests</Text>
            <Text style={styles.detailsValue}>
              {resData.adults ? `${resData.adults} Adults` : '-'}
            </Text>
            <Text style={styles.detailsSub}>
              {resData.children ? `${resData.children} Children` : '0 Children'}
            </Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.col1]}>Description</Text>
            <Text style={[styles.thText, styles.col2]}>Qty / Nights</Text>
            <Text style={[styles.thText, styles.col3]}>Rate (INR)</Text>
            <Text style={[styles.thText, styles.col4]}>Amount (INR)</Text>
          </View>
          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tdText, styles.col1]}>{item.description}</Text>
              <Text style={[styles.tdText, styles.col2]}>{item.quantity}</Text>
              <Text style={[styles.tdText, styles.col3]}>{(item.rateMinorUnits / 100).toFixed(2)}</Text>
              <Text style={[styles.tdText, styles.col4, { fontWeight: 'bold' }]}>{(item.amountMinorUnits / 100).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Box */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{(invoice.subtotalMinorUnits / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST / Taxes</Text>
              <Text style={styles.totalValue}>{(invoice.taxMinorUnits / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{(invoice.totalMinorUnits / 100).toFixed(2)}</Text>
            </View>
            <Text style={styles.amountInWords}>{invoice.amountInWords}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          padding: 12,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#166534',
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Payment Completed
          </Text>
        </View>

        {/* Policies */}
        <View style={styles.policySection} wrap={false}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', marginBottom: 4, fontSize: 10 }]}>Property Policies & House Rules</Text>
          <View style={styles.policyGrid}>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Cancellation</Text>
              <Text style={styles.policyText}>No cancellation and no refund once confirmed.</Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Timings</Text>
              <Text style={styles.policyText}>Check-In at 1:00 PM. Check-Out at 11:00 AM.</Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Security Deposit</Text>
              <Text style={styles.policyText}>Refundable deposit of Rs 5,000 payable at check-in.</Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Swimming Pool</Text>
              <Text style={styles.policyText}>8:00 AM - 8:00 PM. No music after 10:00 PM.</Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Kitchen / Cooking</Text>
              <Text style={styles.policyText}>Cooking inside the villa is not permitted.</Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyHeading}>Extra Guests</Text>
              <Text style={styles.policyText}>Extra person charge: Rs 800 per head per night.</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Thank you for choosing Goa Garden Resort!</Text>
          <Text style={styles.footerText}>Queries? Call 91-7813093075 or goagardenresort@gmail.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDFStream(invoice: any, snapshot: any, payments: any[], qrArtifact?: any) {
  return await renderToStream(<InvoiceDocument invoice={invoice} snapshot={snapshot} payments={payments} />);
}
