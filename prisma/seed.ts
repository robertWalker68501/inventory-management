import 'dotenv/config';

import { generateId } from '@better-auth/core/utils/id';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

import { PrismaClient } from '../app/generated/prisma/client';

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? 'Password123!';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function createAuthUser(data: {
  name: string;
  email: string;
  password?: string;
}) {
  const id = generateId();
  const password = await hashPassword(data.password ?? DEFAULT_PASSWORD);

  return prisma.user.create({
    data: {
      id,
      name: data.name,
      email: data.email.toLowerCase(),
      emailVerified: true,
      accounts: {
        create: {
          id: generateId(),
          accountId: id,
          providerId: 'credential',
          password,
        },
      },
    },
  });
}

async function clearDatabase() {
  await prisma.activityLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.shipmentLine.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.receivingLine.deleteMany();
  await prisma.receiving.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryStock.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.stockLocation.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tenantInvitation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.verification.deleteMany();
}

async function main() {
  console.log('Clearing existing data...');
  await clearDatabase();

  console.log('Creating users...');
  const [acmeOwner, acmeAdmin, acmeManager, acmeStaff, acmeViewer, globalOwner] =
    await Promise.all([
      createAuthUser({
        name: 'Alex Owner',
        email: 'owner@acme.test',
      }),
      createAuthUser({
        name: 'Avery Admin',
        email: 'admin@acme.test',
      }),
      createAuthUser({
        name: 'Morgan Manager',
        email: 'manager@acme.test',
      }),
      createAuthUser({
        name: 'Sam Staff',
        email: 'staff@acme.test',
      }),
      createAuthUser({
        name: 'Riley Viewer',
        email: 'viewer@acme.test',
      }),
      createAuthUser({
        name: 'Jordan Global',
        email: 'owner@global.test',
      }),
    ]);

  console.log('Creating tenants...');
  const acme = await prisma.tenant.create({
    data: {
      name: 'Acme Logistics',
      slug: 'acme-logistics',
    },
  });

  const globalParts = await prisma.tenant.create({
    data: {
      name: 'Global Parts Co',
      slug: 'global-parts',
    },
  });

  console.log('Creating memberships...');
  await prisma.membership.createMany({
    data: [
      { tenantId: acme.id, userId: acmeOwner.id, role: 'OWNER' },
      { tenantId: acme.id, userId: acmeAdmin.id, role: 'ADMIN' },
      { tenantId: acme.id, userId: acmeManager.id, role: 'MANAGER' },
      { tenantId: acme.id, userId: acmeStaff.id, role: 'STAFF' },
      { tenantId: acme.id, userId: acmeViewer.id, role: 'VIEWER' },
      { tenantId: globalParts.id, userId: globalOwner.id, role: 'OWNER' },
      { tenantId: globalParts.id, userId: acmeOwner.id, role: 'ADMIN' },
    ],
  });

  console.log('Creating warehouses and stock locations...');
  const acmeMain = await prisma.warehouse.create({
    data: {
      tenantId: acme.id,
      name: 'Main Distribution Center',
      code: 'WH-MAIN',
      address: '1200 Industrial Blvd',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    },
  });

  const acmeWest = await prisma.warehouse.create({
    data: {
      tenantId: acme.id,
      name: 'West Coast Hub',
      code: 'WH-WEST',
      address: '450 Harbor Way',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90012',
      country: 'US',
    },
  });

  const globalWarehouse = await prisma.warehouse.create({
    data: {
      tenantId: globalParts.id,
      name: 'Central Warehouse',
      code: 'WH-CENTRAL',
      address: '88 Commerce Park',
      city: 'Dallas',
      state: 'TX',
      postalCode: '75201',
      country: 'US',
    },
  });

  const [mainA101, mainA102, mainB201, westC101, globalA101] =
    await Promise.all([
      prisma.stockLocation.create({
        data: {
          tenantId: acme.id,
          warehouseId: acmeMain.id,
          name: 'A-01-01',
          aisle: 'A',
          rack: '01',
          bin: '01',
        },
      }),
      prisma.stockLocation.create({
        data: {
          tenantId: acme.id,
          warehouseId: acmeMain.id,
          name: 'A-01-02',
          aisle: 'A',
          rack: '01',
          bin: '02',
        },
      }),
      prisma.stockLocation.create({
        data: {
          tenantId: acme.id,
          warehouseId: acmeMain.id,
          name: 'B-02-01',
          aisle: 'B',
          rack: '02',
          bin: '01',
        },
      }),
      prisma.stockLocation.create({
        data: {
          tenantId: acme.id,
          warehouseId: acmeWest.id,
          name: 'C-01-01',
          aisle: 'C',
          rack: '01',
          bin: '01',
        },
      }),
      prisma.stockLocation.create({
        data: {
          tenantId: globalParts.id,
          warehouseId: globalWarehouse.id,
          name: 'A-01-01',
          aisle: 'A',
          rack: '01',
          bin: '01',
        },
      }),
    ]);

  console.log('Creating inventory items...');
  const [widgetA, widgetB, gadgetC, partD, boltKit, globalMotor] =
    await Promise.all([
      prisma.inventoryItem.create({
        data: {
          tenantId: acme.id,
          sku: 'SKU-1001',
          name: 'Widget A',
          description: 'Standard warehouse widget',
          category: 'Widgets',
          unitOfMeasure: 'each',
          reorderPoint: 50,
          barcode: '1001001001001',
          status: 'ACTIVE',
        },
      }),
      prisma.inventoryItem.create({
        data: {
          tenantId: acme.id,
          sku: 'SKU-1002',
          name: 'Widget B',
          description: 'Heavy-duty widget',
          category: 'Widgets',
          unitOfMeasure: 'each',
          reorderPoint: 30,
          barcode: '1001001001002',
          status: 'ACTIVE',
        },
      }),
      prisma.inventoryItem.create({
        data: {
          tenantId: acme.id,
          sku: 'SKU-1003',
          name: 'Gadget C',
          description: 'Compact gadget assembly',
          category: 'Gadgets',
          unitOfMeasure: 'each',
          reorderPoint: 25,
          barcode: '1001001001003',
          status: 'ACTIVE',
        },
      }),
      prisma.inventoryItem.create({
        data: {
          tenantId: acme.id,
          sku: 'SKU-1004',
          name: 'Part D',
          description: 'Discontinued replacement part',
          category: 'Parts',
          unitOfMeasure: 'each',
          reorderPoint: 0,
          status: 'INACTIVE',
        },
      }),
      prisma.inventoryItem.create({
        data: {
          tenantId: acme.id,
          sku: 'SKU-2001',
          name: 'Bolt Kit',
          description: 'Assorted bolts and fasteners',
          category: 'Hardware',
          unitOfMeasure: 'kit',
          reorderPoint: 20,
          barcode: '1001001002001',
          status: 'ACTIVE',
        },
      }),
      prisma.inventoryItem.create({
        data: {
          tenantId: globalParts.id,
          sku: 'GP-MOTOR-01',
          name: 'Industrial Motor',
          description: '3-phase industrial motor',
          category: 'Motors',
          unitOfMeasure: 'each',
          reorderPoint: 10,
          barcode: '2002002002001',
          status: 'ACTIVE',
        },
      }),
    ]);

  console.log('Creating inventory stock...');
  await prisma.inventoryStock.createMany({
    data: [
      {
        tenantId: acme.id,
        inventoryItemId: widgetA.id,
        stockLocationId: mainA101.id,
        quantityOnHand: 120,
        quantityReserved: 15,
        quantityIncoming: 0,
      },
      {
        tenantId: acme.id,
        inventoryItemId: widgetA.id,
        stockLocationId: mainA102.id,
        quantityOnHand: 80,
        quantityReserved: 0,
        quantityIncoming: 50,
      },
      {
        tenantId: acme.id,
        inventoryItemId: widgetB.id,
        stockLocationId: mainB201.id,
        quantityOnHand: 45,
        quantityReserved: 10,
        quantityIncoming: 0,
      },
      {
        tenantId: acme.id,
        inventoryItemId: gadgetC.id,
        stockLocationId: mainA101.id,
        quantityOnHand: 8,
        quantityReserved: 2,
        quantityIncoming: 40,
      },
      {
        tenantId: acme.id,
        inventoryItemId: boltKit.id,
        stockLocationId: westC101.id,
        quantityOnHand: 35,
        quantityReserved: 0,
        quantityIncoming: 0,
      },
      {
        tenantId: globalParts.id,
        inventoryItemId: globalMotor.id,
        stockLocationId: globalA101.id,
        quantityOnHand: 24,
        quantityReserved: 4,
        quantityIncoming: 0,
      },
    ],
  });

  console.log('Creating suppliers...');
  const [fastSupply, northernComponents, globalSupply] = await Promise.all([
    prisma.supplier.create({
      data: {
        tenantId: acme.id,
        name: 'FastSupply Inc',
        email: 'orders@fastsupply.test',
        phone: '+1-312-555-0100',
        address: '500 Vendor Lane, Chicago, IL',
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: acme.id,
        name: 'Northern Components',
        email: 'sales@northern.test',
        phone: '+1-612-555-0200',
        address: '77 Lake St, Minneapolis, MN',
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: globalParts.id,
        name: 'Global Supply Partners',
        email: 'procurement@globalsupply.test',
        phone: '+1-214-555-0300',
        address: '12 Trade Center, Dallas, TX',
      },
    }),
  ]);

  console.log('Creating purchase orders...');
  const poSubmitted = await prisma.purchaseOrder.create({
    data: {
      tenantId: acme.id,
      supplierId: fastSupply.id,
      number: 'PO-0001',
      status: 'SUBMITTED',
      orderedAt: new Date('2026-06-10'),
      expectedAt: new Date('2026-06-25'),
      notes: 'Restock widgets and gadgets',
      createdById: acmeManager.id,
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetA.id,
            quantityOrdered: 100,
            quantityReceived: 0,
            unitCost: '12.50',
          },
          {
            tenantId: acme.id,
            inventoryItemId: gadgetC.id,
            quantityOrdered: 50,
            quantityReceived: 0,
            unitCost: '24.00',
          },
        ],
      },
    },
    include: { lines: true },
  });

  const poReceived = await prisma.purchaseOrder.create({
    data: {
      tenantId: acme.id,
      supplierId: northernComponents.id,
      number: 'PO-0002',
      status: 'RECEIVED',
      orderedAt: new Date('2026-05-20'),
      expectedAt: new Date('2026-06-01'),
      createdById: acmeAdmin.id,
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetB.id,
            quantityOrdered: 60,
            quantityReceived: 60,
            unitCost: '18.75',
          },
          {
            tenantId: acme.id,
            inventoryItemId: boltKit.id,
            quantityOrdered: 40,
            quantityReceived: 40,
            unitCost: '9.99',
          },
        ],
      },
    },
    include: { lines: true },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: acme.id,
      supplierId: fastSupply.id,
      number: 'PO-0003',
      status: 'DRAFT',
      notes: 'Pending approval',
      createdById: acmeManager.id,
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetA.id,
            quantityOrdered: 25,
            unitCost: '12.50',
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      tenantId: globalParts.id,
      supplierId: globalSupply.id,
      number: 'PO-0001',
      status: 'SUBMITTED',
      orderedAt: new Date('2026-06-15'),
      expectedAt: new Date('2026-07-01'),
      createdById: globalOwner.id,
      lines: {
        create: [
          {
            tenantId: globalParts.id,
            inventoryItemId: globalMotor.id,
            quantityOrdered: 12,
            unitCost: '450.00',
          },
        ],
      },
    },
  });

  console.log('Creating receivings...');
  const receivingCompleted = await prisma.receiving.create({
    data: {
      tenantId: acme.id,
      warehouseId: acmeMain.id,
      purchaseOrderId: poReceived.id,
      number: 'REC-0001',
      status: 'COMPLETED',
      receivedAt: new Date('2026-06-02'),
      receivedById: acmeStaff.id,
      notes: 'Full delivery against PO-0002',
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetB.id,
            purchaseOrderLineId: poReceived.lines[0].id,
            stockLocationId: mainB201.id,
            quantityReceived: 60,
          },
          {
            tenantId: acme.id,
            inventoryItemId: boltKit.id,
            purchaseOrderLineId: poReceived.lines[1].id,
            stockLocationId: westC101.id,
            quantityReceived: 40,
          },
        ],
      },
    },
  });

  await prisma.receiving.create({
    data: {
      tenantId: acme.id,
      warehouseId: acmeMain.id,
      purchaseOrderId: poSubmitted.id,
      number: 'REC-0002',
      status: 'DRAFT',
      notes: 'Awaiting delivery for PO-0001',
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetA.id,
            purchaseOrderLineId: poSubmitted.lines[0].id,
            stockLocationId: mainA102.id,
            quantityReceived: 0,
          },
        ],
      },
    },
  });

  console.log('Creating orders and shipments...');
  const orderConfirmed = await prisma.order.create({
    data: {
      tenantId: acme.id,
      number: 'ORD-0001',
      status: 'CONFIRMED',
      orderedAt: new Date('2026-06-18'),
      createdById: acmeManager.id,
      notes: 'Customer order #4421',
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: widgetA.id,
            quantityOrdered: 20,
            quantityPicked: 0,
            quantityShipped: 0,
          },
          {
            tenantId: acme.id,
            inventoryItemId: widgetB.id,
            quantityOrdered: 10,
            quantityPicked: 0,
            quantityShipped: 0,
          },
        ],
      },
    },
    include: { lines: true },
  });

  const orderShipped = await prisma.order.create({
    data: {
      tenantId: acme.id,
      number: 'ORD-0002',
      status: 'SHIPPED',
      orderedAt: new Date('2026-06-05'),
      createdById: acmeAdmin.id,
      lines: {
        create: [
          {
            tenantId: acme.id,
            inventoryItemId: boltKit.id,
            quantityOrdered: 5,
            quantityPicked: 5,
            quantityShipped: 5,
          },
        ],
      },
    },
    include: { lines: true },
  });

  const shipmentDelivered = await prisma.shipment.create({
    data: {
      tenantId: acme.id,
      orderId: orderShipped.id,
      warehouseId: acmeWest.id,
      number: 'SHP-0001',
      status: 'DELIVERED',
      shippedAt: new Date('2026-06-07'),
      trackingNumber: '1Z999AA10123456784',
      shippedById: acmeStaff.id,
      lines: {
        create: [
          {
            tenantId: acme.id,
            orderLineId: orderShipped.lines[0].id,
            inventoryItemId: boltKit.id,
            quantityShipped: 5,
          },
        ],
      },
    },
  });

  await prisma.shipment.create({
    data: {
      tenantId: acme.id,
      orderId: orderConfirmed.id,
      warehouseId: acmeMain.id,
      number: 'SHP-0002',
      status: 'DRAFT',
      notes: 'Pending pick for ORD-0001',
      lines: {
        create: [
          {
            tenantId: acme.id,
            orderLineId: orderConfirmed.lines[0].id,
            inventoryItemId: widgetA.id,
            quantityShipped: 0,
          },
        ],
      },
    },
  });

  console.log('Creating stock movements...');
  await prisma.stockMovement.createMany({
    data: [
      {
        tenantId: acme.id,
        inventoryItemId: widgetB.id,
        stockLocationId: mainB201.id,
        movementType: 'RECEIVING',
        quantity: 60,
        referenceType: 'Receiving',
        referenceId: receivingCompleted.id,
        notes: 'Received from PO-0002',
        createdById: acmeStaff.id,
        createdAt: new Date('2026-06-02T10:00:00Z'),
      },
      {
        tenantId: acme.id,
        inventoryItemId: boltKit.id,
        stockLocationId: westC101.id,
        movementType: 'RECEIVING',
        quantity: 40,
        referenceType: 'Receiving',
        referenceId: receivingCompleted.id,
        createdById: acmeStaff.id,
        createdAt: new Date('2026-06-02T10:15:00Z'),
      },
      {
        tenantId: acme.id,
        inventoryItemId: boltKit.id,
        stockLocationId: westC101.id,
        movementType: 'SHIP',
        quantity: -5,
        referenceType: 'Shipment',
        referenceId: shipmentDelivered.id,
        notes: 'Shipped via SHP-0001',
        createdById: acmeStaff.id,
        createdAt: new Date('2026-06-07T14:30:00Z'),
      },
      {
        tenantId: acme.id,
        inventoryItemId: gadgetC.id,
        stockLocationId: mainA101.id,
        movementType: 'ADJUSTMENT',
        quantity: -2,
        notes: 'Cycle count correction',
        createdById: acmeManager.id,
        createdAt: new Date('2026-06-12T09:00:00Z'),
      },
      {
        tenantId: globalParts.id,
        inventoryItemId: globalMotor.id,
        stockLocationId: globalA101.id,
        movementType: 'ADJUSTMENT',
        quantity: 4,
        notes: 'Initial stock count',
        createdById: globalOwner.id,
        createdAt: new Date('2026-06-01T08:00:00Z'),
      },
    ],
  });

  console.log('Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        tenantId: acme.id,
        userId: acmeOwner.id,
        action: 'tenant.created',
        entityType: 'Tenant',
        entityId: acme.id,
        metadata: { name: acme.name },
        createdAt: new Date('2026-05-01T08:00:00Z'),
      },
      {
        tenantId: acme.id,
        userId: acmeManager.id,
        action: 'purchase_order.created',
        entityType: 'PurchaseOrder',
        entityId: poSubmitted.id,
        metadata: { number: 'PO-0001', status: 'SUBMITTED' },
        createdAt: new Date('2026-06-10T11:00:00Z'),
      },
      {
        tenantId: acme.id,
        userId: acmeStaff.id,
        action: 'receiving.completed',
        entityType: 'Receiving',
        entityId: receivingCompleted.id,
        metadata: { number: 'REC-0001' },
        createdAt: new Date('2026-06-02T10:30:00Z'),
      },
      {
        tenantId: acme.id,
        userId: acmeAdmin.id,
        action: 'order.created',
        entityType: 'Order',
        entityId: orderConfirmed.id,
        metadata: { number: 'ORD-0001' },
        createdAt: new Date('2026-06-18T15:00:00Z'),
      },
      {
        tenantId: globalParts.id,
        userId: globalOwner.id,
        action: 'inventory_item.created',
        entityType: 'InventoryItem',
        entityId: globalMotor.id,
        metadata: { sku: 'GP-MOTOR-01' },
        createdAt: new Date('2026-05-15T12:00:00Z'),
      },
    ],
  });

  console.log('\nSeed completed successfully.\n');
  console.log('Tenants:');
  console.log(`  - ${acme.name} (${acme.slug})`);
  console.log(`  - ${globalParts.name} (${globalParts.slug})`);
  console.log('\nDemo users (password for all):', DEFAULT_PASSWORD);
  console.log('  - owner@acme.test       (OWNER @ Acme, ADMIN @ Global Parts)');
  console.log('  - admin@acme.test       (ADMIN @ Acme)');
  console.log('  - manager@acme.test     (MANAGER @ Acme)');
  console.log('  - staff@acme.test       (STAFF @ Acme)');
  console.log('  - viewer@acme.test      (VIEWER @ Acme)');
  console.log('  - owner@global.test     (OWNER @ Global Parts)');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
