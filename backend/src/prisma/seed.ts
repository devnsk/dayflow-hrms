import bcrypt from "bcryptjs";
import { prisma } from "./client";
import {
  UserRole,
  UserStatus,
  EmployeeStatus,
  EmploymentType,
  LeaveType,
} from "@prisma/client";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create a sample company
  const company = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      email: "hr@acme.com",
      phone: "9876543210",
      address: "123 Business Park",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      timezone: "Asia/Kolkata",
      currency: "INR",
      fiscalYearStart: 4,
      workingDays: [1, 2, 3, 4, 5],
    },
  });
  console.log(`✓ Company created: ${company.name}`);

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: "ENG" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Engineering",
        code: "ENG",
        description: "Software Engineering Department",
      },
    }),
    prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: "HR" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Human Resources",
        code: "HR",
        description: "HR Department",
      },
    }),
    prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: "FIN" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Finance",
        code: "FIN",
        description: "Finance Department",
      },
    }),
  ]);
  console.log(`✓ Departments created: ${departments.length}`);

  // Create designations
  const designations = await Promise.all([
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "CEO" } },
      update: {},
      create: {
        companyId: company.id,
        title: "Chief Executive Officer",
        code: "CEO",
        level: 10,
      },
    }),
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "CTO" } },
      update: {},
      create: {
        companyId: company.id,
        title: "Chief Technology Officer",
        code: "CTO",
        level: 9,
      },
    }),
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "ENG-MGR" } },
      update: {},
      create: {
        companyId: company.id,
        title: "Engineering Manager",
        code: "ENG-MGR",
        level: 7,
      },
    }),
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "SR-ENG" } },
      update: {},
      create: {
        companyId: company.id,
        title: "Senior Software Engineer",
        code: "SR-ENG",
        level: 5,
      },
    }),
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "SWE" } },
      update: {},
      create: {
        companyId: company.id,
        title: "Software Engineer",
        code: "SWE",
        level: 4,
      },
    }),
    prisma.designation.upsert({
      where: { companyId_code: { companyId: company.id, code: "HR-MGR" } },
      update: {},
      create: {
        companyId: company.id,
        title: "HR Manager",
        code: "HR-MGR",
        level: 6,
      },
    }),
  ]);
  console.log(`✓ Designations created: ${designations.length}`);

  // Create locations
  const location = await prisma.location.upsert({
    where: { companyId_code: { companyId: company.id, code: "BLR-HQ" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Bangalore HQ",
      code: "BLR-HQ",
      address: "123 Business Park",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      timezone: "Asia/Kolkata",
      isHeadquarters: true,
    },
  });
  console.log(`✓ Location created: ${location.name}`);

  // Create shifts
  const shift = await prisma.shift.upsert({
    where: { companyId_code: { companyId: company.id, code: "DAY" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Day Shift",
      code: "DAY",
      startTime: "09:00",
      endTime: "18:00",
      breakDuration: 60,
      graceMinutes: 15,
      workingHours: 8,
      isDefault: true,
    },
  });
  console.log(`✓ Shift created: ${shift.name}`);

  // Create leave types
  const leaveTypes = await Promise.all([
    prisma.companyLeaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: "CL" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Casual Leave",
        code: "CL",
        type: LeaveType.CASUAL_LEAVE,
        defaultBalance: 12,
        maxBalance: 12,
        carryForwardLimit: 0,
        allowHalfDay: true,
        requiresApproval: true,
        minDaysNotice: 1,
        isPaid: true,
      },
    }),
    prisma.companyLeaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: "SL" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Sick Leave",
        code: "SL",
        type: LeaveType.SICK_LEAVE,
        defaultBalance: 12,
        maxBalance: 12,
        carryForwardLimit: 0,
        allowHalfDay: true,
        requiresApproval: true,
        minDaysNotice: 0,
        isPaid: true,
      },
    }),
    prisma.companyLeaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: "PL" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Privilege Leave",
        code: "PL",
        type: LeaveType.PRIVILEGE_LEAVE,
        defaultBalance: 15,
        maxBalance: 30,
        carryForwardLimit: 15,
        encashmentAllowed: true,
        allowHalfDay: false,
        requiresApproval: true,
        minDaysNotice: 7,
        isPaid: true,
      },
    }),
    prisma.companyLeaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: "WFH" } },
      update: {},
      create: {
        companyId: company.id,
        name: "Work From Home",
        code: "WFH",
        type: LeaveType.WORK_FROM_HOME,
        defaultBalance: 24,
        maxBalance: 48,
        allowHalfDay: true,
        requiresApproval: true,
        minDaysNotice: 1,
        isPaid: true,
      },
    }),
  ]);
  console.log(`✓ Leave types created: ${leaveTypes.length}`);

  // Create holidays
  const holidays = await Promise.all([
    prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: company.id, date: new Date("2026-01-26") },
      },
      update: {},
      create: {
        companyId: company.id,
        name: "Republic Day",
        date: new Date("2026-01-26"),
        type: "PUBLIC",
      },
    }),
    prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: company.id, date: new Date("2026-03-14") },
      },
      update: {},
      create: {
        companyId: company.id,
        name: "Holi",
        date: new Date("2026-03-14"),
        type: "PUBLIC",
      },
    }),
    prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: company.id, date: new Date("2026-08-15") },
      },
      update: {},
      create: {
        companyId: company.id,
        name: "Independence Day",
        date: new Date("2026-08-15"),
        type: "PUBLIC",
      },
    }),
    prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: company.id, date: new Date("2026-10-02") },
      },
      update: {},
      create: {
        companyId: company.id,
        name: "Gandhi Jayanti",
        date: new Date("2026-10-02"),
        type: "PUBLIC",
      },
    }),
    prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: company.id, date: new Date("2026-11-04") },
      },
      update: {},
      create: {
        companyId: company.id,
        name: "Diwali",
        date: new Date("2026-11-04"),
        type: "PUBLIC",
      },
    }),
  ]);
  console.log(`✓ Holidays created: ${holidays.length}`);

  // Create admin user
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      companyId: company.id,
    },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: {
      companyId_employeeCode: {
        companyId: company.id,
        employeeCode: "EMP00001",
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      companyId: company.id,
      employeeCode: "EMP00001",
      firstName: "Admin",
      lastName: "User",
      email: "admin@acme.com",
      phone: "9876543210",
      joiningDate: new Date("2024-01-01"),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      departmentId: departments[1].id, // HR
      designationId: designations[5].id, // HR Manager
      locationId: location.id,
      shiftId: shift.id,
    },
  });
  console.log(`✓ Admin user created: ${adminUser.email}`);

  // Create salary structure for admin
  await prisma.salaryStructure.upsert({
    where: { employeeId: adminEmployee.id },
    update: {},
    create: {
      employeeId: adminEmployee.id,
      basicSalary: 50000,
      hra: 20000,
      da: 5000,
      ta: 5000,
      specialAllowance: 10000,
      medicalAllowance: 2500,
      pf: 6000,
      esi: 0,
      professionalTax: 200,
      tds: 5000,
      grossSalary: 92500,
      netSalary: 81300,
      ctc: 1182000,
      effectiveFrom: new Date("2024-01-01"),
    },
  });

  // Create a sample manager
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@acme.com" },
    update: {},
    create: {
      email: "manager@acme.com",
      passwordHash,
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      companyId: company.id,
    },
  });

  const managerEmployee = await prisma.employee.upsert({
    where: {
      companyId_employeeCode: {
        companyId: company.id,
        employeeCode: "EMP00002",
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      companyId: company.id,
      employeeCode: "EMP00002",
      firstName: "John",
      lastName: "Manager",
      email: "manager@acme.com",
      phone: "9876543211",
      joiningDate: new Date("2024-02-01"),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      departmentId: departments[0].id, // Engineering
      designationId: designations[2].id, // Engineering Manager
      locationId: location.id,
      shiftId: shift.id,
    },
  });
  console.log(`✓ Manager user created: ${managerUser.email}`);

  // Create salary structure for manager
  await prisma.salaryStructure.upsert({
    where: { employeeId: managerEmployee.id },
    update: {},
    create: {
      employeeId: managerEmployee.id,
      basicSalary: 80000,
      hra: 32000,
      da: 8000,
      ta: 8000,
      specialAllowance: 20000,
      medicalAllowance: 5000,
      pf: 9600,
      esi: 0,
      professionalTax: 200,
      tds: 15000,
      grossSalary: 153000,
      netSalary: 128200,
      ctc: 1951200,
      effectiveFrom: new Date("2024-02-01"),
    },
  });

  // Create a sample employee
  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@acme.com" },
    update: {},
    create: {
      email: "employee@acme.com",
      passwordHash,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      companyId: company.id,
    },
  });

  const sampleEmployee = await prisma.employee.upsert({
    where: {
      companyId_employeeCode: {
        companyId: company.id,
        employeeCode: "EMP00003",
      },
    },
    update: {},
    create: {
      userId: employeeUser.id,
      companyId: company.id,
      employeeCode: "EMP00003",
      firstName: "Jane",
      lastName: "Developer",
      email: "employee@acme.com",
      phone: "9876543212",
      joiningDate: new Date("2024-03-01"),
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      departmentId: departments[0].id, // Engineering
      designationId: designations[4].id, // Software Engineer
      locationId: location.id,
      shiftId: shift.id,
      managerId: managerEmployee.id,
    },
  });
  console.log(`✓ Employee user created: ${employeeUser.email}`);

  // Create salary structure for employee
  await prisma.salaryStructure.upsert({
    where: { employeeId: sampleEmployee.id },
    update: {},
    create: {
      employeeId: sampleEmployee.id,
      basicSalary: 40000,
      hra: 16000,
      da: 4000,
      ta: 4000,
      specialAllowance: 8000,
      medicalAllowance: 2000,
      pf: 4800,
      esi: 0,
      professionalTax: 200,
      tds: 3000,
      grossSalary: 74000,
      netSalary: 66000,
      ctc: 945600,
      effectiveFrom: new Date("2024-03-01"),
    },
  });

  // Create leave balances for employees
  const currentYear = new Date().getFullYear();
  for (const leaveType of leaveTypes) {
    for (const employee of [adminEmployee, managerEmployee, sampleEmployee]) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocated: leaveType.defaultBalance,
        },
      });
    }
  }
  console.log("✓ Leave balances created for all employees");

  console.log("\n✅ Database seeded successfully!\n");
  console.log("Sample login credentials:");
  console.log("─────────────────────────");
  console.log("Admin:    admin@acme.com    / Admin@123");
  console.log("Manager:  manager@acme.com  / Admin@123");
  console.log("Employee: employee@acme.com / Admin@123");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
