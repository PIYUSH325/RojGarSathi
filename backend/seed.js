const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
require('dotenv').config();

const connectDB = require('./config/db');

const jobData = [
  {
    title: 'Experienced Plumber',
    description: 'Need a reliable plumber for residential work in Bandra. Must have 5 years experience. Full-time position with benefits. Handle repairs, installations, and maintenance.',
    category: 'Factory Work',
    city: 'Mumbai',
    pincode: '400050',
    salary: 35000,
    status: 'open',
    requirements: ['5+ years experience', 'Own tools preferred', 'Valid license'],
    postedBy: 'ABC Constructions'
  },
  {
    title: 'Delivery Driver',
    description: 'Immediate opening for delivery driver with own motorbike. Full-time work, excellent pay. Routes within city limits. Timely deliveries essential.',
    category: 'Delivery & Driving',
    city: 'Delhi',
    pincode: '110001',
    salary: 30000,
    status: 'open',
    requirements: ['Own vehicle', 'Valid license', 'Smartphone required'],
    postedBy: 'QuickDeliveries'
  },
  {
    title: 'Housekeeping Staff',
    description: 'Part-time housekeeper required for a family home in Chennai. References essential. Flexible hours. Cleaning, laundry, and basic cooking.',
    category: 'Housekeeping',
    city: 'Chennai',
    pincode: '600004',
    salary: 15000,
    status: 'closed',
    requirements: ['Experience in cleaning', 'References'],
    postedBy: 'Family Home'
  },
  {
    title: 'Electrician Assistant',
    description: 'Entry-level position helping senior electrician. Training provided. Great career start! Work on various sites including wiring and troubleshooting.',
    category: 'Factory Work',
    city: 'Mumbai',
    pincode: '400010',
    salary: 20000,
    status: 'open',
    requirements: ['Basic electrical knowledge', 'Willing to learn'],
    postedBy: 'ElectroWorks'
  },
  {
    title: 'Retail Store Helper',
    description: 'Shop helper needed for a busy retail outlet. Shifts available, must be fluent in Hindi. Customer service focus, stocking shelves, and cashier duties.',
    category: 'Retail & Shop',
    city: 'Bengaluru',
    pincode: '560001',
    salary: 22000,
    status: 'open',
    requirements: ['Hindi fluent', 'Customer service'],
    postedBy: 'RetailMart'
  },
  {
    title: 'Bike Courier/Rider',
    description: 'Immediate requirement for fast and reliable bike couriers in Gachibowli area. Handle package deliveries across the city.',
    category: 'Delivery & Driving',
    city: 'Hyderabad',
    pincode: '500034',
    salary: 28000,
    status: 'open',
    requirements: ['Valid bike license', 'GPS navigation skills'],
    postedBy: 'FastCourier'
  },
  {
    title: 'Security Guard (Night Shift)',
    description: 'Seeking alert and responsible security personnel for a corporate office. Monitor premises and report incidents.',
    category: 'Security',
    city: 'Pune',
    pincode: '411005',
    salary: 25000,
    status: 'open',
    requirements: ['Physical fitness', 'Basic security training'],
    postedBy: 'SecureCorp'
  },
  {
    title: 'Residential AC Technician',
    description: 'Experienced AC maintenance and repair technician needed in central Kolkata. Service calls and installations.',
    category: 'Factory Work',
    city: 'Kolkata',
    pincode: '700001',
    salary: 38000,
    status: 'open',
    requirements: ['AC certification', '2+ years experience'],
    postedBy: 'CoolTech Services'
  },
  {
    title: 'Assistant Cook - Indian Cuisine',
    description: 'Help preparing daily meals for a large factory canteen. Basic cooking skills required. Team environment.',
    category: 'Housekeeping',
    city: 'Mumbai',
    pincode: '400001',
    salary: 24000,
    status: 'open',
    requirements: ['Basic cooking knowledge', 'Hygiene standards'],
    postedBy: 'Factory Canteen'
  },
  {
    title: 'Outbound Telesales Executive',
    description: 'Call center role, selling low-cost digital services. Targets apply. Commission based.',
    category: 'Factory Work',
    city: 'Noida',
    pincode: '201301',
    salary: 26000,
    status: 'open',
    requirements: ['Good communication', 'Sales experience'],
    postedBy: 'TeleSales Inc'
  },
  {
    title: 'Carpenter Helper',
    description: 'Assist experienced carpenter with furniture making and repairs. Learn woodworking skills. Full-time position.',
    category: 'Construction',
    city: 'Ahmedabad',
    pincode: '380001',
    salary: 22000,
    status: 'open',
    requirements: ['Basic tool knowledge', 'Physical strength'],
    postedBy: 'WoodWorks'
  },
  {
    title: 'Waiter/Waitress',
    description: 'Restaurant service staff needed for busy cafe. Handle orders, serve food, and maintain cleanliness.',
    category: 'Housekeeping',
    city: 'Jaipur',
    pincode: '302001',
    salary: 18000,
    status: 'open',
    requirements: ['Customer service skills', 'Basic English'],
    postedBy: 'Cafe Corner'
  },
  {
    title: 'Data Entry Operator',
    description: 'Office work entering data into computer systems. Typing speed required. Mon-Fri schedule.',
    category: 'Factory Work',
    city: 'Chandigarh',
    pincode: '160001',
    salary: 20000,
    status: 'open',
    requirements: ['Typing speed 30+ WPM', 'Basic computer skills'],
    postedBy: 'DataCorp'
  },
  {
    title: 'Gardener/Landscaper',
    description: 'Maintain gardens and landscapes for residential complexes. Experience with plants and tools required.',
    category: 'Factory Work',
    city: 'Surat',
    pincode: '395001',
    salary: 25000,
    status: 'open',
    requirements: ['Plant knowledge', 'Gardening tools'],
    postedBy: 'GreenSpaces'
  },
  {
    title: 'Auto Mechanic Assistant',
    description: 'Help with vehicle repairs and maintenance. Learn automotive skills. Busy garage environment.',
    category: 'Factory Work',
    city: 'Nagpur',
    pincode: '440001',
    salary: 24000,
    status: 'open',
    requirements: ['Basic mechanical knowledge', 'Willing to work with tools'],
    postedBy: 'AutoFix Garage'
  },
  {
    title: 'Pharmacy Assistant',
    description: 'Help in retail pharmacy with customer service and inventory management. Healthcare background preferred.',
    category: 'Factory Work',
    city: 'Indore',
    pincode: '452001',
    salary: 22000,
    status: 'open',
    requirements: ['Basic pharma knowledge', 'Customer service'],
    postedBy: 'MediCare Pharmacy'
  },
  {
    title: 'Construction Laborer',
    description: 'General labor work on construction sites. Physical work including lifting and moving materials.',
    category: 'Construction',
    city: 'Bhopal',
    pincode: '462001',
    salary: 20000,
    status: 'open',
    requirements: ['Physical fitness', 'Construction site experience'],
    postedBy: 'BuildRight Construction'
  },
  {
    title: 'Hotel Housekeeping',
    description: 'Clean and maintain hotel rooms and common areas. Attention to detail required.',
    category: 'Housekeeping',
    city: 'Goa',
    pincode: '403001',
    salary: 16000,
    status: 'open',
    requirements: ['Cleaning experience', 'Reliability'],
    postedBy: 'Sunset Resort'
  },
  {
    title: 'Mobile Phone Technician',
    description: 'Repair and service mobile phones. Experience with various brands. Busy repair shop.',
    category: 'Factory Work',
    city: 'Coimbatore',
    pincode: '641001',
    salary: 28000,
    status: 'open',
    requirements: ['Mobile repair experience', 'Technical skills'],
    postedBy: 'MobileFix'
  },
  {
    title: 'Tailor/Seamstress',
    description: 'Alter and repair clothing. Custom tailoring work. Experience with sewing machines.',
    category: 'Factory Work',
    city: 'Lucknow',
    pincode: '226001',
    salary: 23000,
    status: 'open',
    requirements: ['Sewing skills', 'Fashion knowledge'],
    postedBy: 'Fashion Studio'
  },
  {
    title: 'Petrol Pump Attendant',
    description: 'Handle fuel dispensing and customer service at petrol station. Night shifts available.',
    category: 'Factory Work',
    city: 'Patna',
    pincode: '800001',
    salary: 19000,
    status: 'open',
    requirements: ['Customer service', 'Basic math skills'],
    postedBy: 'FuelMax Station'
  },
  {
    title: 'Warehouse Packer',
    description: 'Pack and prepare orders for shipping. Fast-paced warehouse environment. Team work.',
    category: 'Factory Work',
    city: 'Ghaziabad',
    pincode: '201001',
    salary: 21000,
    status: 'open',
    requirements: ['Physical stamina', 'Attention to detail'],
    postedBy: 'LogiCorp'
  },
  {
    title: 'Barber/Hair Stylist',
    description: 'Provide hair cutting and styling services. Experience preferred but training available.',
    category: 'Factory Work',
    city: 'Kanpur',
    pincode: '208001',
    salary: 25000,
    status: 'open',
    requirements: ['Hair cutting skills', 'Customer service'],
    postedBy: 'StyleCuts Salon'
  },
  {
    title: 'Security Guard (Day Shift)',
    description: 'Monitor and secure commercial premises during day hours. Professional appearance required.',
    category: 'Security',
    city: 'Vadodara',
    pincode: '390001',
    salary: 23000,
    status: 'open',
    requirements: ['Security training', 'Alertness'],
    postedBy: 'SecureGuard Services'
  },
  {
    title: 'Computer Operator',
    description: 'Operate computers for data processing and administrative work. MS Office proficiency required.',
    category: 'Factory Work',
    city: 'Raipur',
    pincode: '492001',
    salary: 24000,
    status: 'open',
    requirements: ['MS Office skills', 'Typing speed'],
    postedBy: 'AdminCorp'
  },
  {
    title: 'Painter/Decorator',
    description: 'Interior and exterior painting work. Experience with different paint types and techniques.',
    category: 'Construction',
    city: 'Nashik',
    pincode: '422001',
    salary: 26000,
    status: 'open',
    requirements: ['Painting experience', 'Color knowledge'],
    postedBy: 'PaintMasters'
  },
  {
    title: 'Delivery Executive',
    description: 'Deliver food and packages using electric scooter. GPS navigation and customer interaction.',
    category: 'Delivery & Driving',
    city: 'Visakhapatnam',
    pincode: '530001',
    salary: 22000,
    status: 'open',
    requirements: ['Valid license', 'Navigation skills'],
    postedBy: 'QuickDelivery'
  },
  {
    title: 'Laundry Attendant',
    description: 'Operate washing machines and dryers. Fold and package clean laundry. Hotel environment.',
    category: 'Housekeeping',
    city: 'Udaipur',
    pincode: '313001',
    salary: 17000,
    status: 'open',
    requirements: ['Laundry experience', 'Attention to detail'],
    postedBy: 'Heritage Hotel'
  },
  {
    title: 'Cable TV Technician',
    description: 'Install and repair cable TV connections. Technical knowledge of cable systems required.',
    category: 'Factory Work',
    city: 'Agra',
    pincode: '282001',
    salary: 27000,
    status: 'open',
    requirements: ['Cable installation experience', 'Technical skills'],
    postedBy: 'CableNet Services'
  },
  {
    title: 'Mason Helper',
    description: 'Assist mason with bricklaying and construction work on residential buildings. Physical strength required.',
    category: 'Construction',
    city: 'Jaipur',
    pincode: '302001',
    salary: 22000,
    status: 'open',
    requirements: ['Physical fitness', 'Basic construction knowledge'],
    postedBy: 'BuildMasters'
  },
  {
    title: 'Taxi Driver',
    description: 'Drive passengers in a taxi service. Knowledge of city routes essential. Full-time shifts available.',
    category: 'Delivery & Driving',
    city: 'Delhi',
    pincode: '110001',
    salary: 25000,
    status: 'open',
    requirements: ['Valid license', 'City navigation skills'],
    postedBy: 'CityTaxi'
  },
  {
    title: 'Babysitter',
    description: 'Care for children in a family home. Experience with kids preferred. Flexible hours.',
    category: 'Housekeeping',
    city: 'Mumbai',
    pincode: '400050',
    salary: 18000,
    status: 'open',
    requirements: ['Experience with children', 'Reliability'],
    postedBy: 'FamilyCare'
  },
  {
    title: 'Welder',
    description: 'Perform welding tasks on construction sites. Certification preferred. Safety gear provided.',
    category: 'Construction',
    city: 'Pune',
    pincode: '411005',
    salary: 32000,
    status: 'open',
    requirements: ['Welding certification', 'Safety knowledge'],
    postedBy: 'WeldTech'
  },
  {
    title: 'Photographer Assistant',
    description: 'Assist professional photographer with shoots. Basic photography skills helpful. Creative environment.',
    category: 'Factory Work',
    city: 'Bengaluru',
    pincode: '560001',
    salary: 24000,
    status: 'open',
    requirements: ['Basic photography knowledge', 'Creativity'],
    postedBy: 'LensArt Studios'
  },
  {
    title: 'Event Staff',
    description: 'Work at events handling setup, crowd management, and coordination. Part-time and full-time available.',
    category: 'Factory Work',
    city: 'Chennai',
    pincode: '600004',
    salary: 20000,
    status: 'open',
    requirements: ['Customer service', 'Flexibility'],
    postedBy: 'EventPro'
  },
  {
    title: 'Fitness Trainer',
    description: 'Train clients in gym settings. Certification required. Motivate and guide fitness routines.',
    category: 'Factory Work',
    city: 'Hyderabad',
    pincode: '500034',
    salary: 30000,
    status: 'open',
    requirements: ['Fitness certification', 'Motivational skills'],
    postedBy: 'FitLife Gym'
  },
  {
    title: 'Graphic Designer',
    description: 'Create visual content for marketing. Proficiency in design software essential.',
    category: 'Factory Work',
    city: 'Kolkata',
    pincode: '700001',
    salary: 35000,
    status: 'open',
    requirements: ['Adobe Suite skills', 'Creativity'],
    postedBy: 'DesignHub'
  },
  {
    title: 'Accountant Assistant',
    description: 'Assist with bookkeeping and financial records. Basic accounting knowledge required.',
    category: 'Factory Work',
    city: 'Ahmedabad',
    pincode: '380001',
    salary: 28000,
    status: 'open',
    requirements: ['Accounting basics', 'Attention to detail'],
    postedBy: 'FinanceCorp'
  },
  {
    title: 'Nurse Aid',
    description: 'Assist nurses in healthcare facilities. Compassion and basic medical knowledge needed.',
    category: 'Factory Work',
    city: 'Lucknow',
    pincode: '226001',
    salary: 22000,
    status: 'open',
    requirements: ['Basic medical training', 'Compassion'],
    postedBy: 'MediCare Hospital'
  },
  {
    title: 'Software Tester',
    description: 'Test software applications for bugs. Attention to detail crucial. Entry-level welcome.',
    category: 'Factory Work',
    city: 'Noida',
    pincode: '201301',
    salary: 30000,
    status: 'open',
    requirements: ['Basic IT knowledge', 'Detail-oriented'],
    postedBy: 'TechSolutions'
  },
  {
    title: 'Chef',
    description: 'Prepare meals in a restaurant kitchen. Culinary skills and creativity required.',
    category: 'Housekeeping',
    city: 'Goa',
    pincode: '403001',
    salary: 40000,
    status: 'open',
    requirements: ['Culinary training', 'Creativity'],
    postedBy: 'BeachBistro'
  },
  {
    title: 'Electrician',
    description: 'Install and repair electrical systems. License required. Residential and commercial work.',
    category: 'Factory Work',
    city: 'Surat',
    pincode: '395001',
    salary: 33000,
    status: 'open',
    requirements: ['Electrical license', 'Technical skills'],
    postedBy: 'ElectroFix'
  },
  {
    title: 'Sales Representative',
    description: 'Sell products in retail stores. Customer interaction and sales targets.',
    category: 'Retail & Shop',
    city: 'Indore',
    pincode: '452001',
    salary: 22000,
    status: 'open',
    requirements: ['Customer service', 'Sales experience'],
    postedBy: 'RetailCorp'
  }
];

