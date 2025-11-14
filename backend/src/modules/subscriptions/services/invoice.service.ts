import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  tenant: {
    name: string;
    email: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly invoicesDir = path.join(process.cwd(), 'invoices');

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {
    // Ensure invoices directory exists
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  /**
   * Create invoice record and generate PDF for a subscription
   */
  async createInvoiceForSubscription(
    subscriptionId: string,
    paymentMethod: string,
  ): Promise<Invoice> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plan = subscription.plan;
    const tenant = subscription.tenant;
    const amount = Number(plan.price);
    const tax = amount * 0.0; // No tax for now, can be configured
    const total = amount + tax;

    // Create invoice record
    const invoice = this.invoiceRepository.create({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      invoiceNumber: this.generateInvoiceNumber(),
      amount,
      tax,
      total,
      currency: 'USD',
      status: InvoiceStatus.PAID,
      invoiceDate: new Date(),
      dueDate: new Date(),
      paidAt: new Date(),
      paymentMethod,
      items: [
        {
          description: `${plan.name} - ${plan.billingCycle} subscription`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Generate and store PDF
    const pdfBuffer = await this.generateInvoicePDF(savedInvoice.id);
    const pdfPath = await this.savePDF(savedInvoice.id, pdfBuffer);

    // Update invoice with PDF URL
    savedInvoice.pdfUrl = pdfPath;
    await this.invoiceRepository.save(savedInvoice);

    this.logger.log(`Invoice ${savedInvoice.invoiceNumber} created for subscription ${subscriptionId}`);

    return savedInvoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['tenant', 'subscription', 'subscription.plan'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get invoices for a tenant
   */
  async getInvoicesForTenant(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      relations: ['subscription', 'subscription.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate PDF for an existing invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);
    const invoiceData = this.prepareInvoiceDataFromRecord(invoice);
    return this.createPDF(invoiceData);
  }

  /**
   * Legacy method - generates PDF without creating invoice record
   */
  async generateInvoice(subscriptionId: string): Promise<Buffer> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'tenant'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const invoiceData = await this.prepareInvoiceData(subscription);
    return this.createPDF(invoiceData);
  }

  async generateInvoiceForPayment(
    tenantId: string,
    planId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<Buffer> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!tenant || !plan) {
      throw new Error('Tenant or plan not found');
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: new Date(),
      dueDate: new Date(),
      tenant: {
        name: tenant.name,
        email: tenant.settings?.email || 'N/A',
        address: tenant.settings?.address,
      },
      items: [
        {
          description: `${plan.name} - ${plan.billingCycle} subscription`,
          quantity: 1,
          unitPrice: Number(amount),
          total: Number(amount),
        },
      ],
      subtotal: Number(amount),
      tax: 0,
      total: Number(amount),
      paymentMethod,
    };

    return this.createPDF(invoiceData);
  }

  /**
   * Prepare invoice data from invoice record
   */
  private prepareInvoiceDataFromRecord(invoice: Invoice): InvoiceData {
    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      tenant: {
        name: invoice.tenant.name,
        email: invoice.tenant.settings?.email || 'N/A',
        address: invoice.tenant.settings?.address,
      },
      items: invoice.items || [],
      subtotal: Number(invoice.amount),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      paymentMethod: invoice.paymentMethod || 'Unknown',
    };
  }

  /**
   * Save PDF to filesystem
   */
  private async savePDF(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
    const filename = `invoice-${invoiceId}.pdf`;
    const filepath = path.join(this.invoicesDir, filename);
    
    await fs.promises.writeFile(filepath, pdfBuffer);
    
    // Return relative path for URL
    return `/invoices/${filename}`;
  }

  private async prepareInvoiceData(
    subscription: Subscription,
  ): Promise<InvoiceData> {
    const plan = subscription.plan;
    const tenant = subscription.tenant;
    const amount = Number(plan.price);

    return {
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: subscription.startDate,
      dueDate: subscription.endDate,
      tenant: {
        name: tenant.name,
        email: tenant.settings?.email || 'N/A',
        address: tenant.settings?.address,
      },
      items: [
        {
          description: `${plan.name} - ${plan.billingCycle} subscription`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      subtotal: amount,
      tax: 0,
      total: amount,
      paymentMethod: this.determinePaymentMethod(subscription),
    };
  }

  private createPDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fontSize(20)
          .text('INVOICE', 50, 50, { align: 'right' })
          .fontSize(10)
          .text(`Invoice #: ${data.invoiceNumber}`, 50, 80, { align: 'right' })
          .text(
            `Date: ${this.formatDate(data.invoiceDate)}`,
            50,
            95,
            { align: 'right' },
          )
          .text(
            `Due Date: ${this.formatDate(data.dueDate)}`,
            50,
            110,
            { align: 'right' },
          );

        // Company info
        doc
          .fontSize(16)
          .text('WhatsApp CRM SaaS', 50, 50)
          .fontSize(10)
          .text('Your Company Address', 50, 75)
          .text('City, State, ZIP', 50, 90)
          .text('contact@whatsappcrm.com', 50, 105);

        // Bill to
        doc
          .fontSize(12)
          .text('Bill To:', 50, 160)
          .fontSize(10)
          .text(data.tenant.name, 50, 180)
          .text(data.tenant.email, 50, 195);

        if (data.tenant.address) {
          doc.text(data.tenant.address, 50, 210);
        }

        // Items table
        const tableTop = 280;
        doc
          .fontSize(10)
          .text('Description', 50, tableTop)
          .text('Qty', 300, tableTop)
          .text('Unit Price', 350, tableTop)
          .text('Total', 450, tableTop);

        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        let yPosition = tableTop + 25;
        data.items.forEach((item) => {
          doc
            .text(item.description, 50, yPosition)
            .text(item.quantity.toString(), 300, yPosition)
            .text(`$${item.unitPrice.toFixed(2)}`, 350, yPosition)
            .text(`$${item.total.toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc
          .text('Subtotal:', 350, yPosition)
          .text(`$${data.subtotal.toFixed(2)}`, 450, yPosition);

        yPosition += 20;
        doc
          .text('Tax:', 350, yPosition)
          .text(`$${data.tax.toFixed(2)}`, 450, yPosition);

        yPosition += 20;
        doc
          .fontSize(12)
          .text('Total:', 350, yPosition)
          .text(`$${data.total.toFixed(2)}`, 450, yPosition);

        // Payment method
        yPosition += 40;
        doc
          .fontSize(10)
          .text(`Payment Method: ${data.paymentMethod}`, 50, yPosition);

        // Footer
        doc
          .fontSize(8)
          .text(
            'Thank you for your business!',
            50,
            700,
            { align: 'center' },
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}-${timestamp}${random}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private determinePaymentMethod(subscription: Subscription): string {
    if (subscription.stripeSubscriptionId) return 'Stripe';
    if (subscription.paypalSubscriptionId) return 'PayPal';
    if (subscription.razorpaySubscriptionId) return 'Razorpay';
    return 'Unknown';
  }
}
