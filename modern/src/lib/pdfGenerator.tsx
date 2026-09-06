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
  const lineItems = snapshot?.lineItems || [];
  const resData = snapshot || {};
  
  const advance = invoice.advanceMinorUnits || 0;
  const additionalPaid = payments.reduce((acc, p) => acc + p.amountMinorUnits, 0);
  const totalPaid = advance + additionalPaid;
  const balance = Math.max(0, invoice.totalMinorUnits - totalPaid);
  const overpayment = totalPaid > invoice.totalMinorUnits ? totalPaid - invoice.totalMinorUnits : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Goa Garden Resort</Text>
            <Text style={styles.subtitle}>Invoice #{invoice.invoiceNumber}</Text>
            <Text style={styles.subtitle}>Issued: {new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>Guest: {resData.guestName}</Text>
            <Text>Reservation: {resData.reservationNumber}</Text>
            <Text>Unit: {resData.unitDisplayName || 'Unit'}</Text>
            <Text>Check-In: {resData.checkInDate}</Text>
            <Text>Check-Out: {resData.checkOutDate}</Text>
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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Security Deposit (Refundable):</Text>
            <Text style={styles.totalValue}>{(invoice.securityDepositMinorUnits / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 12 }]}>Invoice Total:</Text>
            <Text style={[styles.totalValue, { fontSize: 12 }]}>{(invoice.totalMinorUnits / 100).toFixed(2)}</Text>
          </View>
          <Text style={{ textAlign: 'right', marginTop: 4, fontStyle: 'italic', fontSize: 9 }}>
            Amount in Words: {invoice.amountInWords}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text>Advance Paid:</Text>
            <Text>{(advance / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Additional Payments ({payments.length}):</Text>
            <Text>{(additionalPaid / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontWeight: 'bold' }}>Total Paid:</Text>
            <Text style={{ fontWeight: 'bold' }}>{(totalPaid / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 10, color: '#d32f2f' }]}>
            <Text style={{ fontWeight: 'bold' }}>Remaining Balance:</Text>
            <Text style={{ fontWeight: 'bold' }}>{(balance / 100).toFixed(2)}</Text>
          </View>
          {overpayment > 0 && (
            <View style={[styles.row, { marginTop: 4, color: '#388e3c' }]}>
              <Text style={{ fontWeight: 'bold' }}>Overpayment:</Text>
              <Text style={{ fontWeight: 'bold' }}>{(overpayment / 100).toFixed(2)}</Text>
            </View>
          )}
        </View>

        {qrArtifact && (
          <View style={styles.qrContainer}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Payment Request</Text>
            <Text style={{ marginBottom: 4 }}>Please scan via UPI to pay ₹{(qrArtifact.amountMinorUnits / 100).toFixed(2)}</Text>
            <Text style={{ fontSize: 8, color: '#666' }}>Note: QR generation does not prove payment.</Text>
            {/* Note: We would ideally render the QR code image here. For @react-pdf/renderer we need a PNG/JPG. Since we generate SVG client-side, we omit the graphic or use an external URL. */}
            <Text style={{ fontSize: 8, marginTop: 4 }}>UPI ID: {qrArtifact.upiId}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Goa Garden Resort - Thank you for your stay!</Text>
          <Text>This is a computer-generated document and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDFStream(invoice: any, snapshot: any, payments: any[], qrArtifact?: any) {
  return await renderToStream(<InvoiceDocument invoice={invoice} snapshot={snapshot} payments={payments} qrArtifact={qrArtifact} />);
}