const seedDB = async () => {
  try {
    await connectDB();

    // Create or find sample employer
    let sampleEmployer = await User.findOne({ email: 'employer@example.com' });
    if (!sampleEmployer) {
      sampleEmployer = await User.create({
        name: 'Sample Employer',
        email: 'employer@example.com',
        password: 'password123', // Will be hashed by pre-save middleware
        role: 'employer',
        phone: '1234567890'
      });
    }
    const sampleEmployerId = sampleEmployer._id;

    // Create permanent admin user if not exists
    let adminUser = await User.findOne({ email: 'admin@rojgarsathi.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'RojgarSathi Admin',
        email: 'admin@rojgarsathi.com',
        password: 'admin123456', // Will be hashed by pre-save middleware
        role: 'admin',
        phone: '9999999999',
        verified: true
      });
      console.log('Permanent Admin created: Email - admin@rojgarsathi.com, Password - admin123456');
    }

    // Create jobs with employer, inserting each sample job only if it doesn't exist by title
    let insertedCount = 0;
    for (const jobDataItem of jobData) {
      const existingJob = await Job.findOne({ title: jobDataItem.title });
      if (!existingJob) {
        const newJob = {
          ...jobDataItem,
          employer: sampleEmployerId,
          postedBy: sampleEmployerId
        };
        await Job.create(newJob);
        insertedCount++;
      }
    }
    if (insertedCount > 0) {
      console.log(`${insertedCount} sample jobs seeded successfully!`);
    } else {
      console.log('All sample jobs already exist in the database.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
  
