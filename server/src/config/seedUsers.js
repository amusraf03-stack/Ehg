import 'dotenv/config'
import bcrypt from 'bcryptjs'

import pool from './db.js'
import {
  createUser,
  findRoleByName,
  findUserByEmail,
} from '../models/userModel.js'

const demoUsers = [
  {
    name: 'EHG Admin',
    email: 'admin@ehgholdings.com',
    password: 'Admin@123',
    role: 'ADMIN',
    department: 'Administration',
  },
  {
    name: 'EHG CEO',
    email: 'ceo@ehgholdingss.com',
    password: 'Ceo@12345',
    role: 'CEO',
    department: 'Management',
  },
  {
    name: 'EHG Manager',
    email: 'manager@ehgholdings.com',
    password: 'Manager@123',
    role: 'MANAGER',
    department: 'Tender Management',
  },
  {
    name: 'EHG Employee',
    email: 'testhgholdings@gmail.com',
    password: 'Test@123',
    role: 'EMPLOYEE',
    department: 'Tender Operations',
  },
]

const seedUsers = async () => {
  try {
    console.log('Seeding EHG Holdings demo users...')

    for (const demoUser of demoUsers) {
      const existingUser = await findUserByEmail(demoUser.email)

      if (existingUser) {
        console.log(`Skipped existing user: ${demoUser.email}`)
        continue
      }

      const role = await findRoleByName(demoUser.role)

      if (!role) {
        throw new Error(
          `Role ${demoUser.role} does not exist. Run npm run db:init first.`
        )
      }

      const passwordHash = await bcrypt.hash(demoUser.password, 12)

      await createUser({
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        roleId: role.id,
        department: demoUser.department,
        status: 'ACTIVE',
      })

      console.log(`Created ${demoUser.role}: ${demoUser.email}`)
    }

    console.log('Demo users seeded successfully.')
  } catch (error) {
    console.error('User seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

seedUsers()