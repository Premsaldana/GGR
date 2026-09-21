import React from 'react';
import { Page, Text, View, Document, StyleSheet, renderToStream, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#233B35' },
  subtitle: { fontSize: 12, color: '#666' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #E8E1D6', paddingBottom: 4, marginBottom: 8, color: '#1D2422' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', marginBottom: 4 },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, paddingTop: 4, borderTop: '1px solid #eee' },
  totalLabel: { width: '30%', textAlign: 'right', paddingRight: 10, fontWeight: 'bold' },
  totalValue: { width: '20%', textAlign: 'right', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 10 },
  qrContainer: { alignItems: 'center', marginTop: 20, padding: 10, border: '1px solid #E8E1D6', backgroundColor: '#FFFCF6' },
});

interface InvoicePDFProps {
  invoice: any;
  snapshot: any;
  payments: any[];
  qrArtifact?: any | null;
}

const InvoiceDocument = ({ invoice, snapshot, payments, qrArtifact }: InvoicePDFProps) => {
  const lineItems = snapshot?.input?.lineItems || snapshot?.lineItems || [];
  const resData = snapshot || {};
  
  const additionalPaid = payments.reduce((acc, p) => acc + p.amountMinorUnits, 0);
  const totalPaid = additionalPaid;
  const balance = Math.max(0, invoice.totalMinorUnits - totalPaid);
  const overpayment = totalPaid > invoice.totalMinorUnits ? totalPaid - invoice.totalMinorUnits : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Goa Garden Resort</Text>
            <Text style={styles.subtitle}>Booking Voucher #{invoice.invoiceNumber}</Text>
            <Text style={styles.subtitle}>Issued: {new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>Guest: {resData.guestName}</Text>
            <Text>Reservation: {resData.reservationNumber}</Text>
            <Text>Unit: {resData.unitDisplayName || 'Unit'}</Text>
            <Text>Check-In: {resData.checkInDate || '—'} at {resData.checkInTime || '1:00 PM'}</Text>
            <Text>Check-Out: {resData.checkOutDate || '—'} at {resData.checkOutTime || '11:00 AM'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay Summary</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>{(item.rateMinorUnits / 100).toFixed(2)}</Text>
              <Text style={styles.colAmt}>{(item.amountMinorUnits / 100).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{(invoice.subtotalMinorUnits / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxes:</Text>
            <Text style={styles.totalValue}>{(invoice.taxMinorUnits / 100).toFixed(2)}</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 12 }]}>Total Payable at Check-in:</Text>
            <Text style={[styles.totalValue, { fontSize: 12 }]}>{(invoice.totalMinorUnits / 100).toFixed(2)}</Text>
          </View>
          <Text style={{ textAlign: 'right', marginTop: 4, fontStyle: 'italic', fontSize: 9 }}>
            Amount in Words: {invoice.amountInWords}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text>Payments Received ({payments.length}):</Text>
            <Text>{(additionalPaid / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 10, color: '#d32f2f' }]}>
            <Text style={{ fontWeight: 'bold' }}>Total Payable at Check-in:</Text>
            <Text style={{ fontWeight: 'bold' }}>{(balance / 100).toFixed(2)}</Text>
          </View>
          {overpayment > 0 && (
            <View style={[styles.row, { marginTop: 4, color: '#388e3c' }]}>
              <Text style={{ fontWeight: 'bold' }}>Overpayment:</Text>
              <Text style={{ fontWeight: 'bold' }}>{(overpayment / 100).toFixed(2)}</Text>
            </View>
          )}
        </View>



        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>PROPERTY POLICIES &amp; HOUSE RULES</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Cancellation Policy</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>No cancellation and no refund once booking is confirmed.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Check-In / Check-Out</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Check-In: 1:00 PM | Check-Out: 11:00 AM. Early/late checkout subject to availability &amp; extra charges.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Pets</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Pets are strictly not allowed on the property.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Security Deposit</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Refundable deposit of Rs 5,000 payable at check-in.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Swimming Pool</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Pool hours: 8:00 AM to 8:00 PM. No music after 10:00 PM. Children must be supervised.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Kitchen / Cooking</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>No kitchen available. Cooking inside the villa is not permitted.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Breakfast</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Breakfast is not complimentary and not included.</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Extra Guests</Text>
          <Text style={{ marginBottom: 8, color: '#666' }}>Extra person charge: Rs 800 per head per night.</Text>
        </View>

        <View style={styles.footer}>
          <Text>Queries? Call 91-7813093075 or goagardenresort@gmail.com</Text>
          <Text style={{ marginTop: 2 }}>Thank you for choosing us!</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDFStream(invoice: any, snapshot: any, payments: any[], qrArtifact?: any) {
  return await renderToStream(<InvoiceDocument invoice={invoice} snapshot={snapshot} payments={payments} qrArtifact={qrArtifact} />);
}
