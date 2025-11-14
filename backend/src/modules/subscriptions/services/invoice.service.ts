import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

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

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

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
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
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
