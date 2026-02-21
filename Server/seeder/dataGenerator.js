
import { faker } from '@faker-js/faker';

export const generateCommunity = () => {
    const name = faker.location.city() + ' ' + faker.helpers.arrayElement(['Heights', 'Residency', 'Apartments', 'Villas', 'Enclave']);
    const location = faker.location.streetAddress();

    // subscriptionStatus: active, pending, expired
    const subscriptionStatus = faker.helpers.arrayElement(['active', 'active', 'active', 'expired', 'pending']);

    const planStartDate = faker.date.past({ years: 1 });
    const planEndDate = new Date(planStartDate);
    planEndDate.setFullYear(planEndDate.getFullYear() + 1);

    return {
        name,
        location,
        description: faker.lorem.paragraph(),
        status: 'Active',
        subscriptionStatus,
        planStartDate,
        planEndDate,
        hasStructure: true, // defaulting to true for now to simplify resident generation
        profile: {
            photos: [], // Simplify for now
        },
        blocks: [] // Will be populated by main seeder or here
    };
};

export const generateManager = (communityId) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: 'password123', // constant password for testing
        contact: faker.phone.number(),
        assignedCommunity: communityId
    };
};

export const generateResident = (communityId, blockName, flatNumber) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const uCode = `${blockName}-${flatNumber}`;

    return {
        residentFirstname: firstName,
        residentLastname: lastName,
        uCode,
        email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(), // ensure unique
        password: 'password123',
        contact: faker.phone.number(),
        community: communityId,
        // Add other fields as needed
    };
};

export const generatePayment = (residentId, managerId, communityId, date) => {
    const amount = faker.number.int({ min: 1000, max: 5000 });
    const isPaid = faker.datatype.boolean(0.8); // 80% chance of being paid

    return {
        title: faker.helpers.arrayElement(['Monthly Maintenance', 'Water Bill', 'Electricity Bill', 'Event Contribution']),
        sender: residentId,
        receiver: managerId,
        amount, // varying amounts
        paymentDate: isPaid ? date : null,
        paymentDeadline: new Date(new Date(date).setDate(date.getDate() + 15)),
        status: isPaid ? 'Completed' : faker.helpers.arrayElement(['Pending', 'Overdue']),
        paymentMethod: isPaid ? faker.helpers.arrayElement(['UPI', 'Credit Card', 'Bank Transfer']) : 'None',
        community: communityId,
        transactionId: isPaid ? faker.string.alphanumeric(10).toUpperCase() : null
    };
};

export const generateWorker = (communityId) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const jobRole = faker.helpers.arrayElement([
        "Plumber", "Electrician", "Security", "Maintenance", "Pest Control", "Waste Management"
    ]);

    return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'worker.com' }).toLowerCase(),
        password: 'password123',
        jobRole: [jobRole],
        contact: faker.phone.number(),
        address: faker.location.streetAddress(),
        salary: faker.number.int({ min: 15000, max: 50000 }),
        joiningDate: faker.date.past({ years: 2 }),
        community: communityId,
        isActive: true
    };
};

export const generateSecurity = (communityId) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const shift = faker.helpers.arrayElement(["Day", "Night"]);

    return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'security.com' }).toLowerCase(),
        password: 'password123',
        contact: faker.phone.number(),
        address: faker.location.streetAddress(),
        community: communityId,
        Shift: shift,
        workplace: 'Main Gate',
        joiningDate: faker.date.past({ years: 1 })
    };
};

export const generateAmenity = (communityId) => {
    const type = faker.helpers.arrayElement([
        "Clubhouse", "Gym", "Banquet Hall", "Swimming Pool", "Tennis Court", "Badminton Court"
    ]);

    return {
        name: `${type} - ${faker.location.city()}`,
        type: type,
        description: faker.lorem.sentence(),
        Type: faker.helpers.arrayElement(["Slot", "Subscription"]),
        bookable: true,
        rent: faker.number.int({ min: 100, max: 1000 }), // Hourly/Daily rent
        community: communityId,
        bookedSlots: []
    };
};

export const generateIssue = (residentId, communityId, categoryType = "Resident") => {
    const category = categoryType === "Resident"
        ? faker.helpers.arrayElement(["Plumbing", "Electrical", "Maintenance", "Pest Control"])
        : faker.helpers.arrayElement(["Streetlight", "Elevator", "Garden", "Common Area"]);

    const status = faker.helpers.arrayElement([
        "Pending Assignment", "Assigned", "In Progress", "Closed", "Resolved (Awaiting Confirmation)"
    ]);

    return {
        title: `${category} Issue`,
        description: faker.lorem.paragraph(),
        status,
        priority: faker.helpers.arrayElement(["Normal", "High", "Urgent"]),
        categoryType,
        category,
        resident: residentId,
        community: communityId,
        location: categoryType === "Community" ? "Main Park" : "Flat", // Simplified
        estimatedCost: faker.number.int({ min: 0, max: 2000 })
    };
};

export const generateVisitor = (communityId, residentId, securityId) => {
    const status = faker.helpers.arrayElement(["Pending", "Approved", "Active", "CheckedOut"]);

    return {
        name: faker.person.fullName(),
        contactNumber: faker.phone.number(),
        email: faker.internet.email(),
        purpose: faker.helpers.arrayElement(["Delivery", "Guest", "Service", "Cab"]),
        vehicleNumber: faker.vehicle.vrm(),
        approvedBy: residentId,
        community: communityId,
        status,
        addedBy: securityId,
        checkInAt: status === 'Active' || status === 'CheckedOut' ? faker.date.recent() : null,
        checkOutAt: status === 'CheckedOut' ? faker.date.recent() : null,
    };
};

export const generateInterest = () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }),
        phone: faker.phone.number(),
        communityName: faker.company.name() + ' Residency',
        location: faker.location.city(),
        description: faker.lorem.sentence(),
        status: 'pending',
        paymentStatus: 'pending'
    };
};

export const generateCommunitySubscription = (communityId, date) => {
    const plan = faker.helpers.arrayElement([
        { name: 'Standard', type: 'standard', amount: 1999 },
        { name: 'Premium', type: 'premium', amount: 3999 },
        { name: 'Enterprise', type: 'enterprise', amount: 9999 }
    ]);

    const duration = faker.helpers.arrayElement(['monthly', 'yearly']);
    const planStartDate = new Date(date);
    const planEndDate = new Date(date);
    if (duration === 'monthly') planEndDate.setMonth(planEndDate.getMonth() + 1);
    else planEndDate.setFullYear(planEndDate.getFullYear() + 1);

    return {
        communityId,
        transactionId: 'TXN-' + faker.string.uuid(),
        planName: plan.name,
        planType: plan.type,
        amount: plan.amount,
        paymentMethod: faker.helpers.arrayElement(['Credit Card', 'UPI', 'Net Banking', 'Debit Card']),
        paymentDate: date,
        planStartDate,
        planEndDate,
        duration,
        status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'failed']),
        isRenewal: faker.datatype.boolean(),
        metadata: {
            userAgent: faker.internet.userAgent(),
            ipAddress: faker.internet.ip()
        }
    };
};
