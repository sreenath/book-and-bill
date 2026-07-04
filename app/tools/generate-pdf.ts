import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import {
  getInvoices,
  getQuotes,
} from '../scheduler.js';
import { ACTIVE_CONFIG } from '../config/business-config.js';

const INVOICES_DIR = path.resolve(process.cwd(), 'data', 'invoices');

function ensureInvoicesDirExists() {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
}

export function generateDocumentPdf(
  id: string,
  type: 'invoice' | 'quote'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  return new Promise((resolve) => {
    ensureInvoicesDirExists();

    let details: {
      title: string;
      idLabel: string;
      customerName: string;
      customerPhone: string;
      serviceName: string;
      price: number;
      tax: number;
      total: number;
      date: string;
    };

    if (type === 'invoice') {
      const invoices = getInvoices();
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) {
        return resolve({ success: false, error: `Invoice '${id}' not found.` });
      }
      details = {
        title: 'INVOICE',
        idLabel: 'Invoice ID',
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        serviceName: invoice.serviceName,
        price: invoice.price,
        tax: invoice.tax,
        total: invoice.total,
        date: invoice.date,
      };
    } else {
      const quotes = getQuotes();
      const quote = quotes.find(q => q.id === id);
      if (!quote) {
        return resolve({ success: false, error: `Quote '${id}' not found.` });
      }
      details = {
        title: 'PRICE QUOTE',
        idLabel: 'Quote ID',
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        serviceName: quote.serviceName,
        price: quote.price,
        tax: quote.tax,
        total: quote.total,
        date: quote.date,
      };
    }

    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `${id}.pdf`;
      const filePath = path.join(INVOICES_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Business Header
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a1a').text(ACTIVE_CONFIG.name, { align: 'center' });
      doc.font('Helvetica').fontSize(10).fillColor('#666666').text('Salon Service & Booking System', { align: 'center' });
      doc.moveDown(2);

      // Document Title
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#2c3e50').text(details.title, { align: 'left' });
      doc.moveDown(1);

      // Metadata Table/Box
      doc.font('Helvetica').fontSize(10).fillColor('#333333');
      doc.text(`${details.idLabel}: ${id}`);
      doc.text(`Date: ${details.date}`);
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Customer Details
      doc.font('Helvetica-Bold').fontSize(12).text('Customer Information');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Name: ${details.customerName}`);
      doc.text(`Phone: ${details.customerPhone}`);
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Service Details Table
      doc.font('Helvetica-Bold').fontSize(12).text('Booking Summary');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 450, tableTop, { align: 'right' });

      doc.strokeColor('#ecf0f1').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.moveDown(0.8);

      doc.font('Helvetica').fontSize(10);
      const itemY = doc.y;
      doc.text(details.serviceName, 50, itemY);
      doc.text(`$${details.price.toFixed(2)}`, 450, itemY, { align: 'right' });
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Totals
      const totalsY = doc.y;
      doc.text('Subtotal:', 350, totalsY);
      doc.text(`$${details.price.toFixed(2)}`, 450, totalsY, { align: 'right' });

      doc.text('Tax (10%):', 350, totalsY + 15);
      doc.text(`$${details.tax.toFixed(2)}`, 450, totalsY + 15, { align: 'right' });

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total:', 350, totalsY + 35);
      doc.text(`$${details.total.toFixed(2)}`, 450, totalsY + 35, { align: 'right' });

      // Footer
      doc.moveDown(4);
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#7f8c8d').text('Thank you for choosing our salon!', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
        resolve({ success: true, filePath: fileUrl });
      });

      writeStream.on('error', (err) => {
        resolve({ success: false, error: `Failed to write PDF file: ${err.message}` });
      });
    } catch (err: any) {
      resolve({ success: false, error: `Failed to generate PDF: ${err.message}` });
    }
  });
}

export const generatePdf = new FunctionTool({
  name: 'generate_pdf',
  description: 'Generates a downloadable PDF for an invoice or quote.',
  parameters: z.object({
    invoiceId: z.string().optional().describe('The ID of the invoice to generate PDF for (e.g. "INV-1234").'),
    quoteId: z.string().optional().describe('The ID of the quote to generate PDF for (e.g. "QT-5678").'),
  }),
  execute: async ({ invoiceId, quoteId }) => {
    if (!invoiceId && !quoteId) {
      return { status: 'error', message: 'You must provide either an invoiceId or a quoteId.' };
    }

    if (invoiceId) {
      const result = await generateDocumentPdf(invoiceId, 'invoice');
      if (result.success) {
        return { status: 'success', message: `PDF generated successfully. You can download/open it here: ${result.filePath}`, filePath: result.filePath };
      } else {
        return { status: 'error', message: result.error };
      }
    } else {
      const result = await generateDocumentPdf(quoteId!, 'quote');
      if (result.success) {
        return { status: 'success', message: `PDF generated successfully. You can download/open it here: ${result.filePath}`, filePath: result.filePath };
      } else {
        return { status: 'error', message: result.error };
      }
    }
  },
});
