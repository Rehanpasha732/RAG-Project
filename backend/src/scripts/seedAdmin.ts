import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '../config/mongo';

/**
 * One-off: creates or promotes ADMIN_EMAIL/ADMIN_PASSWORD to role:'admin'.
 * Run with `npm run seed:admin`. Not required for the app to run.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed an admin.');
    process.exit(1);
  }

  const users = await getUsersCollection();
  const existing = await users.findOne({ email: email.toLowerCase() });

  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: 'admin', disabled: false } });
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({
      name: 'Admin',
      email: email.toLowerCase(),
      password: hashedPassword,
      created_at: new Date(),
      role: 'admin',
      disabled: false
    });
    console.log(`Created new admin user ${email}.`);
  }

  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
