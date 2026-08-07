import dotenv from 'dotenv';
dotenv.config();

import { sequelize, User, Lead, Task, Note, Activity, Notification } from '../models';
import { UserRole, LeadStatus, LeadPriority, LeadSource, TaskStatus, TaskPriority, NotificationType } from '../types';
import { ActivityType } from '../models/Activity';

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (tables recreated)');

    // Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      phone: '+91-9876543210',
    });

    const manager = await User.create({
      name: 'Priya Sharma',
      email: 'priya@crm.com',
      password: 'manager123',
      role: UserRole.MANAGER,
      phone: '+91-9876543211',
    });

    const sales1 = await User.create({
      name: 'Honey Kumar',
      email: 'honey@crm.com',
      password: 'sales123',
      role: UserRole.SALES,
      phone: '+91-9876543212',
    });

    const sales2 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@crm.com',
      password: 'sales123',
      role: UserRole.SALES,
      phone: '+91-9876543213',
    });

    console.log('✅ Users created');

    // Create Leads
    const leads = await Lead.bulkCreate([
      {
        name: 'John Smith', email: 'john@acme.com', phone: '+91-8001234567',
        company: 'Acme Pvt Ltd', requirement: 'We have around 80 employees. We need Cloud IVR with Call Recording. Can someone contact us?',
        status: LeadStatus.NEW, priority: LeadPriority.HIGH, source: LeadSource.WEBSITE,
        deal_value: 150000, assigned_to: sales1.id,
      },
      {
        name: 'Anita Desai', email: 'anita@globaltech.com', phone: '+91-8009876543',
        company: 'Global Tech Solutions', requirement: 'Need bulk SMS and voice broadcasting solution for 500+ customers.',
        status: LeadStatus.CONTACTED, priority: LeadPriority.URGENT, source: LeadSource.EMAIL,
        deal_value: 300000, assigned_to: sales1.id,
      },
      {
        name: 'Vikram Singh', email: 'vikram@startupx.io', phone: '+91-7001234567',
        company: 'StartupX', requirement: 'Looking for affordable IVR solution for our small team of 15.',
        status: LeadStatus.MEETING_SCHEDULED, priority: LeadPriority.MEDIUM, source: LeadSource.WHATSAPP,
        deal_value: 50000, assigned_to: sales2.id,
      },
      {
        name: 'Meera Patel', email: 'meera@bigcorp.com', phone: '+91-6001234567',
        company: 'BigCorp Industries', requirement: 'Enterprise IVR with multi-level menu, CRM integration, and analytics.',
        status: LeadStatus.PROPOSAL_SENT, priority: LeadPriority.HIGH, source: LeadSource.PHONE,
        deal_value: 500000, assigned_to: sales1.id,
      },
      {
        name: 'Arjun Reddy', email: 'arjun@nexgen.co', phone: '+91-5001234567',
        company: 'NexGen Services', requirement: 'Need OBD service for election campaign. 2 lakh calls per day.',
        status: LeadStatus.WON, priority: LeadPriority.URGENT, source: LeadSource.REFERRAL,
        deal_value: 800000, assigned_to: sales2.id,
      },
      {
        name: 'Sunita Joshi', email: 'sunita@freshmart.in', phone: '+91-4001234567',
        company: 'FreshMart', requirement: 'Basic IVR for customer support line.',
        status: LeadStatus.LOST, priority: LeadPriority.LOW, source: LeadSource.WEBSITE,
        deal_value: 30000, assigned_to: sales1.id, lost_reason: 'Budget constraints',
      },
    ]);

    console.log('✅ Leads created');

    // Create Tasks
    await Task.bulkCreate([
      {
        title: 'Call John from Acme', description: 'Follow up on IVR inquiry',
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH,
        due_date: new Date(Date.now() + 86400000), due_time: '10:00',
        lead_id: leads[0].id, assigned_to: sales1.id, created_by: manager.id,
      },
      {
        title: 'Send proposal to BigCorp', description: 'Enterprise IVR pricing',
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH,
        due_date: new Date(Date.now() + 172800000), due_time: '14:00',
        lead_id: leads[3].id, assigned_to: sales1.id, created_by: manager.id,
      },
      {
        title: 'Demo for StartupX', description: 'Prepare and deliver product demo',
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        due_date: new Date(Date.now() + 259200000), due_time: '11:00',
        lead_id: leads[2].id, assigned_to: sales2.id, created_by: manager.id,
      },
    ]);

    console.log('✅ Tasks created');

    // Create Activities
    for (const lead of leads) {
      await Activity.create({
        type: ActivityType.LEAD_CREATED,
        description: `Lead created for ${lead.name}`,
        lead_id: lead.id,
        user_id: admin.id,
      });
    }

    console.log('✅ Activities created');

    // Create Notes
    await Note.bulkCreate([
      { content: 'Customer wants discount. Budget around ₹1,20,000. Decision next week.', lead_id: leads[0].id, created_by: sales1.id },
      { content: 'Very interested. Needs multi-language support in IVR.', lead_id: leads[3].id, created_by: sales1.id },
    ]);

    console.log('✅ Notes created');

    // Create Notifications
    await Notification.bulkCreate([
      { type: NotificationType.LEAD_ASSIGNED, title: 'New Lead Assigned', message: 'Lead "John Smith" from Acme has been assigned to you.', user_id: sales1.id, lead_id: leads[0].id },
      { type: NotificationType.TASK_DUE, title: 'Task Due Tomorrow', message: 'Call John from Acme is due tomorrow at 10:00 AM.', user_id: sales1.id },
      { type: NotificationType.PAYMENT_RECEIVED, title: 'Payment Received', message: 'Payment of ₹8,00,000 received from NexGen Services.', user_id: sales2.id, lead_id: leads[4].id },
      { type: NotificationType.FOLLOW_UP, title: 'Follow-up Pending', message: 'Follow up with Global Tech Solutions regarding bulk SMS quote.', user_id: sales1.id, lead_id: leads[1].id },
    ]);

    console.log('✅ Notifications created');
    console.log('\n🎉 Seed completed! Login credentials:');
    console.log('  Admin:   admin@crm.com / admin123');
    console.log('  Manager: priya@crm.com / manager123');
    console.log('  Sales:   honey@crm.com / sales123');
    console.log('  Sales:   rahul@crm.com / sales123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
